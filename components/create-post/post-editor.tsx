import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import {
  BridgeExtension,
  RichText,
  TenTapStartKit,
  useEditorBridge,
  type EditorBridge,
} from "@10play/tentap-editor";

const EDITOR_CSS = `
  * {
    font-family: -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif;
    color: #FFFFFF !important;
    caret-color: #FFFFFF;
    -webkit-text-fill-color: #FFFFFF;
  }
  html, body {
    background-color: #1A1919;
    padding: 0;
    margin: 0;
    overflow: hidden !important;
  }
  #root > div:first-child,
  .dynamic-height {
    overflow: hidden !important;
  }
  .ProseMirror {
    min-height: 36px !important;
  }
  .tiptap {
    padding: 0;
    outline: none;
  }
  .tiptap p {
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
    margin: 0;
  }
  .tiptap h1, .tiptap h2, .tiptap h3 {
    font-size: 18px;
    line-height: 26px;
    font-weight: 700;
    margin: 0 0 4px 0;
  }
  .is-editor-empty:first-child::before {
    color: #656464 !important;
    -webkit-text-fill-color: #656464 !important;
  }
  .ProseMirror-menubar,
  .floating-menu,
  [data-tippy-root],
  .tippy-box {
    display: none !important;
  }
`;

// Bridge extension that injects dark theme CSS at page load time
// (via WebView's injectedJavaScript prop, before any content renders)
const DarkThemeBridge = new BridgeExtension({
  forceName: "dark-theme",
  extendCSS: EDITOR_CSS,
});

const EMPTY_EDITOR_HTML = "<p></p>";

const FORCE_HEIGHT_RECALC_JS =
  "(function(){var pm=document.querySelector('.ProseMirror');" +
  "if(pm){" +
  "void pm.offsetHeight;" +
  "var h=Math.max(pm.scrollHeight||0,pm.getBoundingClientRect().height||0);" +
  "if(h>0){" +
  "window.ReactNativeWebView.postMessage(JSON.stringify({type:'document-height',payload:h+0.1}));" +
  "requestAnimationFrame(function(){" +
  "window.ReactNativeWebView.postMessage(JSON.stringify({type:'document-height',payload:h}));});}" +
  "}})();true;";

function normalizeEditorHtml(content: string) {
  return content.trim().length > 0 ? content : EMPTY_EDITOR_HTML;
}

function PostEditorInner({
  initialContent,
  onChange,
  onFocus,
  onBlur,
  autoFocus,
  placeholder = "What would you like to share?",
  editorRef,
}: {
  initialContent: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  editorRef?: (editor: EditorBridge) => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKnownHtmlRef = useRef(normalizeEditorHtml(initialContent));

  const editor = useEditorBridge({
    autofocus: autoFocus ?? false,
    avoidIosKeyboard: false,
    dynamicHeight: true,
    initialContent: normalizeEditorHtml(initialContent),
    bridgeExtensions: [...TenTapStartKit, DarkThemeBridge],
    theme: {
      webview: {
        backgroundColor: "#1A1919",
      },
      webviewContainer: {
        minHeight: 36,
      },
    },
    onChange: () => {
      editor.injectJS(FORCE_HEIGHT_RECALC_JS);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const html = await editor.getHTML();
        lastKnownHtmlRef.current = normalizeEditorHtml(html);
        onChangeRef.current(html);
      }, 300);
    },
  });

  const editorState = editor.getEditorState();
  const isEditorReady = Boolean((editorState as any).isReady);
  const isEditorFocused = Boolean((editorState as any).isFocused);

  // Set placeholder and force WebView repaint once editor is ready.
  // No hasSetup guard — the library remounts the WebView on iOS (key
  // workaround for react-native-webview#3578), so this must re-run
  // each time isEditorReady transitions back to true.
  useEffect(() => {
    if (!isEditorReady) return;

    editor.setPlaceholder(placeholder);

    // Periodically force repaint + height recalc until editor renders.
    // The WebView sometimes needs multiple attempts before ProseMirror
    // content becomes visible (race condition with bridge init).
    let attempt = 0;
    const interval = setInterval(() => {
      attempt++;

      // First two attempts: focus/blur to force WebView repaint
      if (attempt <= 2) {
        editor.focus();
        setTimeout(() => editor.blur(), 50);
      }

      editor.injectJS(FORCE_HEIGHT_RECALC_JS);

      if (attempt >= 10) clearInterval(interval);
    }, 300);

    return () => clearInterval(interval);
  }, [editor, isEditorReady, placeholder]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Expose the editor bridge to parent
  const hasSetRef = useRef(false);
  useEffect(() => {
    if (editorRef && !hasSetRef.current) {
      hasSetRef.current = true;
      editorRef(editor);
    }
  }, [editor, editorRef]);

  // Detect focus/blur for active post tracking
  useEffect(() => {
    if (isEditorFocused) {
      onFocusRef.current?.();
    } else {
      onBlurRef.current?.();
    }
  }, [isEditorFocused]);

  // Fire onBlur when the editor unmounts (e.g. switching active post)
  useEffect(() => {
    return () => {
      onBlurRef.current?.();
    };
  }, []);

  return (
    <View style={{ minHeight: 36 }}>
      <RichText
        editor={editor}
        androidLayerType={Platform.OS === "android" ? "software" : undefined}
      />
    </View>
  );
}

// The editor manages its own content internally via the WebView — never
// re-render due to initialContent changes (which come from the editor's own
// onChange feedback loop). Only placeholder and autoFocus matter externally.
export const PostEditor = React.memo(
  PostEditorInner,
  (prevProps, nextProps) =>
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.autoFocus === nextProps.autoFocus,
);

export type { EditorBridge };
