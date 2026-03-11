import { LogBox } from 'react-native';

const IGNORED_WARNING_PATTERNS = [
  'SafeAreaView has been deprecated',
  'react-native-safe-area-context',
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
