import React, { useEffect, useRef, useState } from "react";

import { RichEditor } from "react-native-pell-rich-editor";

/**
 * Pell uses `document.execCommand('bold')`, which produces `<b>` tags on
 * iOS/WebKit. The web composer (TipTap) and downstream `stripHtmlValidation`
 * expect `<strong>`, so we normalize on the way out. The pattern matches
 * `<b>` and `<b ...>` (and their closers) without touching `<br>`,
 * `<button>`, `<blockquote>`, etc., since those have a non-`>` non-space
 * character right after `b`.
 *
 * Also flattens any single-level nesting between `<strong>` and `<u>` so
 * the saved value is *either* bold *or* underline, never both. Pasted
 * content is the main source of nested markup — interactive bold/underline
 * toggling is mutex-guarded in the bridge, but paste bypasses that.
 */
function normalizeBold(html: string): string {
  let out = html
    .replace(/<b(\s[^>]*)?>/gi, (_match, attrs) => `<strong${attrs ?? ""}>`)
    .replace(/<\/b>/gi, "</strong>");
  // Strip <u> tags found inside <strong>...</strong>, then strip <strong>
  // tags found inside <u>...</u>. Single non-greedy pass each — covers the
  // realistic paste/import shapes without risking malformed-HTML breakage.
  out = out.replace(
    /<strong(\s[^>]*)?>([\s\S]*?)<\/strong>/gi,
    (_m, attrs, inner: string) =>
      `<strong${attrs ?? ""}>${inner.replace(/<\/?u(\s[^>]*)?>/gi, "")}</strong>`,
  );
  out = out.replace(
    /<u(\s[^>]*)?>([\s\S]*?)<\/u>/gi,
    (_m, attrs, inner: string) =>
      `<u${attrs ?? ""}>${inner.replace(/<\/?strong(\s[^>]*)?>/gi, "")}</u>`,
  );
  return out;
}

export type EditorBridge = {
  toggleBold: () => void;
  toggleUnderline: () => void;
  focus: () => void;
  blur: () => void;
  injectJS: (js: string) => void;
  insertText: (text: string) => void;
  getHTML: () => Promise<string>;
  setPlaceholder: (text: string) => void;
  getEditorState: () => { isReady: boolean; isFocused: boolean };
};

function PostEditorInner({
  initialContent,
  onChange,
  onFocus,
  onBlur,
  onReady,
  autoFocus,
  placeholder = "What would you like to share?",
  editorRef,
}: {
  initialContent: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onReady?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  editorRef?: (editor: EditorBridge) => void;
}) {
  "use no memo";
  const richEditorRef = useRef<RichEditor>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const isFocusedRef = useRef(false);
  const isReadyRef = useRef(false);
  const [isFocused, setIsFocused] = useState(!!autoFocus);

  const bridgeRef = useRef<EditorBridge | null>(null);
  if (!bridgeRef.current) {
    bridgeRef.current = {
      toggleBold: () => {
        // Mutex with underline: if the selection is currently underlined,
        // toggle underline off first so we never end up with nested
        // <strong><u> or <u><strong>. Same shape as toggleUnderline below.
        richEditorRef.current?.commandDOM(
          "if (document.queryCommandState('underline')) document.execCommand('underline'); document.execCommand('bold')",
        );
      },
      toggleUnderline: () => {
        richEditorRef.current?.commandDOM(
          "if (document.queryCommandState('bold')) document.execCommand('bold'); document.execCommand('underline')",
        );
      },
      focus: () => {
        richEditorRef.current?.focusContentEditor();
      },
      blur: () => {
        richEditorRef.current?.blurContentEditor();
      },
      injectJS: (js: string) => {
        richEditorRef.current?.commandDOM(js);
      },
      insertText: (text: string) => {
        richEditorRef.current?.insertText(text);
      },
      getHTML: () => {
        return (
          richEditorRef.current
            ?.getContentHtml()
            .then((html) => normalizeBold(html ?? "") || "<p></p>") ??
          Promise.resolve("<p></p>")
        );
      },
      setPlaceholder: () => {},
      getEditorState: () => ({
        isReady: isReadyRef.current,
        isFocused: isFocusedRef.current,
      }),
    };
  }

  const hasSetRef = useRef(false);
  useEffect(() => {
    if (editorRef && !hasSetRef.current) {
      hasSetRef.current = true;
      editorRef(bridgeRef.current!);
    }
  }, [editorRef]);

  useEffect(() => {
    return () => {
      onBlurRef.current?.();
    };
  }, []);

  const handleFocus = () => {
    isFocusedRef.current = true;
    setIsFocused(true);
    onFocusRef.current?.();
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setIsFocused(false);
    onBlurRef.current?.();
  };

  const handleChange = (html: string) => {
    onChangeRef.current(normalizeBold(html) || "<p></p>");
  };

  const handleEditorInitialized = () => {
    isReadyRef.current = true;
    onReadyRef.current?.();
  };

  // Dynamically update text color when focus state changes
  useEffect(() => {
    if (!isReadyRef.current) return;
    const color = isFocused ? "#FFFFFF" : "#A3A3A3";
    richEditorRef.current?.commandDOM(
      `document.querySelector('[contenteditable]').style.color = '${color}'`,
    );
  }, [isFocused]);

  const textColor = isFocused ? "#FFFFFF" : "#A3A3A3";

  return (
    <RichEditor
      ref={richEditorRef}
      initialContentHTML={initialContent || undefined}
      initialHeight={20}
      initialFocus={autoFocus}
      placeholder={placeholder}
      // Pell defaults to wrapping each line in <div>, but the rest of the
      // stack (web composer, backend stripHtmlValidation, provider previews)
      // expects <p>. The library forwards this into the iframe so Enter
      // emits <p> blocks that match the web editor's TipTap output.
      defaultParagraphSeparator="p"
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      editorInitializedCallback={handleEditorInitialized}
      useContainer
      editorStyle={{
        backgroundColor: "transparent",
        color: textColor,
        caretColor: "#FFFFFF",
        placeholderColor: "#656464",
        contentCSSText: `font-size: 14px; line-height: 20px; padding: 0; color: ${textColor};`,
        cssText: `* { outline: none; } body { margin: 0; padding: 0; background: transparent; } p { margin: 0; padding: 0; } p:empty::before { content: '\\200B'; }`,
      }}
      style={{ backgroundColor: "transparent" }}
      disabled={false}
    />
  );
}

export const PostEditor = React.memo(
  PostEditorInner,
  (prevProps, nextProps) => prevProps.placeholder === nextProps.placeholder,
);

export function forceEditorRepaint(_editor: EditorBridge) {
  // No-op with RichEditor
}

