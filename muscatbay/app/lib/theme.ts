/**
 * Theme preference rules, shared by the theme provider and the pre-paint
 * <head> script.
 *
 * - Browser: System (default) / Light / Dark, saved in localStorage.
 * - iOS app (mobile-shell WebView, user agent ends "MuscatBayApp/x"): always
 *   follows the iPhone's appearance. Apple's guidance is not to offer an
 *   in-app appearance switch, and a stale manual choice saved before this
 *   rule would otherwise pin the app to one theme for good.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const APP_SHELL_UA = "MuscatBayApp/";

export const THEME_LABEL: Record<ThemePreference, string> = { system: "System", light: "Light", dark: "Dark" };

export function isInAppShell(userAgent: string): boolean {
    return userAgent.includes(APP_SHELL_UA);
}

export function parseStoredPreference(value: string | null): ThemePreference {
    return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function effectivePreference(stored: ThemePreference, inApp: boolean): ThemePreference {
    return inApp ? "system" : stored;
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
    if (preference === "system") return systemDark ? "dark" : "light";
    return preference;
}

export function nextPreference(current: ThemePreference): ThemePreference {
    return current === "system" ? "light" : current === "light" ? "dark" : "system";
}

/**
 * Inline <head> script: sets the theme class before the first paint, so a
 * dark-mode phone never flashes the light page while React loads. Plain ES5,
 * no imports — keep the rules in step with the functions above (the tests run
 * this string against the same cases).
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var ua=navigator.userAgent||"";var stored=null;
try{stored=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});}catch(e){}
var pref=(stored==="light"||stored==="dark"||stored==="system")?stored:"system";
if(ua.indexOf(${JSON.stringify(APP_SHELL_UA)})!==-1)pref="system";
var dark=pref==="dark"||(pref==="system"&&window.matchMedia(${JSON.stringify(DARK_MEDIA_QUERY)}).matches);
var t=dark?"dark":"light";var r=document.documentElement;
r.classList.remove("light","dark");r.classList.add(t);r.style.colorScheme=t;
}catch(e){}})();`;
