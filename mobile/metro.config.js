// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const srcRoot = path.resolve(projectRoot, 'src');

/**
 * The Next.js web app. Its `entities/`, `lib/` and `functions/api/` folders are
 * plain, platform-agnostic TypeScript, so the mobile app CONSUMES them directly
 * instead of copying them. This directory is read-only from here.
 */
const webRoot = path.resolve(projectRoot, '../muscatbay/app');

/**
 * The single adapter that makes the shared data layer run on React Native.
 *
 * `functions/api/*.ts` all do `import { getSupabaseClient } from '../supabase-client'`,
 * and that web module builds a `@supabase/ssr` browser client backed by
 * `document.cookie` + `process.env.NEXT_PUBLIC_*` — neither of which exists on a
 * phone. Rather than fork the API layer, Metro swaps that one leaf module for
 * the AsyncStorage-backed React Native client. Every API function above it is
 * byte-for-byte the web app's own code.
 */
const supabaseClientAdapter = path.resolve(srcRoot, 'adapters/supabase-client.ts');

/** Only these subtrees of the web app are shared — never its `app/` or `components/`. */
const sharedWebFolders = ['entities', 'lib', 'functions'].map((d) => path.join(webRoot, d));

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Metro may only read files under the project root or an explicit watch folder.
config.watchFolders = [...(config.watchFolders ?? []), ...sharedWebFolders];

// The web app has its own node_modules (Next.js, React 19 for web, Recharts...).
// Pin every resolution to the mobile app's node_modules so a shared module can
// never pull a second, web-flavoured copy of React or supabase-js into the bundle.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

const withCss = withNativeWind(config, {
  input: './src/global.css',
  configPath: './tailwind.config.js',
});

const upstreamResolveRequest = withCss.resolver.resolveRequest;

withCss.resolver.resolveRequest = (context, moduleName, platform) => {
  const next = upstreamResolveRequest ?? context.resolveRequest;

  // 1. Shared web module asking for the Supabase browser client → RN adapter.
  if (
    /(^|\/)supabase-client$/.test(moduleName) &&
    context.originModulePath &&
    context.originModulePath.startsWith(webRoot)
  ) {
    return next(context, supabaseClientAdapter, platform);
  }

  // 2. `@/…` → the web app root (mirrors the web app's own tsconfig alias, so
  //    shared modules resolve their internal imports unchanged).
  if (moduleName.startsWith('@/')) {
    return next(context, path.join(webRoot, moduleName.slice(2)), platform);
  }

  // 3. `~/…` → this mobile app's `src/`.
  if (moduleName.startsWith('~/')) {
    return next(context, path.join(srcRoot, moduleName.slice(2)), platform);
  }

  return next(context, moduleName, platform);
};

module.exports = withCss;
