/**
 * Connectivity state.
 *
 * Uses `expo-network` rather than @react-native-community/netinfo so it works
 * in Expo Go with no extra native module.
 *
 * The app is READ-ONLY. There is no offline write queue and there never will be
 * one — the banner exists so an operator can tell "no data" from "stale data",
 * not so the app can pretend to accept input it cannot send.
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

async function probe(): Promise<Connectivity> {
  try {
    const state = await Network.getNetworkStateAsync();
    const connected = state.isConnected ?? false;
    const reachable = state.isInternetReachable;
    return {
      online: connected && reachable !== false,
      limited: connected && reachable === false,
    };
  } catch {
    // A failed probe is not evidence of being offline.
    return { online: null, limited: false };
  }
}

export function useConnectivity(): Connectivity {
  const [state, setState] = useState<Connectivity>({ online: null, limited: false });

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      void probe().then((next) => {
        if (!cancelled) setState(next);
      });
    };

    check();
    const interval = setInterval(check, 15_000);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') check();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return state;
}
