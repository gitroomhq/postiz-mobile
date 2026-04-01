import { BackHandler, LogBox } from 'react-native';

// react-native-modal@13 uses BackHandler.removeEventListener which was removed in RN 0.73+.
// Polyfill it as a no-op so the library doesn't crash on unmount.
if (!('removeEventListener' in BackHandler)) {
  (BackHandler as any).removeEventListener = () => {};
}

const IGNORED_WARNING_PATTERNS = [
  'SafeAreaView has been deprecated',
  'react-native-safe-area-context',
  'InteractionManager has been deprecated',
];

LogBox.ignoreLogs(IGNORED_WARNING_PATTERNS);

function shouldIgnoreWarning(args: unknown[]) {
  const joined = args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ')
    .toLowerCase();

  return IGNORED_WARNING_PATTERNS.some((pattern) =>
    joined.includes(pattern.toLowerCase())
  );
}

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (shouldIgnoreWarning(args)) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (shouldIgnoreWarning(args)) return;
  originalError(...args);
};
