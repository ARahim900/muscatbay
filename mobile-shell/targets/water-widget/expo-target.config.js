/**
 * Home Screen water widget (WidgetKit). Home Screen only — owner decision
 * 2026-09-30; see docs/superpowers/specs/2026-10-06-ios-home-widget-design.md.
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'widget',
  name: 'WaterWidget',
  displayName: 'Muscat Bay Water',
  bundleIdentifier: '.waterwidget',
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  colors: {
    $accent: { color: '#4E4456', darkColor: '#A4C5BB' },
    $widgetBackground: { color: '#FFFFFF', darkColor: '#16141B' },
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
