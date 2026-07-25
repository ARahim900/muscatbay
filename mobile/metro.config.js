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

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Metro may only read files under the project root or an explicit watch folder.
//
// The WHOLE web-app root is watched rather than just `lib/`, `entities/` and
// `functions/`: Metro resolves a module's owning package by walking up from the
// file to the nearest package.json, and that file sits at the web-app root.
// Watching only the subfolders makes every shared module resolve as
// "none of these files exist". The heavy subtrees are blocked below instead.
config.watchFolders = [...(config.watchFolders ?? []), webRoot];

// Never crawl the web app's dependencies or build output — only its plain
// TypeScript sources are shared; everything else there is Next.js-specific.
const escaped = webRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blockedWebSubtrees = [
  'node_modules',
  '.next',
  'dist',
  'public',
  'sql',
  'scripts',
  'testsprite_tests',
  '__tests__',
].map((dir) => new RegExp(`^${escaped}/${dir}/.*`));

const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  ...blockedWebSubtrees,
];

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
    const target = path.join(webRoot, moduleName.slice(2));
    console.log('[DBG]', moduleName, 'web?', context.doesFileExist(target + '.ts'), 'mobile?', context.doesFileExist(path.join(srcRoot, 'lib/cn.ts')), 'webRootPkg?', context.doesFileExist(path.join(webRoot, 'package.json')));
    return next(context, target, platform);
  }

  // 3. `~/…` → this mobile app's `src/`.
  if (moduleName.startsWith('~/')) {
    return next(context, path.join(srcRoot, moduleName.slice(2)), platform);
  }

  return next(context, moduleName, platform);
};

module.exports = withCss;
