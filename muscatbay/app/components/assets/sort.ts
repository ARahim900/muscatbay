import type { Asset } from "@/entities/asset";

export type SortDirection = "asc" | "desc";

/**
 * The field keys used in <Th field="…"> throughout assets/page.tsx.
 * These are the short keys from SORT_FIELD_MAP; this helper maps them to
 * the equivalent Asset property for client-side (mock-data) sorting.
 */
export type AssetSortField =
    | "name"
    | "tag"
    | "category"
    | "discipline"
    | "zone"
    | "building"
    | "status"
    | "criticality"
    | "installYear"
    | "lifeExpect"
    | "erlYears"
    | "pctLife"
    | "condition"
    | "ppmFreq"
    | "amcContractor"
    | "lastPpm"
    | "nextPpm"
    | "manufacturer"
    | "model"
    | "country"
    | "origCost"
    | "replCost"
    | "boqRef"
    | "boqLife"
    | "warranty";

/** Maps Th field keys → Asset property names */
const FIELD_TO_PROP: Record<AssetSortField, keyof Asset> = {
    name:          "name",
    tag:           "assetTag",
    category:      "type",
    discipline:    "discipline",
    zone:          "zone",
    building:      "buildingArea",
    status:        "status",
    criticality:   "criticalityLevel",
    installYear:   "installYear",
    lifeExpect:    "lifeExpectancyYears",
    erlYears:      "erlYears",
    pctLife:       "pctLifeUsed",
    condition:     "condition",
    ppmFreq:       "ppmFrequency",
    amcContractor: "amcContractor",
    lastPpm:       "lastPpmDate",
    nextPpm:       "nextPpmDate",
    manufacturer:  "manufacturer",
    model:         "model",
    country:       "countryOfOrigin",
    origCost:      "boqUnitCost",
    replCost:      "replacementCost",
    boqRef:        "boqProjectRef",
    boqLife:       "boqDesignLife",
    warranty:      "warrantyExpiryDate",
};

/**
 * Pure sort helper for Asset rows (used on mock/demo data).
 * When Supabase is live the sort is handled server-side; this runs only
 * for the mock data fallback path.
 *
 * - Does not mutate the input array.
 * - Null/undefined values sort last regardless of direction.
 * - Dates (lastPpm, nextPpm, warranty) are compared as Date objects.
 * - Numbers compared numerically; everything else compared via localeCompare.
 */
export function sortAssets(
    rows: Asset[],
    field: AssetSortField | null,
    direction: SortDirection,
): Asset[] {
    if (!field) return rows;

    const prop = FIELD_TO_PROP[field];
    if (!prop) return rows;

    const dir = direction === "asc" ? 1 : -1;

    // Date fields — compare as timestamps
    const DATE_FIELDS: Set<AssetSortField> = new Set([
        "lastPpm", "nextPpm", "warranty",
    ]);
    const isDate = DATE_FIELDS.has(field);

    return [...rows].sort((a, b) => {
        const av = a[prop] as unknown;
        const bv = b[prop] as unknown;

        if (av == null && bv == null) return 0;
        if (av == null) return 1;   // null always last
        if (bv == null) return -1;

        if (isDate) {
            const at = new Date(String(av)).getTime();
            const bt = new Date(String(bv)).getTime();
            return (at - bt) * dir;
        }

        if (typeof av === "number" && typeof bv === "number") {
            return (av - bv) * dir;
        }

        return String(av).localeCompare(String(bv)) * dir;
    });
}
