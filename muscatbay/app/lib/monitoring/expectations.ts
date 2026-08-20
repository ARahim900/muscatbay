/**
 * The daily water reading register — which meters are expected to report on
 * any given day, and which of them the balance cannot survive without.
 *
 * Derived entirely from `lib/water-accounts.ts`, the configuration the Daily
 * Water Report itself is built from. That is deliberate: the monitor's idea of
 * "expected" must be the *same* list the report renders, or it would police a
 * standard the app does not actually hold itself to.
 *
 * The register is a derivation, not a second copy — add a meter to
 * `lib/water-accounts.ts` and it is monitored on the next render.
 *
 * @module lib/monitoring/expectations
 */

import {
    BUILDING_CONFIG,
    DC_METERS,
    MAIN_BULK_ACCOUNT,
    ZONE_BULK_CONFIG,
} from "@/lib/water-accounts";

/** Where a meter sits in the supply chain — drives grouping in the breakdown. */
export type WaterMeterGroup =
    | "Main bulk"
    | "Zone bulk"
    | "Zone meter"
    | "Building meter"
    | "Direct connection";

export interface WaterDailyExpectation {
    account: string;
    /** Best label available from configuration; the data's meter name wins when present. */
    label: string;
    group: WaterMeterGroup;
    /**
     * True when the day's balance cannot be computed without this reading —
     * the NAMA main bulk (L1) and every zone bulk (L2). A missing villa meter
     * dents a percentage; a missing bulk blinds the whole level.
     */
    blocking: boolean;
}

/** Priority when an account appears in more than one list (bulk beats member). */
const GROUP_PRIORITY: Record<WaterMeterGroup, number> = {
    "Main bulk": 0,
    "Zone bulk": 1,
    "Building meter": 2,
    "Direct connection": 3,
    "Zone meter": 4,
};

/**
 * Every account the daily report expects a reading for, de-duplicated.
 *
 * A building's bulk meter appears both as its zone's L3 member and as the
 * parent of its L4 list; it is kept once, at its highest-priority role.
 */
export function waterDailyExpectations(): WaterDailyExpectation[] {
    const byAccount = new Map<string, WaterDailyExpectation>();

    const put = (exp: WaterDailyExpectation) => {
        const existing = byAccount.get(exp.account);
        if (existing && GROUP_PRIORITY[existing.group] <= GROUP_PRIORITY[exp.group]) return;
        byAccount.set(exp.account, exp);
    };

    put({
        account: MAIN_BULK_ACCOUNT,
        label: "Main Bulk (NAMA)",
        group: "Main bulk",
        blocking: true,
    });

    for (const zone of ZONE_BULK_CONFIG) {
        put({
            account: zone.l2Account,
            label: `${zone.zoneName} bulk`,
            group: "Zone bulk",
            blocking: true,
        });
        for (const account of zone.l3Accounts) {
            put({ account, label: `${zone.zoneName} meter ${account}`, group: "Zone meter", blocking: false });
        }
    }

    for (const building of BUILDING_CONFIG) {
        for (const account of building.l4Accounts) {
            put({
                account,
                label: `${building.buildingName} meter ${account}`,
                group: "Building meter",
                blocking: false,
            });
        }
    }

    for (const dc of DC_METERS) {
        put({ account: dc.account, label: dc.meterName, group: "Direct connection", blocking: false });
    }

    return [...byAccount.values()];
}

/** The account set, for spotting meters that report data without being registered. */
export function waterDailyExpectedAccounts(): Set<string> {
    return new Set(waterDailyExpectations().map((e) => e.account));
}
