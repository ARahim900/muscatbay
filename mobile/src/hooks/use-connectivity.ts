/**
 * Connectivity state.
 *
 * Uses `expo-network` rather than @react-native-community/netinfo so it works in
 * Expo Go with no extra native module.
 *
 * The app is READ-ONLY. There is no offline write queue and there never will be
 * one — the banner exists so an operator can tell "no data" from "stale data",
 * not so the app can pretend to accept input it cannot send.
 *
 * One poller is shared by every subscriber. The tab navigator keeps all five
 * screens mounted, and each renders the banner, so a per-hook interval would
 * mean five probes every 15 seconds instead of one.
 */
import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export interface Connectivity {
  /** `null` until the first probe resolves — do not show a banner on `null`. */
  online: boolean | null;
  /** Connected to a network but with no route to the internet. */
  limited: boolean;
}

const POLL_INTERVAL_MS = 15_000;

let current: Connectivity = { online: null, limited: false };
const subscribers = new Set<(state: Connectivity) => void>();
let interval: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;

async function probe(): Promise<void> {
  let next: Connectivity;
  try {
    const state = await Network.getNetworkStateAsync();
    const connected = state.isConnected ?? false;
    const reachable = state.isInternetReachable;
    next = {
      online: connected && reachable !== false,
      limited: connected && reachable === false,
    };
  } catch {
    // A failed probe is not evidence of being offline.
    next = { online: null, limited: false };
  }

  if (next.online === current.online && next.limited === current.limited) return;
  current = next;
  for (const notify of subscribers) notify(current);
}

function start(): void {
  if (interval) return;
  void probe();
  interval = setInterval(() => void probe(), POLL_INTERVAL_MS);
  appStateSubscription = AppState.addEventListener('change', (status) => {
    if (status === 'active') void probe();
  });
}

function stop(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  appStateSubscription?.remove();
  appStateSubscription = null;
}

export function useConnectivity(): Connectivity {
  const [state, setState] = useState<Connectivity>(current);

  useEffect(() => {
    subscribers.add(setState);
    start();
    return () => {
      subscribers.delete(setState);
      if (subscribers.size === 0) stop();
    };
  }, []);

  return state;
}
