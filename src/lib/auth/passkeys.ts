"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => undefined;
}

function browserSupportsPasskeys() {
  return (
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    Boolean(navigator.credentials)
  );
}

function serverDoesNotSupportPasskeys() {
  return false;
}

/**
 * Keeps server rendering deterministic while revealing passkey controls only
 * in browsers that expose the WebAuthn credential APIs.
 */
export function usePasskeySupport() {
  return useSyncExternalStore(
    subscribe,
    browserSupportsPasskeys,
    serverDoesNotSupportPasskeys
  );
}
