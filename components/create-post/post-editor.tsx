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
    color: #A3A3A3 !important;
    caret-color: #FFFFFF;
    -webkit-text-fill-color: #A3A3A3 !important;
  }
  .ProseMirror-focused,
  .ProseMirror-focused * {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }
  .ProseMirror-focused .is-editor-empty:first-child::before {
    color: #656464 !important;
    -webkit-text-fill-color: #656464 !important;
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
  "var h=Math.max(pm.scrollHeight||0,pm.getBoundingClientRect().height||0,36);" +
  "window.ReactNativeWebView.postMessage(JSON.stringify({type:'document-height',payload:h+0.1}));" +
  "requestAnimationFrame(function(){" +
  "window.ReactNativeWebView.postMessage(JSON.stringify({type:'document-height',payload:h}));});" +
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
  "use no memo"; // Opt out of React Compiler — imperative WebView bridge breaks under auto-memoization
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

    // On iOS, force GPU compositing to help WKWebView paint its content.
    if (Platform.OS === "ios") {
      editor.injectJS(
        "document.body.style.webkitTransform='translateZ(0)';" +
        "document.body.style.webkitBackfaceVisibility='hidden';true;"
      );
    }

    // Periodically force repaint + height recalc until editor renders.
    // The WebView sometimes needs multiple attempts before ProseMirror
    // content becomes visible (race condition with bridge init on iOS 19+).
    // Also re-apply the current focus color on each attempt as a backup.
    let attempt = 0;
    const interval = setInterval(() => {
      attempt++;

      // First five attempts: focus/blur to force WebView repaint
      if (attempt <= 5) {
        editor.focus();
        setTimeout(() => editor.blur(), 80);
      }

      // On iOS, periodically nudge the DOM to trigger repaint
      if (Platform.OS === "ios") {
        editor.injectJS(
          "var b=document.body;b.style.opacity='0.99';" +
          "requestAnimationFrame(function(){b.style.opacity='1';});true;"
        );
      }

      editor.injectJS(FORCE_HEIGHT_RECALC_JS);

      if (attempt >= 20) clearInterval(interval);
    }, 300);

    return () => clearInterval(interval);
  }, [editor, isEditorReady, placeholder]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        // Flush: persist the latest known content to parent state so it
        // isn't lost when the editor unmounts (e.g. switching active post).
        onChangeRef.current(lastKnownHtmlRef.current);
      }
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
// autoFocus is intentionally excluded — it only affects initial mount via
// useEditorBridge and must not trigger re-renders when active state changes,
// as re-rendering a WKWebView behind pointerEvents="none" on iOS causes it
// to stop painting its content.
export const PostEditor = React.memo(
  PostEditorInner,
  (prevProps, nextProps) =>
    prevProps.placeholder === nextProps.placeholder,
);

export type { EditorBridge };
