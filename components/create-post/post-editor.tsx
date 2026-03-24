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
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }
  .dynamic-height {
    height: unset !important;
    min-height: 0 !important;
  }
  .dynamic-height .ProseMirror {
    height: unset !important;
    min-height: 20px !important;
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

function normalizeEditorHtml(content: string) {
  return content.trim().length > 0 ? content : EMPTY_EDITOR_HTML;
}

function PostEditorInner({
  initialContent,
  onChange,
  onFocus,
  autoFocus,
  placeholder = "What would you like to share?",
  editorRef,
}: {
  initialContent: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  editorRef?: (editor: EditorBridge) => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKnownHtmlRef = useRef(normalizeEditorHtml(initialContent));

  const editor = useEditorBridge({
    autofocus: autoFocus ?? false,
    avoidIosKeyboard: true,
    dynamicHeight: true,
    initialContent: normalizeEditorHtml(initialContent),
    bridgeExtensions: [...TenTapStartKit, DarkThemeBridge],
    theme: {
      webview: {
        backgroundColor: "#1A1919",
        opacity: 0.99,
      },
      webviewContainer: {
        minHeight: 40,
      },
    },
    onChange: () => {
      // Force Android WebView repaint on single-line edits.
      // tentap's dynamicHeight uses a ResizeObserver on .ProseMirror — when typing
      // on one line the height doesn't change, so the native container never
      // re-layouts and Android skips repainting the WebView.  Sending a temporary
      // height bump (h + 0.1) via postMessage forces setEditorHeight on the native
      // side, triggering a container re-layout and WebView repaint. The correct
      // height is restored on the next animation frame.
      if (Platform.OS === "android") {
        editor.injectJS(
          "(function(){var pm=document.querySelector('.ProseMirror');" +
          "if(pm){var h=pm.getBoundingClientRect().height;" +
          "window.ReactNativeWebView.postMessage(JSON.stringify({type:'document-height',payload:h+0.1}));" +
          "requestAnimationFrame(function(){" +
          "window.ReactNativeWebView.postMessage(JSON.stringify({type:'document-height',payload:h}));});}})();true;"
        );
      }

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

  // Set placeholder and force Android WebView repaint once editor is ready
  useEffect(() => {
    if (isEditorReady && !hasSetup.current) {
      hasSetup.current = true;
      editor.setPlaceholder(placeholder);
      // Focus forces Android WebView to repaint, blur dismisses keyboard
      setTimeout(() => {
        editor.focus();
        setTimeout(() => editor.blur(), 50);
      }, 100);
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
    if (Platform.OS === "android") {
      editor.injectJS(
        "(function(){var pm=document.querySelector('.ProseMirror');" +
        "if(pm){var h=pm.getBoundingClientRect().height;" +
        "window.ReactNativeWebView.postMessage(JSON.stringify({type:'document-height',payload:h+0.1}));" +
        "requestAnimationFrame(function(){" +
        "window.ReactNativeWebView.postMessage(JSON.stringify({type:'document-height',payload:h}));});}})();true;"
      );
    }
  }, [editor, initialContent, isEditorReady]);

  // Expose the editor bridge to parent
  const hasSetRef = useRef(false);
  useEffect(() => {
    if (editorRef && !hasSetRef.current) {
      hasSetRef.current = true;
      editorRef(editor);
    }
  }, [editor, editorRef]);

  // Detect focus for active post tracking
  useEffect(() => {
    if (isEditorFocused) {
      onFocusRef.current?.();
    }
  }, [isEditorFocused]);

  return (
    <View style={{ minHeight: 40 }}>
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
