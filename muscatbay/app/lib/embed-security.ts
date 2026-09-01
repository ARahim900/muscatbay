export type ApprovedEmbedKind = "aitable" | "google-drive" | "satellite";

export interface ApprovedEmbed {
    kind: ApprovedEmbedKind;
    /** Canonical URL safe to place in an iframe src attribute. */
    url: string;
    sandbox: string;
    allow?: string;
}

export const EMBED_SANDBOX = {
    aitable: "allow-scripts allow-same-origin allow-popups",
    googleDrive: "allow-scripts allow-same-origin allow-popups allow-downloads",
    satellite: "allow-scripts allow-same-origin",
} as const;

const APPROVED_AITABLE_SHARES = new Set([
    "shrRV9Fp15zCH50ZFTWtb", // Pest control operations
    "shripyzrlnlQ91WRSyCLF", // STP operations
]);

const GOOGLE_DRIVE_FILE_ID = /^[A-Za-z0-9_-]{10,200}$/;
const GOOGLE_DRIVE_RESOURCE_KEY = /^[A-Za-z0-9_-]{1,200}$/;

function hasCredentials(url: URL): boolean {
    return url.username.length > 0 || url.password.length > 0;
}

function hasOnlySearchParams(url: URL, allowed: ReadonlySet<string>): boolean {
    return [...url.searchParams.keys()].every((key) => allowed.has(key));
}

function canonicalizeAitable(url: URL): ApprovedEmbed | null {
    if (url.hostname !== "aitable.ai" || url.port || url.hash) return null;

    const match = /^\/share\/([A-Za-z0-9]+)\/?$/.exec(url.pathname);
    if (!match || !APPROVED_AITABLE_SHARES.has(match[1])) return null;
    if (!hasOnlySearchParams(url, new Set(["theme"]))) return null;

    const theme = url.searchParams.get("theme");
    if (theme !== null && theme !== "light" && theme !== "dark") return null;

    const canonical = new URL(`https://aitable.ai/share/${match[1]}`);
    if (theme) canonical.searchParams.set("theme", theme);

    return {
        kind: "aitable",
        url: canonical.toString(),
        sandbox: EMBED_SANDBOX.aitable,
        allow: "fullscreen",
    };
}

function canonicalizeGoogleDrive(url: URL): ApprovedEmbed | null {
    if (url.hostname !== "drive.google.com" || url.port || url.hash) return null;

    const match = /^\/file\/d\/([^/]+)\/(?:view|preview)\/?$/.exec(url.pathname);
    if (!match || !GOOGLE_DRIVE_FILE_ID.test(match[1])) return null;
    if (!hasOnlySearchParams(url, new Set(["usp", "resourcekey"]))) return null;

    const usp = url.searchParams.get("usp");
    if (usp !== null && usp !== "sharing") return null;
    const resourceKey = url.searchParams.get("resourcekey");
    if (resourceKey !== null && !GOOGLE_DRIVE_RESOURCE_KEY.test(resourceKey)) return null;

    const canonical = new URL(`https://drive.google.com/file/d/${match[1]}/preview`);
    if (resourceKey) canonical.searchParams.set("resourcekey", resourceKey);

    return {
        kind: "google-drive",
        url: canonical.toString(),
        sandbox: EMBED_SANDBOX.googleDrive,
    };
}

function canonicalizeSatellite(url: URL, baseOrigin: string): ApprovedEmbed | null {
    const approvedOrigin = new URL(baseOrigin).origin;
    if (url.origin !== approvedOrigin || url.pathname !== "/satellite/index.html" || url.hash) return null;
    if (!hasOnlySearchParams(url, new Set(["embed"]))) return null;
    if (url.searchParams.get("embed") !== "1") return null;

    return {
        kind: "satellite",
        url: `${approvedOrigin}/satellite/index.html?embed=1`,
        sandbox: EMBED_SANDBOX.satellite,
    };
}

/**
 * Convert a supported iframe URL to its canonical form. Unknown hosts, paths,
 * query parameters and credential-bearing URLs are rejected. A relative URL is
 * accepted only for the same-origin satellite view.
 */
export function canonicalizeApprovedEmbedUrl(
    input: string,
    baseOrigin = "https://www.muscatbay.work",
): ApprovedEmbed | null {
    let url: URL;
    try {
        url = new URL(input, baseOrigin);
    } catch {
        return null;
    }

    if (url.protocol !== "https:" || hasCredentials(url)) return null;

    return canonicalizeAitable(url)
        ?? canonicalizeGoogleDrive(url)
        ?? canonicalizeSatellite(url, baseOrigin);
}

export function isApprovedEmbedUrl(input: string, baseOrigin?: string): boolean {
    return canonicalizeApprovedEmbedUrl(input, baseOrigin) !== null;
}
