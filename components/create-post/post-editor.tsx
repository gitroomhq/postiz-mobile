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
    min-height: 100px !important;
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

// Reset internal scroll position — prevents WKWebView from scrolling content
// above the visible area when the editor gains focus with dynamicHeight.
const RESET_SCROLL_JS =
  "(function(){" +
  "var dh=document.querySelector('.dynamic-height');" +
  "if(dh)dh.scrollTop=0;" +
  "var root=document.querySelector('#root>div');" +
  "if(root)root.scrollTop=0;" +
  "document.documentElement.scrollTop=0;" +
  "document.body.scrollTop=0;" +
  "})();true;";

const FORCE_HEIGHT_RECALC_JS =
  "(function(){var pm=document.querySelector('.ProseMirror');" +
  "if(pm){var h=Math.max(pm.scrollHeight||0,pm.getBoundingClientRect().height||0);" +
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
        minHeight: 100,
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
  const hasSetup = useRef(false);

  // Set placeholder and force WebView repaint once editor is ready
  useEffect(() => {
    if (isEditorReady && !hasSetup.current) {
      hasSetup.current = true;
      editor.setPlaceholder(placeholder);

      // Focus/blur forces the WebView to repaint on initial load
      setTimeout(() => {
        editor.focus();
        setTimeout(() => editor.blur(), 50);
      }, 100);

      // Force height recalculation after initial content renders.
      // Two attempts: the first catches fast renders, the second is a
      // safety net for slower devices or complex content.
      const t1 = setTimeout(() => editor.injectJS(FORCE_HEIGHT_RECALC_JS), 200);
      const t2 = setTimeout(() => editor.injectJS(FORCE_HEIGHT_RECALC_JS), 600);
      const t3 = setTimeout(() => editor.injectJS(FORCE_HEIGHT_RECALC_JS), 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [editor, isEditorReady, placeholder]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isEditorReady) return;

    const normalizedInitialContent = normalizeEditorHtml(initialContent);
    if (normalizedInitialContent === lastKnownHtmlRef.current) return;

    editor.setContent(normalizedInitialContent);
    lastKnownHtmlRef.current = normalizedInitialContent;
    editor.injectJS(FORCE_HEIGHT_RECALC_JS);
  }, [editor, initialContent, isEditorReady]);

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
    <View style={{ minHeight: 100 }}>
      <RichText
        editor={editor}
        androidLayerType={Platform.OS === "android" ? "software" : undefined}
      />
    </View>
  );
}

// Memoize to prevent re-renders from parent state changes (posts, character count).
// The editor manages its own content internally — re-rendering it causes
// dynamicHeight to re-measure the WebView, which triggers a layout feedback loop.
export const PostEditor = React.memo(
  PostEditorInner,
  (prevProps, nextProps) =>
    prevProps.initialContent === nextProps.initialContent &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.autoFocus === nextProps.autoFocus,
);

export type { EditorBridge };
