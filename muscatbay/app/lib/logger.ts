/**
 * App-wide logger that disappears in production builds.
 *
 * Rationale: anything written to console.log is visible to anyone with
 * DevTools. Accidental session-token / PII logging is a real risk. This
 * wrapper makes development logging easy while guaranteeing nothing
 * leaks in prod.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.debug("loaded", count, "rows");
 *   logger.warn("falling back to demo data");
 *   logger.error("supabase auth failed", err);
 *
 * Rules:
 *   - debug/info: only run when NODE_ENV !== 'production'
 *   - warn/error: always run — operations team should see these
 *   - Errors get a single tag so they're easy to filter in Sentry/console
 */

const isDev = process.env.NODE_ENV !== "production";

type Args = unknown[];

export const logger = {
    debug: (...args: Args) => {
        if (isDev) console.debug("[mb]", ...args);
    },
    info: (...args: Args) => {
        if (isDev) console.info("[mb]", ...args);
    },
    warn: (...args: Args) => {
        // Always log warnings — these usually signal data integrity issues
        // operators need to see in the field.
        console.warn("[mb]", ...args);
    },
    error: (...args: Args) => {
        // Always log errors — caller is responsible for stripping PII.
        console.error("[mb]", ...args);
    },
};
