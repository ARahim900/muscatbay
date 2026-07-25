/**
 * Runtime environment detection.
 *
 * The app's first delivery target is Expo Go, which does not contain every
 * native module a standalone build does. Anything that behaves differently in
 * Expo Go is gated on `isExpoGo` and reports the limitation honestly in the UI
 * instead of throwing or silently doing nothing.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';

/** True when running inside the Expo Go sandbox app. */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

/** True in a development build, TestFlight build or a store build. */
export const isNativeBuild = !isExpoGo;
