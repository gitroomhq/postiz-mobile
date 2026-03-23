import { useEffect, useRef } from "react";
import { View } from "react-native";
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
  body {
    background-color: transparent;
    padding: 0;
    margin: 0;
  }
  .tiptap {
    padding: 0;
    outline: none;
  }
  .tiptap p {
    font-size: 14px;
    line-height: 14px;
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

export function PostEditor({
  initialContent,
  onChange,
  onFocus,
  autoFocus,
  minHeight,
  editorRef,
}: {
  initialContent: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  minHeight: number;
  editorRef?: (editor: EditorBridge) => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditorBridge({
    autofocus: autoFocus ?? false,
    avoidIosKeyboard: true,
    dynamicHeight: true,
    initialContent: initialContent || "<p></p>",
    bridgeExtensions: [...TenTapStartKit, DarkThemeBridge],
    theme: {
      webview: {
        backgroundColor: "transparent",
      },
    },
    onChange: async () => {
      const html = await editor.getHTML();
      onChangeRef.current(html);
    },
  });

  const editorState = editor.getEditorState();
  const hasSetup = useRef(false);

  // Set placeholder and force Android WebView repaint once editor is ready
  useEffect(() => {
    if ((editorState as any).isReady && !hasSetup.current) {
      hasSetup.current = true;
      editor.setPlaceholder("What would you like to share?");
      // Focus forces Android WebView to repaint, blur dismisses keyboard
      setTimeout(() => {
        editor.focus();
        setTimeout(() => editor.blur(), 50);
      }, 100);
    }
  }, [(editorState as any).isReady]);

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
    if ((editorState as any).isFocused && onFocus) {
      onFocus();
    }
  }, [(editorState as any).isFocused]);

  return (
    <View style={{ minHeight }}>
      <RichText
        editor={editor}
        className="bg-transparent"
      />
    </View>
  );
}

export type { EditorBridge };
