"use client";

type SiteEventSeverity = "debug" | "info" | "warning" | "error" | "fatal";

type SiteEventPayload = {
  eventType?: string;
  severity?: SiteEventSeverity;
  source?: string;
  route?: string;
  path?: string;
  locale?: string;
  anonymousId?: string | null;
  readingId?: string | null;
  productKey?: string | null;
  message?: string;
  errorName?: string;
  stack?: string;
  lastAction?: string;
  viewport?: Record<string, unknown>;
  scroll?: Record<string, unknown>;
  context?: Record<string, unknown>;
};

declare global {
  interface Window {
    __pduTelemetryInstalled?: boolean;
    __pduLastAction?: string;
  }
}

const RATE_KEY = "pdu_site_event_rate";
const LOCAL_USER_KEY = "pdu_user_id";
const TELEMETRY_ID_KEY = "pdu_telemetry_id";
const ACTIVE_READING_KEY = "pdu_active_reading";
const MAX_EVENTS_PER_SESSION = 60;

function readStorage(storage: Storage | undefined, key: string) {
  try {
    return storage?.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStorage(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Telemetry must never break the page.
  }
}

function getTelemetryId() {
  const existingLocalUser = readStorage(window.localStorage, LOCAL_USER_KEY);
  if (existingLocalUser) return existingLocalUser;

  const existing = readStorage(window.localStorage, TELEMETRY_ID_KEY);
  if (existing) return existing;

  const next = `pdu_evt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  writeStorage(window.localStorage, TELEMETRY_ID_KEY, next);
  return next;
}

function scrubText(value: string) {
  return value
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9_=-]{8,}\b/g, "[redacted_key]")
    .replace(/\bwhsec_[A-Za-z0-9_=-]{8,}\b/g, "[redacted_webhook_secret]")
    .replace(/\bsk-ant-api03-[A-Za-z0-9_-]{8,}\b/g, "[redacted_api_key]");
}

function trimText(value: unknown, length: number) {
  return typeof value === "string" ? scrubText(value).slice(0, length) : undefined;
}

function routePath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
    visualWidth: window.visualViewport?.width ?? null,
    visualHeight: window.visualViewport?.height ?? null,
    orientation: window.screen?.orientation?.type ?? null,
  };
}

function getScroll() {
  return {
    x: Math.round(window.scrollX),
    y: Math.round(window.scrollY),
    maxY: Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    ),
  };
}

function getActiveReadingContext() {
  try {
    const raw = window.localStorage.getItem(ACTIVE_READING_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as {
      reading_id?: unknown;
      product_key?: unknown;
      spread_type?: unknown;
      portal_intent_id?: unknown;
    };
    return {
      activeReadingId: trimText(parsed.reading_id, 80) ?? null,
      activeProductKey: trimText(parsed.product_key, 80) ?? null,
      activeSpreadType: trimText(parsed.spread_type, 80) ?? null,
      activeIntentId: trimText(parsed.portal_intent_id, 80) ?? null,
    };
  } catch {
    return {};
  }
}

function allowSessionEvent(eventType: string, severity: SiteEventSeverity) {
  if (severity === "fatal") return true;

  try {
    const raw = window.sessionStorage.getItem(RATE_KEY);
    const state = raw
      ? (JSON.parse(raw) as { total?: number; byType?: Record<string, number> })
      : {};
    const byType = state.byType ?? {};
    const total = state.total ?? 0;
    const typeCount = byType[eventType] ?? 0;

    if (total >= MAX_EVENTS_PER_SESSION || typeCount >= 8) return false;

    window.sessionStorage.setItem(
      RATE_KEY,
      JSON.stringify({
        total: total + 1,
        byType: { ...byType, [eventType]: typeCount + 1 },
      })
    );
    return true;
  } catch {
    return true;
  }
}

function normalizePayload(input: SiteEventPayload) {
  const eventType = trimText(input.eventType, 120) || "client.event";
  const severity = input.severity ?? "info";

  return {
    eventType,
    severity,
    source: trimText(input.source, 80) || "client",
    route: input.route ?? routePath(),
    path: input.path ?? window.location.pathname,
    locale:
      input.locale ??
      document.documentElement.lang ??
      readStorage(window.localStorage, "pdu_locale") ??
      navigator.language,
    anonymousId: input.anonymousId ?? getTelemetryId(),
    readingId: input.readingId ?? null,
    productKey: input.productKey ?? null,
    message: trimText(input.message, 1_200),
    errorName: trimText(input.errorName, 160),
    stack: trimText(input.stack, 4_000),
    lastAction: input.lastAction ?? window.__pduLastAction,
    viewport: { ...getViewport(), ...(input.viewport ?? {}) },
    scroll: { ...getScroll(), ...(input.scroll ?? {}) },
    context: { ...getActiveReadingContext(), ...(input.context ?? {}) },
  };
}

export function recordSiteEvent(input: SiteEventPayload) {
  if (typeof window === "undefined") return;

  const payload = normalizePayload(input);
  if (!allowSessionEvent(payload.eventType, payload.severity)) return;

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon?.("/api/events", blob)) return;

  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    cache: "no-store",
    keepalive: true,
  }).catch(() => {
    // Event loss is acceptable; user flow remains primary.
  });
}

function describeElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return "unknown";

  const tag = target.tagName.toLowerCase();
  const id = target.id ? `#${target.id}` : "";
  const classes = Array.from(target.classList).slice(0, 3).join(".");
  const classText = classes ? `.${classes}` : "";
  const aria = target.getAttribute("aria-label") ?? "";
  const text =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      ? target.name || target.placeholder || target.type
      : target.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "";

  return scrubText(`${tag}${id}${classText}${aria || text ? ` "${aria || text}"` : ""}`).slice(
    0,
    500
  );
}

function extractError(reason: unknown) {
  if (reason instanceof Error) {
    return {
      message: reason.message,
      errorName: reason.name,
      stack: reason.stack,
    };
  }

  return {
    message: typeof reason === "string" ? reason : "Unhandled rejection",
    errorName: "UnhandledRejection",
    stack: undefined,
  };
}

function isElementLoadError(event: Event) {
  return event.target instanceof HTMLElement;
}

function recordElementLoadError(event: Event) {
  const target = event.target as HTMLElement;
  const source =
    target.getAttribute("src") ??
    target.getAttribute("href") ??
    target.getAttribute("poster") ??
    "";

  recordSiteEvent({
    eventType: "asset.load_error",
    severity: "warning",
    message: "A visual asset failed to load.",
    lastAction: window.__pduLastAction,
    context: {
      tagName: target.tagName.toLowerCase(),
      source: source.slice(0, 500),
      className: target.className,
    },
  });
}

export function installSiteEventTelemetry() {
  if (typeof window === "undefined" || window.__pduTelemetryInstalled) {
    return;
  }
  window.__pduTelemetryInstalled = true;

  const captureAction = (event: Event) => {
    window.__pduLastAction = `${event.type}: ${describeElement(event.target)}`;
  };

  window.addEventListener("click", captureAction, { capture: true, passive: true });
  window.addEventListener("pointerdown", captureAction, { capture: true, passive: true });
  window.addEventListener("keydown", captureAction, { capture: true });
  window.addEventListener("submit", captureAction, { capture: true });

  window.addEventListener(
    "error",
    (event) => {
      if (isElementLoadError(event)) {
        recordElementLoadError(event);
        return;
      }

      recordSiteEvent({
        eventType: "browser.error",
        severity: "error",
        message: event.message,
        errorName: event.error instanceof Error ? event.error.name : "Error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
        context: {
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
        },
      });
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    const error = extractError(event.reason);
    recordSiteEvent({
      eventType: "browser.unhandled_rejection",
      severity: "error",
      ...error,
    });
  });

  let previousY = window.scrollY;
  let highestY = window.scrollY;
  let lastHashChangeAt = 0;
  let lastScrollAt = Date.now();

  window.addEventListener("hashchange", () => {
    lastHashChangeAt = Date.now();
  });

  window.addEventListener(
    "scroll",
    () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const maxY = Math.max(highestY, currentY);
      const jumpedToTop =
        maxY > 900 &&
        previousY > 700 &&
        currentY < 80 &&
        now - lastHashChangeAt > 1_500 &&
        document.visibilityState === "visible";

      if (jumpedToTop) {
        recordSiteEvent({
          eventType: "ux.scroll_jump_to_top",
          severity: "warning",
          message: "The page returned close to the top while the user was scrolling.",
          scroll: {
            previousY,
            currentY,
            highestY: maxY,
            elapsedSincePreviousScrollMs: now - lastScrollAt,
          },
        });
        highestY = currentY;
      } else {
        highestY = maxY;
      }

      previousY = currentY;
      lastScrollAt = now;
    },
    { passive: true }
  );
}
