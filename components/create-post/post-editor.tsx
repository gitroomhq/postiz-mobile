import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

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

type Fmt = { bold: boolean; underline: boolean };
const PLAIN: Fmt = { bold: false, underline: false };

function fromHtml(html: string): { text: string; formats: Fmt[] } {
  if (!html || html === "<p></p>") return { text: "", formats: [] };

  let content = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n");
  content = content.replace(/^<p[^>]*>/i, "").replace(/<\/p>\s*$/i, "");

  const chars: string[] = [];
  const formats: Fmt[] = [];
  let bold = false;
  let underline = false;
  const tagRe = /<(\/?)(strong|b|u)(?:\s[^>]*)?>/gi;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(content)) !== null) {
    if (m.index > last) {
      const raw = content.slice(last, m.index).replace(/<[^>]*>/g, "");
      for (const ch of raw) {
        chars.push(ch);
        formats.push({ bold, underline });
      }
    }
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (tag === "strong" || tag === "b") bold = !closing;
    else if (tag === "u") underline = !closing;
    last = m.index + m[0].length;
  }

  if (last < content.length) {
    const raw = content.slice(last).replace(/<[^>]*>/g, "");
    for (const ch of raw) {
      chars.push(ch);
      formats.push({ bold, underline });
    }
  }

  return { text: chars.join(""), formats };
}

function toHtml(text: string, formats: Fmt[]): string {
  if (!text) return "<p></p>";

  let html = "<p>";
  let i = 0;

  while (i < text.length) {
    if (text[i] === "\n") {
      html += "</p><p>";
      i++;
      continue;
    }
    const fmt = formats[i] || PLAIN;
    let j = i + 1;
    while (
      j < text.length &&
      text[j] !== "\n" &&
      (formats[j]?.bold ?? false) === fmt.bold &&
      (formats[j]?.underline ?? false) === fmt.underline
    ) {
      j++;
    }

    let chunk = text.slice(i, j);
    if (fmt.underline) chunk = `<u>${chunk}</u>`;
    if (fmt.bold) chunk = `<b>${chunk}</b>`;
    html += chunk;
    i = j;
  }

  html += "</p>";
  return html;
}

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
  const inputRef = useRef<TextInput>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const initial = useRef(fromHtml(initialContent)).current;
  const [text, setText] = useState(initial.text);
  const [fmtKey, setFmtKey] = useState(0);
  const [selection, setSelection] = useState({
    start: initial.text.length,
    end: initial.text.length,
  });
  const textRef = useRef(initial.text);
  const formatsRef = useRef<Fmt[]>(initial.formats);
  const selectionRef = useRef({ start: initial.text.length, end: initial.text.length });
  const typingBoldRef = useRef(false);
  const typingUnderlineRef = useRef(false);
  const isFocusedRef = useRef(false);
  const lastRangeRef = useRef({ start: 0, end: 0, ts: 0 });
  const colorAnim = useRef(new Animated.Value(autoFocus ? 1 : 0)).current;
  const animatedColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#A3A3A3", "#FFFFFF"],
  });

  function emitChange() {
    onChangeRef.current(toHtml(textRef.current, formatsRef.current));
  }

  function getEffectiveRange(): { start: number; end: number } | null {
    const { start, end } = selectionRef.current;
    if (start !== end) return { start, end };
    const last = lastRangeRef.current;
    if (
      last.start !== last.end &&
      Date.now() - last.ts < 500 &&
      last.end <= textRef.current.length
    ) {
      lastRangeRef.current = { start: 0, end: 0, ts: 0 };
      return { start: last.start, end: last.end };
    }
    return null;
  }

  const bridgeRef = useRef<EditorBridge | null>(null);
  if (!bridgeRef.current) {
    bridgeRef.current = {
      toggleBold: () => {
        const range = getEffectiveRange();
        if (!range) {
          typingBoldRef.current = !typingBoldRef.current;
          return;
        }
        const { start, end } = range;
        const allBold = formatsRef.current
          .slice(start, end)
          .every((f) => f.bold);
        for (let i = start; i < end; i++) {
          formatsRef.current[i] = {
            ...formatsRef.current[i],
            bold: !allBold,
          };
        }
        setText(textRef.current);
        setFmtKey((v) => v + 1);
        emitChange();
      },
      toggleUnderline: () => {
        const range = getEffectiveRange();
        if (!range) {
          typingUnderlineRef.current = !typingUnderlineRef.current;
          return;
        }
        const { start, end } = range;
        const allUnderline = formatsRef.current
          .slice(start, end)
          .every((f) => f.underline);
        for (let i = start; i < end; i++) {
          formatsRef.current[i] = {
            ...formatsRef.current[i],
            underline: !allUnderline,
          };
        }
        setText(textRef.current);
        setFmtKey((v) => v + 1);
        emitChange();
      },
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      injectJS: () => {},
      insertText: (insertion: string) => {
        const current = textRef.current;
        const { start, end } = selectionRef.current;
        const fmt: Fmt = {
          bold: typingBoldRef.current,
          underline: typingUnderlineRef.current,
        };
        const next =
          current.slice(0, start) + insertion + current.slice(end);
        const newFormats = [...formatsRef.current];
        newFormats.splice(
          start,
          end - start,
          ...Array(insertion.length).fill({ ...fmt }),
        );
        formatsRef.current = newFormats;
        textRef.current = next;
        setText(next);
        const newPos = start + insertion.length;
        selectionRef.current = { start: newPos, end: newPos };
        setSelection({ start: newPos, end: newPos });
        emitChange();
        setTimeout(() => inputRef.current?.focus(), 50);
      },
      getHTML: () =>
        Promise.resolve(toHtml(textRef.current, formatsRef.current)),
      setPlaceholder: () => {},
      getEditorState: () => ({
        isReady: true,
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
    onReadyRef.current?.();
  }, []);

  useEffect(() => {
    return () => {
      onChangeRef.current(toHtml(textRef.current, formatsRef.current));
      onBlurRef.current?.();
    };
  }, []);

  const handleChangeText = (newText: string) => {
    const oldText = textRef.current;

    let start = 0;
    while (
      start < oldText.length &&
      start < newText.length &&
      oldText[start] === newText[start]
    ) {
      start++;
    }
    let oldEnd = oldText.length;
    let newEnd = newText.length;
    while (
      oldEnd > start &&
      newEnd > start &&
      oldText[oldEnd - 1] === newText[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }

    const deletedCount = oldEnd - start;
    const insertedCount = newEnd - start;

    let fmt: Fmt;
    if (typingBoldRef.current || typingUnderlineRef.current) {
      fmt = {
        bold: typingBoldRef.current,
        underline: typingUnderlineRef.current,
      };
    } else if (start > 0 && formatsRef.current[start - 1]) {
      fmt = { ...formatsRef.current[start - 1] };
    } else {
      fmt = { ...PLAIN };
    }

    const newFormats = [...formatsRef.current];
    newFormats.splice(
      start,
      deletedCount,
      ...Array(insertedCount).fill({ ...fmt }),
    );
    formatsRef.current = newFormats;
    textRef.current = newText;

    // Keep the native input controlled so iOS selection and line breaks stay in
    // sync with the rich-text overlay.
    setText(newText);
    emitChange();
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    colorAnim.setValue(1);
    onFocusRef.current?.();
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    colorAnim.setValue(0);
    onBlurRef.current?.();
  };

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    selectionRef.current = e.nativeEvent.selection;
    setSelection(e.nativeEvent.selection);
    if (e.nativeEvent.selection.start !== e.nativeEvent.selection.end) {
      lastRangeRef.current = {
        start: e.nativeEvent.selection.start,
        end: e.nativeEvent.selection.end,
        ts: Date.now(),
      };
    }
  };

  const segments = useMemo(() => {
    const t = text;
    const f = formatsRef.current;
    if (!t) return [];

    const result: { text: string; bold: boolean; underline: boolean }[] = [];
    let i = 0;
    while (i < t.length) {
      const fmt = f[i] || PLAIN;
      let j = i + 1;
      while (
        j < t.length &&
        (f[j]?.bold ?? false) === fmt.bold &&
        (f[j]?.underline ?? false) === fmt.underline
      ) {
        j++;
      }
      result.push({
        text: t.slice(i, j),
        bold: fmt.bold,
        underline: fmt.underline,
      });
      i = j;
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, fmtKey]);

  const hasFormatting = segments.some((s) => s.bold || s.underline);
  const showFormattedOverlay = hasFormatting && text.length > 0;

  return (
    <View style={styles.container}>
      {showFormattedOverlay ? (
        <View pointerEvents="none" style={styles.overlay}>
          <Text className="font-jakarta" style={styles.overlayText}>
            {segments.map((seg, i) => (
              <Animated.Text
                key={i}
                style={{
                  color: animatedColor,
                  fontWeight: seg.bold ? "700" : "400",
                  textDecorationLine: seg.underline ? "underline" : "none",
                }}
              >
                {seg.text}
              </Animated.Text>
            ))}
          </Text>
        </View>
      ) : null}

      <AnimatedTextInput
        ref={inputRef as any}
        multiline
        value={text}
        selection={selection}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={handleSelectionChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        placeholderTextColor="#656464"
        selectionColor="#FFFFFF"
        className="font-jakarta"
        textAlignVertical="top"
        style={{
          minHeight: 36,
          fontSize: 14,
          lineHeight: 20,
          color: showFormattedOverlay ? "transparent" : animatedColor,
          padding: 0,
        }}
        scrollEnabled={false}
      />
    </View>
  );
}

export const PostEditor = React.memo(
  PostEditorInner,
  (prevProps, nextProps) => prevProps.placeholder === nextProps.placeholder,
);

export function forceEditorRepaint(_editor: EditorBridge) {
  // No-op with native TextInput
}

const styles = StyleSheet.create({
  container: {
    minHeight: 36,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayText: {
    fontSize: 14,
    lineHeight: 20,
    padding: 0,
  },
});
