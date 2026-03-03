/**
 * @fileoverview Water System Account Number Configuration
 * All zone, building and DC meter account mappings used by the daily report.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZoneBulkConfig {
    zoneName: string;
    l2Account: string;
    l3Accounts: readonly string[];
}

export interface BuildingConfig {
    buildingName: string;
    zone: '3A' | '3B';
    bulkAccount: string;
    l4Accounts: readonly string[];
}

export interface DCMeterConfig {
    meterName: string;
    account: string;
    /** Irrigation meters: NULL reading is normal → display as 0, no amber flag */
    isIrr: boolean;
}

// Used by the API route and the component
export interface GrafanaReading {
    accountNumber: string;
    value: number | null;
}

// ─── Zone L2 vs L3 ────────────────────────────────────────────────────────────

export const ZONE_BULK_CONFIG: ZoneBulkConfig[] = [
    {
        zoneName: 'Zone FM',
        l2Account: '4300346',
        l3Accounts: [
            '4300296', '4300298', '4300300', '4300301', '4300302', '4300303',
            '4300304', '4300305', '4300306', '4300307', '4300308', '4300309',
            '4300310', '4300324', '4300325', '4300337', '4300339',
        ],
    },
    {
        zoneName: 'Zone 3A',
        l2Account: '4300343',
        l3Accounts: [
            '4300002', '4300005', '4300038', '4300044', '4300049', '4300050',
            '4300052', '4300075', '4300079', '4300081', '4300082', '4300084',
            '4300085', '4300086', '4300087', '4300089', '4300091', '4300093',
            '4300095', '4300097', '4300101', '4300176', '4300177', '4300178',
            '4300179', '4300180', '4300181', '4300182', '4300183', '4300184',
            '4300185',
        ],
    },
    {
        zoneName: 'Zone 3B',
        l2Account: '4300344',
        l3Accounts: [
            '4300009', '4300020', '4300025', '4300057', '4300060', '4300076',
            '4300077', '4300078', '4300080', '4300083', '4300088', '4300090',
            '4300092', '4300094', '4300096', '4300098', '4300099', '4300100',
            '4300102', '4300103', '4300104', '4300105', '4300186', '4300187',
            '4300311', '4300312', '4300313', '4300314', '4300315', '4300316',
            '4300317', '4300318', '4300319', '4300320',
        ],
    },
    {
        zoneName: 'Zone 5',
        l2Account: '4300345',
        l3Accounts: [
            '4300001', '4300058', '4300059', '4300146', '4300147', '4300148',
            '4300149', '4300150', '4300151', '4300152', '4300153', '4300154',
            '4300155', '4300156', '4300157', '4300158', '4300159', '4300160',
            '4300161', '4300162', '4300163', '4300164', '4300165', '4300166',
            '4300167', '4300168', '4300169', '4300170', '4300171', '4300172',
            '4300173', '4300174', '4300175', '4300321',
        ],
    },
    {
        zoneName: 'Zone 8',
        l2Account: '4300342',
        l3Accounts: [
            '4300023', '4300024', '4300188', '4300189', '4300190', '4300191',
            '4300192', '4300193', '4300194', '4300195', '4300196', '4300197',
            '4300198', '4300199', '4300200', '4300287', '4300288', '4300289',
            '4300290', '4300291', '4300292', '4300293',
        ],
    },
    {
        zoneName: 'Village Square',
        l2Account: '4300335',
        l3Accounts: ['4300326', '4300327', '4300329', '4300330', '4300331', '4300332', '4300333'],
    },
    {
        zoneName: 'Sales Center',
        l2Account: '4300295',
        l3Accounts: ['4300328'],
    },
];

// ─── Building L3 Bulk vs L4 Apartments ────────────────────────────────────────

export const BUILDING_CONFIG: BuildingConfig[] = [
    // ── Zone 3A ──────────────────────────────────────────────────────────────
    {
        buildingName: 'D-44', zone: '3A', bulkAccount: '4300178',
        l4Accounts: ['4300144', '4300030', '4300031', '4300032', '4300033', '4300034', '4300035'],
    },
    {
        buildingName: 'D-45', zone: '3A', bulkAccount: '4300179',
        l4Accounts: ['4300135', '4300110', '4300113', '4300013', '4300026', '4300017', '4300019'],
    },
    {
        buildingName: 'D-46', zone: '3A', bulkAccount: '4300180',
        l4Accounts: ['4300138', '4300011', '4300014', '4300007', '4300043', '4300003', '4300015'],
    },
    {
        buildingName: 'D-47', zone: '3A', bulkAccount: '4300181',
        l4Accounts: ['4300143', '4300115', '4300012', '4300039', '4300016', '4300018', '4300051'],
    },
    {
        buildingName: 'D-48', zone: '3A', bulkAccount: '4300182',
        l4Accounts: ['4300141', '4300117', '4300123', '4300040', '4300131', '4300048', '4300041'],
    },
    {
        buildingName: 'D-49', zone: '3A', bulkAccount: '4300183',
        l4Accounts: ['4300140', '4300107', '4300108', '4300004', '4300010', '4300053', '4300061'],
    },
    {
        buildingName: 'D-50', zone: '3A', bulkAccount: '4300184',
        l4Accounts: ['4300136', '4300109', '4300047', '4300021', '4300027', '4300028', '4300114'],
    },
    {
        buildingName: 'D-51', zone: '3A', bulkAccount: '4300185',
        l4Accounts: ['4300137', '4300111', '4300112', '4300121', '4300127', '4300134', '4300128'],
    },
    {
        buildingName: 'D-74', zone: '3A', bulkAccount: '4300177',
        l4Accounts: ['4300139', '4300106', '4300118', '4300022', '4300125', '4300045', '4300046'],
    },
    {
        buildingName: 'D-75', zone: '3A', bulkAccount: '4300176',
        l4Accounts: ['4300145', '4300036', '4300122', '4300037', '4300006', '4300055', '4300063'],
    },
    // ── Zone 3B ──────────────────────────────────────────────────────────────
    {
        buildingName: 'D-52', zone: '3B', bulkAccount: '4300186',
        l4Accounts: ['4300126', '4300116', '4300069', '4300042', '4300029', '4300056', '4300008'],
    },
    {
        buildingName: 'D-53', zone: '3B', bulkAccount: '4300311',
        l4Accounts: [
            '4300201', '4300210', '4300211', '4300212', '4300213', '4300214',
            '4300215', '4300216', '4300064', '4300217', '4300074',
        ],
    },
    {
        buildingName: 'D-54', zone: '3B', bulkAccount: '4300312',
        l4Accounts: [
            '4300202', '4300218', '4300219', '4300220', '4300221', '4300222',
            '4300223', '4300224', '4300225', '4300226', '4300227',
        ],
    },
    {
        buildingName: 'D-55', zone: '3B', bulkAccount: '4300313',
        l4Accounts: [
            '4300203', '4300228', '4300071', '4300229', '4300230', '4300231',
            '4300232', '4300233', '4300234', '4300235', '4300236',
        ],
    },
    {
        buildingName: 'D-56', zone: '3B', bulkAccount: '4300314',
        l4Accounts: [
            '4300204', '4300237', '4300238', '4300239', '4300240', '4300241',
            '4300242', '4300243', '4300244', '4300245', '4300246',
        ],
    },
    {
        buildingName: 'D-57', zone: '3B', bulkAccount: '4300315',
        l4Accounts: [
            '4300205', '4300247', '4300248', '4300249', '4300250', '4300251',
            '4300252', '4300253', '4300254', '4300255', '4300256',
        ],
    },
    {
        buildingName: 'D-58', zone: '3B', bulkAccount: '4300316',
        l4Accounts: [
            '4300206', '4300257', '4300070', '4300258', '4300259', '4300260',
            '4300130', '4300261', '4300120', '4300262', '4300132',
        ],
    },
    {
        buildingName: 'D-59', zone: '3B', bulkAccount: '4300317',
        l4Accounts: [
            '4300207', '4300263', '4300264', '4300265', '4300266', '4300073',
            '4300267', '4300268', '4300066', '4300269', '4300270',
        ],
    },
    {
        buildingName: 'D-60', zone: '3B', bulkAccount: '4300318',
        l4Accounts: [
            '4300208', '4300271', '4300065', '4300272', '4300072', '4300273',
            '4300067', '4300274', '4300068', '4300275', '4300276',
        ],
    },
    {
        buildingName: 'D-61', zone: '3B', bulkAccount: '4300319',
        l4Accounts: [
            '4300209', '4300277', '4300278', '4300279', '4300280', '4300281',
            '4300282', '4300283', '4300284', '4300285', '4300286',
        ],
    },
    {
        buildingName: 'D-62', zone: '3B', bulkAccount: '4300187',
        l4Accounts: ['4300142', '4300062', '4300119', '4300124', '4300129', '4300133', '4300054'],
    },
];

// ─── Direct Connection (DC) Meters ────────────────────────────────────────────

export const DC_METERS: DCMeterConfig[] = [
    { meterName: 'IRR Tank Z08',              account: '4300294', isIrr: true  },
    { meterName: 'Building Security',          account: '4300297', isIrr: false },
    { meterName: 'Building ROP',               account: '4300299', isIrr: false },
    { meterName: 'IRR Tank 01 Inlet',          account: '4300323', isIrr: true  },
    { meterName: 'Hotel Main Building',        account: '4300334', isIrr: false },
    { meterName: 'Community Mgmt / STP',       account: '4300336', isIrr: false },
    { meterName: 'Main Entrance Phase 02',     account: '4300338', isIrr: false },
    { meterName: 'Irrigation Controller UP',   account: '4300340', isIrr: true  },
    { meterName: 'Irrigation Controller DOWN', account: '4300341', isIrr: true  },
    { meterName: 'Al Adrak Camp',              account: '4300348', isIrr: false },
    { meterName: 'Al Adrak Accommodation',     account: '4300349', isIrr: false },
];

// ─── NULL-as-zero accounts ────────────────────────────────────────────────────
// These accounts show NULL readings in Grafana under normal operating conditions.
// They should be displayed as 0 and NOT flagged as issues.

export const NULL_AS_ZERO_ACCOUNTS = new Set([
    '4300308', // Irrigation Tank (Zone FM)
    '4300320', // Irrigation (Zone 3B)
    '4300321', // Irrigation (Zone 5)
    '4300326', // Village Square IRR
    '4300294', // IRR Tank Z08
]);

// ─── Helper: all account numbers needed for the Grafana query ────────────────

export function getAllReportAccounts(): string[] {
    const accs = new Set<string>();
    for (const z of ZONE_BULK_CONFIG) {
        accs.add(z.l2Account);
        z.l3Accounts.forEach(a => accs.add(a));
    }
    for (const b of BUILDING_CONFIG) {
        b.l4Accounts.forEach(a => accs.add(a));
        // bulkAccount is already in the zone's l3Accounts list
    }
    for (const dc of DC_METERS) {
        accs.add(dc.account);
    }
    return [...accs];
}
