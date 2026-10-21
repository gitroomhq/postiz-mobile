import { Ionicons } from "@expo/vector-icons";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  WebView,
  type WebViewMessageEvent,
} from "react-native-webview";

import { ChannelAvatar } from "@/components/ui/channel-avatar";
import { showToast } from "@/components/ui/toast";
import type { ChannelNetwork } from "@/types";
import { FRONTEND_URL } from "@/utils/env";
import { tokenStorage } from "@/utils/token-storage";

export type ValidationResult = {
  isValid: boolean;
  value: Record<string, unknown>;
  errors: string[];
  /** DTO (form.trigger) result. False = at least one DTO field failed. */
  formValid?: boolean;
  /** Non-null when the provider's checkValidity() returned a string. */
  checkValidityError?: string | null;
};

export type FleetChannel = {
  id: string;
  network: string;
  name: string;
  avatar?: string;
};

export type SettingsWebViewFleetHandle = {
  validateAll: () => Promise<Record<string, ValidationResult>>;
  validate: (channelId: string) => Promise<ValidationResult | null>;
  getValues: (channelId: string) => Promise<Record<string, unknown> | null>;
  /**
   * Resolves the provider's character limit through the WebView bridge,
   * applying the seeded `additionalSettings` (e.g. X bumps to 4000 when the
   * account is Verified). Returns null when the provider doesn't declare a
   * limit or the bridge isn't ready.
   */
  getMaximumCharacters: (channelId: string) => Promise<number | null>;
  /** Open a single channel's settings panel. Passing null closes everything. */
  setVisibleChannel: (channelId: string | null) => void;
  /**
   * Open multiple channels' settings at once, rendered as a tab strip.
   * The first id becomes the initially active tab.
   */
  setVisibleChannels: (channelIds: string[] | null) => void;
};

export type FleetMediaItem = { path: string; thumbnail?: string };

export type SettingsWebViewFleetProps = {
  channels: FleetChannel[];
  initialValuesByChannel: Record<string, Record<string, unknown>>;
  errorsByChannel?: Record<string, string[]>;
  /**
   * Per-channel per-post media arrays (outer = thread posts, inner = media
   * items). Forwarded to the bridge as `__PROVIDER_INIT__.posts` so each
   * provider's `checkValidity` can inspect media constraints at validate().
   */
  postsByChannel?: Record<string, Array<Array<FleetMediaItem>>>;
  /**
   * Per-channel integration metadata forwarded to the WebView bridge as
   * `__PROVIDER_INIT__.integration`. Mirrors the shape the web's launch
   * flow feeds to `IntegrationContext` — at minimum we pass `id` so
   * SettingsComponents that make authenticated, integration-scoped API
   * calls (e.g. fetching boards/pages/channels) target the right row,
   * and `additionalSettings` so checkValidity / maximumCharacters
   * resolve correctly (X Verified bumps to 4000 chars, etc.).
   */
  integrationsByChannel?: Record<
    string,
    {
      id?: string;
      name?: string;
      identifier?: string;
      picture?: string;
      display?: string;
      additionalSettings?: string | unknown[];
    }
  >;
  onSave?: (channelId: string, value: Record<string, unknown>) => void;
  onClose?: () => void;
  /**
   * Fires when a channel's WebView bridge has finished mounting and the
   * `__validateProviderPreview__` / `__getProviderPreviewValues__` /
   * `__getProviderMaxCharacters__` globals are callable. Use this to pull
   * one-shot data (e.g. the resolved character limit) without polling.
   */
  onChannelReady?: (channelId: string) => void;
  /**
   * Hold panel rendering until the parent has the channels' settings
   * ready (e.g. /posts/group/:group has returned in edit mode). Without
   * this, panels mount immediately with an empty seed, then re-mount via
   * seedKey when the seed populates — and react-hook-form fields
   * registered with `register('name', { value })` can stick at the
   * register-time default through the re-mount, leaving the form
   * showing wrong values. Default true so create-flow (no async load)
   * keeps working unchanged.
   */
  ready?: boolean;
  /**
   * Edit mode flag. When true, `setVisibleChannel(s)` refuses to open a
   * panel for any channel whose `initialValuesByChannel` entry is
   * missing/empty — in edit mode, opening a WebView without seed data
   * would let the user overwrite saved provider settings with blank
   * values. Hidden validation (validateAll) is unaffected; only the
   * user-visible open is gated.
   */
  editMode?: boolean;
};

type CallKind = "validate" | "getValues" | "getMaxChars";
type CallResult = ValidationResult | Record<string, unknown> | number | null;

type PendingResolver = {
  resolve: (result: CallResult) => void;
  kind: CallKind;
};

type WebViewBucket = {
  webRef: { current: WebView | null };
  ready: boolean;
};

function hasSeed(value: Record<string, unknown> | undefined): boolean {
  return !!value && Object.keys(value).length > 0;
}

const READY_POLL_INTERVAL_MS = 50;
const CALL_TIMEOUT_MS = 8000;
const ANIM_DURATION_MS = 280;

function buildInitScript(
  value: Record<string, unknown>,
  errors: string[] | undefined,
  posts: Array<Array<FleetMediaItem>> | undefined,
  integration:
    | {
        id?: string;
        name?: string;
        identifier?: string;
        picture?: string;
        display?: string;
        additionalSettings?: string | unknown[];
      }
    | undefined,
) {
  // Only include `value` when it has actual fields. An empty {} would wipe
  // out the DTO-level defaults the SettingsComponent relies on (the bridge
  // forwards it to react-hook-form's `values`, which overrides defaults).
  const hasValue = !!value && Object.keys(value).length > 0;
  const payload: Record<string, unknown> = {
    errors: errors ?? [],
    posts: posts ?? [],
    integration: integration ?? {},
  };
  if (hasValue) payload.value = value;
  const serialized = JSON.stringify(payload);
  return `window.__PROVIDER_INIT__ = ${serialized};
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __bridgeKind: 'debug-init',
        payload: window.__PROVIDER_INIT__
      }));
    } catch (e) {}`;
}

function buildValidateScript(callId: string) {
  return `(function(){
    try {
      var p = window.__validateProviderPreview__
        ? window.__validateProviderPreview__()
        : Promise.resolve({ isValid: false, value: {}, errors: ['not-ready'] });
      Promise.resolve(p).then(function(r){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          __bridgeCallId: ${JSON.stringify(callId)},
          __bridgeKind: 'validate',
          payload: r
        }));
      }).catch(function(e){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          __bridgeCallId: ${JSON.stringify(callId)},
          __bridgeKind: 'validate',
          payload: { isValid: false, value: {}, errors: [String(e && e.message || e)] }
        }));
      });
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __bridgeCallId: ${JSON.stringify(callId)},
        __bridgeKind: 'validate',
        payload: { isValid: false, value: {}, errors: [String(e && e.message || e)] }
      }));
    }
  })(); true;`;
}

function buildGetValuesScript(callId: string) {
  return `(function(){
    try {
      var v = window.__getProviderPreviewValues__
        ? window.__getProviderPreviewValues__()
        : {};
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __bridgeCallId: ${JSON.stringify(callId)},
        __bridgeKind: 'getValues',
        payload: v || {}
      }));
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __bridgeCallId: ${JSON.stringify(callId)},
        __bridgeKind: 'getValues',
        payload: {}
      }));
    }
  })(); true;`;
}

function buildGetMaxCharsScript(callId: string) {
  return `(function(){
    try {
      var n = window.__getProviderMaxCharacters__
        ? window.__getProviderMaxCharacters__()
        : null;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __bridgeCallId: ${JSON.stringify(callId)},
        __bridgeKind: 'getMaxChars',
        payload: typeof n === 'number' ? n : null
      }));
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __bridgeCallId: ${JSON.stringify(callId)},
        __bridgeKind: 'getMaxChars',
        payload: null
      }));
    }
  })(); true;`;
}

const MOBILE_STYLE_INJECTION = `(function(){
  function apply(){
    if (!document.body) { setTimeout(apply, 16); return; }
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover');

    var killGesture = function(e){ e.preventDefault(); };
    document.addEventListener('gesturestart', killGesture, { passive: false });
    document.addEventListener('gesturechange', killGesture, { passive: false });
    document.addEventListener('gestureend', killGesture, { passive: false });
    var lastTouch = 0;
    document.addEventListener('touchend', function(e){
      var now = Date.now();
      if (now - lastTouch <= 350) { e.preventDefault(); }
      lastTouch = now;
    }, { passive: false });
    document.addEventListener('touchmove', function(e){
      if (e.touches && e.touches.length > 1) { e.preventDefault(); }
    }, { passive: false });

    var style = document.createElement('style');
    style.textContent = [
      'html, body { margin: 0 !important; padding: 0 !important; background: #0C0B0B !important; color: #fff; touch-action: pan-x pan-y !important; -webkit-text-size-adjust: 100% !important; min-height: 0 !important; height: auto !important; }',
      '[data-mobile-pinned] { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; overflow-y: auto !important; padding: 12px 16px 32px 16px !important; box-sizing: border-box !important; background: #0C0B0B !important; z-index: 2147483647 !important; }',
      '[data-mobile-pinned] > * { margin-top: 0 !important; }',
      '[data-mobile-pinned] * { max-width: 100% !important; box-sizing: border-box; touch-action: manipulation; }',
      'input, textarea, select, button { font-size: 16px !important; }',
      '#support-discord, #intercom-container, [class*="Intercom"] { display: none !important; }'
    ].join('\\n');
    document.head.appendChild(style);

    // The provider bridge wraps the form in <div class="flex flex-col gap-4 text-white">.
    // Everything above it (layout providers, portals, Next.js scaffolding) contributes
    // vertical whitespace we can't easily suppress. Mark the form wrapper so our CSS
    // pins it to the WebView viewport, and observe in case it mounts after our apply().
    var pin = function(){
      var target = document.querySelector('div.flex.flex-col.gap-4.text-white');
      if (target && !target.hasAttribute('data-mobile-pinned')) {
        target.setAttribute('data-mobile-pinned', '1');
      }
    };
    pin();
    var mo = new MutationObserver(pin);
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function(){ mo.disconnect(); }, 8000);
  }
  apply();
})(); true;`;

function buildReadySignalScript() {
  return `(function(){
    function ping(){
      if (
        window.__validateProviderPreview__ &&
        window.__getProviderPreviewValues__ &&
        window.__getProviderMaxCharacters__
      ) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ __bridgeKind: 'ready' }));
        return;
      }
      setTimeout(ping, ${READY_POLL_INTERVAL_MS});
    }
    ping();
  })();`;
}

type ChannelPanelProps = {
  channel: FleetChannel;
  raised: boolean;
  active: boolean;
  topInset: number;
  uri: string;
  injectedBefore: string;
  sheetOffset: SharedValue<number>;
  onMessage: (channelId: string, event: WebViewMessageEvent) => void;
  onRegisterRef: (channelId: string, webView: WebView | null) => void;
  onReadyReset: (channelId: string) => void;
};

function ChannelPanel({
  channel,
  raised,
  active,
  topInset,
  uri,
  injectedBefore,
  sheetOffset,
  onMessage,
  onRegisterRef,
  onReadyReset,
}: ChannelPanelProps) {
  const webRef = useRef<WebView | null>(null);
  const lastInjectedBefore = useRef<string>(injectedBefore);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (lastInjectedBefore.current === injectedBefore) return;
    lastInjectedBefore.current = injectedBefore;
    if (hasLoadedOnce.current && webRef.current) {
      console.log(
        "[settings-webview-fleet] reload",
        channel.id,
        "(injectedBefore changed)",
      );
      onReadyReset(channel.id);
      webRef.current.reload();
    } else {
      console.log(
        "[settings-webview-fleet] initial inject",
        channel.id,
      );
    }
  }, [injectedBefore, channel.id, onReadyReset]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetOffset.value }],
  }));

  return (
    <Animated.View
      pointerEvents={raised && active ? "auto" : "none"}
      style={[
        styles.panel,
        {
          paddingTop: topInset,
          opacity: raised && active ? 1 : 0,
        },
        animStyle,
      ]}
    >
      <WebView
        ref={(w) => {
          webRef.current = w;
          onRegisterRef(channel.id, w);
        }}
        source={{ uri }}
        injectedJavaScriptBeforeContentLoaded={injectedBefore}
        injectedJavaScript={MOBILE_STYLE_INJECTION}
        onLoadEnd={() => {
          hasLoadedOnce.current = true;
        }}
        onMessage={(e) => onMessage(channel.id, e)}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={false}
        textZoom={100}
        allowsLinkPreview={false}
        bounces={false}
        overScrollMode="never"
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, right: 0, bottom: 0 }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, styles.loading]}>
            <ActivityIndicator color="#ffffff" />
          </View>
        )}
      />
    </Animated.View>
  );
}

export const SettingsWebViewFleet = forwardRef<
  SettingsWebViewFleetHandle,
  SettingsWebViewFleetProps
>(function SettingsWebViewFleet(
  {
    channels,
    initialValuesByChannel,
    errorsByChannel,
    postsByChannel,
    integrationsByChannel,
    onSave,
    onClose,
    onChannelReady,
    ready = true,
    editMode = false,
  },
  ref,
) {
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const buckets = useRef<Record<string, WebViewBucket>>({});
  const pending = useRef<Map<string, PendingResolver>>(new Map());
  const callCounter = useRef(0);
  /**
   * Unique-per-fleet-mount cache-buster appended to every WebView URL.
   * iOS WKWebView caches by full URL; without this, opening the same
   * post twice serves the cached page from disk and the
   * `injectedJavaScriptBeforeContentLoaded` re-runs but the page may not
   * re-read `window.__PROVIDER_INIT__` because some bundlers cache the
   * boot module. Generated once per fleet mount via `useRef`, so the URL
   * is stable across renders within one screen, but fresh on every
   * create-post open.
   */
  const cacheBust = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

  /**
   * JWT forwarded to the /provider/:p page via `?loggedAuth=<token>`. The
   * shared web fetch wrapper reads this search param on every request and
   * attaches it as the `auth` header, so SettingsComponents that make
   * authenticated API calls (e.g. provider-specific data lookups) work
   * inside the WebView. `undefined` = still loading, `null` = no token.
   */
  const [authToken, setAuthToken] = useState<string | null | undefined>(
    undefined,
  );
  useEffect(() => {
    let cancelled = false;
    tokenStorage.getAuth().then((t) => {
      if (!cancelled) setAuthToken(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getBucket = useCallback((channelId: string) => {
    if (!buckets.current[channelId]) {
      buckets.current[channelId] = {
        webRef: { current: null },
        ready: false,
      };
    }
    return buckets.current[channelId];
  }, []);

  useEffect(() => {
    const alive = new Set(channels.map((c) => c.id));
    for (const id of Object.keys(buckets.current)) {
      if (!alive.has(id)) delete buckets.current[id];
    }
    setVisibleIds((prev) => prev.filter((id) => alive.has(id)));
    setActiveId((prev) => (prev && alive.has(prev) ? prev : null));
  }, [channels]);

  const waitForReady = useCallback(
    async (channelId: string) => {
      const bucket = getBucket(channelId);
      if (bucket.ready) return true;
      const started = Date.now();
      while (Date.now() - started < CALL_TIMEOUT_MS) {
        if (bucket.ready) return true;
        await new Promise((r) => setTimeout(r, READY_POLL_INTERVAL_MS));
      }
      return bucket.ready;
    },
    [getBucket],
  );

  const call = useCallback(
    async (channelId: string, kind: CallKind): Promise<CallResult> => {
      const bucket = getBucket(channelId);
      const ok = await waitForReady(channelId);
      if (!ok || !bucket.webRef.current) {
        if (kind === "validate") {
          return { isValid: false, value: {}, errors: ["not-ready"] };
        }
        return null;
      }
      const callId = `call-${++callCounter.current}`;
      const script =
        kind === "validate"
          ? buildValidateScript(callId)
          : kind === "getValues"
            ? buildGetValuesScript(callId)
            : buildGetMaxCharsScript(callId);
      return new Promise((resolve) => {
        pending.current.set(callId, {
          resolve: resolve as PendingResolver["resolve"],
          kind,
        });
        bucket.webRef.current?.injectJavaScript(script);
        setTimeout(() => {
          if (pending.current.has(callId)) {
            pending.current.delete(callId);
            if (kind === "validate") {
              resolve({
                isValid: false,
                value: {},
                errors: ["validation-timed-out"],
              });
            } else {
              resolve(null);
            }
          }
        }, CALL_TIMEOUT_MS);
      });
    },
    [getBucket, waitForReady],
  );

  useImperativeHandle(
    ref,
    (): SettingsWebViewFleetHandle => ({
      validate: async (channelId) =>
        (await call(channelId, "validate")) as ValidationResult | null,
      validateAll: async () => {
        const entries = await Promise.all(
          channels.map(async (c) => {
            const r = (await call(c.id, "validate")) as ValidationResult;
            return [c.id, r] as const;
          }),
        );
        return Object.fromEntries(entries);
      },
      getValues: async (channelId) =>
        (await call(channelId, "getValues")) as Record<
          string,
          unknown
        > | null,
      getMaximumCharacters: async (channelId) => {
        const result = (await call(channelId, "getMaxChars")) as
          | number
          | null;
        return typeof result === "number" ? result : null;
      },
      setVisibleChannel: (channelId) => {
        if (channelId == null) {
          setVisibleIds([]);
          setActiveId(null);
          return;
        }
        if (editMode && !hasSeed(initialValuesByChannel[channelId])) {
          console.warn(
            "[settings-webview-fleet] blocked open (edit mode, no seed):",
            channelId,
          );
          return;
        }
        setVisibleIds([channelId]);
        setActiveId(channelId);
      },
      setVisibleChannels: (channelIds) => {
        if (!channelIds || channelIds.length === 0) {
          setVisibleIds([]);
          setActiveId(null);
          return;
        }
        const filtered = editMode
          ? channelIds.filter((id) => {
              const ok = hasSeed(initialValuesByChannel[id]);
              if (!ok) {
                console.warn(
                  "[settings-webview-fleet] skip open (edit mode, no seed):",
                  id,
                );
              }
              return ok;
            })
          : channelIds;
        if (filtered.length === 0) return;
        setVisibleIds(filtered);
        setActiveId(filtered[0] ?? null);
      },
    }),
    [call, channels, editMode, initialValuesByChannel],
  );

  const handleMessage = useCallback(
    (channelId: string, event: WebViewMessageEvent) => {
      let parsed: {
        __bridgeCallId?: string;
        __bridgeKind?: string;
        payload?: unknown;
      } | null = null;
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!parsed || typeof parsed !== "object") return;
      if (parsed.__bridgeKind === "debug-init") {
        console.log(
          "[settings-webview-fleet] webview received __PROVIDER_INIT__",
          channelId,
          parsed.payload,
        );
        return;
      }
      if (parsed.__bridgeKind === "ready") {
        const bucket = getBucket(channelId);
        const wasReady = bucket.ready;
        bucket.ready = true;
        if (!wasReady) onChannelReady?.(channelId);
        return;
      }
      const callId = parsed.__bridgeCallId;
      if (!callId) return;
      const waiter = pending.current.get(callId);
      if (!waiter) return;
      pending.current.delete(callId);
      waiter.resolve(parsed.payload as never);
    },
    [getBucket, onChannelReady],
  );

  const registerRef = useCallback(
    (channelId: string, webView: WebView | null) => {
      const bucket = getBucket(channelId);
      bucket.webRef.current = webView;
    },
    [getBucket],
  );

  const handleReadyReset = useCallback(
    (channelId: string) => {
      const bucket = getBucket(channelId);
      bucket.ready = false;
    },
    [getBucket],
  );

  // Single shared offset drives both chrome + every raised panel so they all
  // slide together on open/close and on drag-to-dismiss.
  const sheetOffset = useSharedValue(screenHeight);
  const DISMISS_THRESHOLD = 120;
  const DISMISS_VELOCITY = 700;

  useEffect(() => {
    sheetOffset.value = withTiming(visibleIds.length > 0 ? 0 : screenHeight, {
      duration: ANIM_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [visibleIds.length, sheetOffset, screenHeight]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetOffset.value }],
  }));

  // Persist each raised channel's current form values before dismissing, so
  // the user's edits round-trip into channelSettings without a Save button.
  const persistAndClose = useCallback(async () => {
    const ids = visibleIds.slice();
    setVisibleIds([]);
    setActiveId(null);
    for (const id of ids) {
      const values = (await call(id, "getValues")) as
        | Record<string, unknown>
        | null;
      if (values) onSave?.(id, values);
    }
    onClose?.();
  }, [call, onClose, onSave, visibleIds]);

  const handleClose = useCallback(() => {
    void persistAndClose();
  }, [persistAndClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-24, 24])
    .onUpdate((e) => {
      if (e.translationY > 0) {
        sheetOffset.value = e.translationY;
      } else {
        sheetOffset.value = 0;
      }
    })
    .onEnd((e) => {
      if (
        e.translationY > DISMISS_THRESHOLD ||
        e.velocityY > DISMISS_VELOCITY
      ) {
        sheetOffset.value = withTiming(screenHeight, {
          duration: ANIM_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(handleClose)();
      } else {
        sheetOffset.value = withTiming(0, {
          duration: ANIM_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  const backdropOpacity = useSharedValue(0);
  useEffect(() => {
    backdropOpacity.value = withTiming(visibleIds.length > 0 ? 0.4 : 0, {
      duration: ANIM_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [visibleIds.length, backdropOpacity]);
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panels = useMemo(() => {
    return channels.map((channel) => {
      const authParam = authToken
        ? `?loggedAuth=${encodeURIComponent(authToken)}`
        : "";

      const uri = `${FRONTEND_URL}/provider/${encodeURIComponent(
        channel.network,
      )}${authParam}`;
      const initScript = buildInitScript(
        initialValuesByChannel[channel.id] ?? {},
        errorsByChannel?.[channel.id],
        postsByChannel?.[channel.id],
        integrationsByChannel?.[channel.id],
      );
      const injectedBefore = `${initScript}\n${buildReadySignalScript()}`;
      return { channel, uri, injectedBefore };
    });
  }, [
    channels,
    initialValuesByChannel,
    errorsByChannel,
    postsByChannel,
    integrationsByChannel,
    authToken,
  ]);

  const visibleChannels = useMemo(
    () =>
      visibleIds
        .map((id) => channels.find((c) => c.id === id))
        .filter((c): c is FleetChannel => !!c),
    [visibleIds, channels],
  );

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeId) ?? null,
    [channels, activeId],
  );

  const anyVisible = visibleIds.length > 0;
  const multiMode = visibleIds.length > 1;

  return (
    <>
      <Animated.View
        pointerEvents={anyVisible ? "auto" : "none"}
        style={[styles.backdrop, backdropStyle]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {ready &&
        authToken !== undefined &&
        panels.map(({ channel, uri, injectedBefore }) => {
          // With `ready` gating mounts, panels render exactly once with
          // the correct seed — no empty→seeded remount cycle. The
          // seedKey here is now mostly defensive (covers the case where
          // settings change post-mount, e.g. user re-authenticates a
          // channel mid-composer), not the primary load-race fix.
          const seedKey =
            Object.keys(initialValuesByChannel[channel.id] ?? {}).length > 0
              ? "seeded"
              : "empty";
          return (
            <ChannelPanel
              key={`${channel.id}-${seedKey}`}
              channel={channel}
              raised={visibleIds.includes(channel.id)}
              active={channel.id === activeId}
              topInset={insets.top + (multiMode ? 48 : 0)}
              uri={uri}
              injectedBefore={injectedBefore}
              sheetOffset={sheetOffset}
              onMessage={handleMessage}
              onRegisterRef={registerRef}
              onReadyReset={handleReadyReset}
            />
          );
        })}

      <GestureDetector gesture={panGesture}>
        <Animated.View
          pointerEvents={anyVisible ? "box-none" : "none"}
          style={[styles.chromeLayer, sheetStyle]}
        >
          <SafeAreaView edges={["top"]} style={styles.chromeSafe}>
            <View className="items-center pt-2 pb-1">
              <View className="h-1 w-9 rounded-full bg-[#454444]" />
            </View>
            <View className="h-12 flex-row items-center justify-between px-4">
              <Pressable onPress={handleClose} hitSlop={10}>
                <Ionicons
                  name="close"
                  size={24}
                  className="text-icon-primary"
                />
              </Pressable>
              <Text
                numberOfLines={1}
                className="flex-1 text-center font-jakarta text-body-1 font-semibold text-text-primary"
              >
                {activeChannel
                  ? `${activeChannel.name} settings`
                  : "Channel settings"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {multiMode ? (
              <View style={styles.tabBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabContent}
                >
                  {visibleChannels.map((channel) => {
                    const isActive = channel.id === activeId;
                    return (
                      <Pressable
                        key={channel.id}
                        onPress={() => setActiveId(channel.id)}
                        style={[
                          styles.tab,
                          isActive ? styles.tabActive : styles.tabInactive,
                        ]}
                      >
                        <ChannelAvatar
                          avatar={channel.avatar ?? ""}
                          network={channel.network as ChannelNetwork}
                          size={20}
                        />
                        <Text
                          numberOfLines={1}
                          className="font-jakarta text-[13px] font-medium text-text-primary"
                          style={{ maxWidth: 110 }}
                        >
                          {channel.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>
    </>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0E0E0E",
    zIndex: 999,
  },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0C0B0B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    zIndex: 1000,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0C0B0B",
  },
  chromeLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1002,
    backgroundColor: "#0C0B0B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  chromeSafe: {
    backgroundColor: "transparent",
  },
  tabBar: {
    height: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2A2A2A",
  },
  tabContent: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabActive: {
    borderColor: "#FC69FF",
    backgroundColor: "rgba(252, 105, 255, 0.08)",
  },
  tabInactive: {
    borderColor: "transparent",
    backgroundColor: "#1A1919",
  },
});
