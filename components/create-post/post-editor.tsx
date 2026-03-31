import React, { useEffect, useRef, useState } from "react";

import { RichEditor, actions } from "react-native-pell-rich-editor";

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
        richEditorRef.current?.sendAction(actions.setBold, "result");
      },
      toggleUnderline: () => {
        richEditorRef.current?.sendAction(actions.setUnderline, "result");
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
        return richEditorRef.current?.getContentHtml().then((html) => html ?? "<p></p>") ??
          Promise.resolve("<p></p>");
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
    onChangeRef.current(html || "<p></p>");
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
        cssText: `* { outline: none; } body { margin: 0; padding: 0; background: transparent; }`,
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

