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
        l3Accounts: ['4300326', '4300327', '4300328', '4300329', '4300330', '4300331', '4300332', '4300333'],
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
    { meterName: 'Sales Center',              account: '4300295', isIrr: false },
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

// ─── Building Child Meter Details ─────────────────────────────────────────────
// Maps each D-Building to its child meters with labels and types.
// Used by the expanded building detail view in the Daily Report.

export interface ChildMeterInfo {
    account: string;
    label: string;
    type: 'Apartment' | 'Common';
}

export const BUILDING_CHILD_METERS: Record<string, ChildMeterInfo[]> = {
    // ── Zone 3A (10 buildings × 7 children = 70 total) ──────────────────────
    'D-44': [
        { account: '4300030', label: 'Z3-44(1A)', type: 'Apartment' },
        { account: '4300031', label: 'Z3-44(1B)', type: 'Apartment' },
        { account: '4300032', label: 'Z3-44(2A)', type: 'Apartment' },
        { account: '4300033', label: 'Z3-44(2B)', type: 'Apartment' },
        { account: '4300034', label: 'Z3-44(5)', type: 'Apartment' },
        { account: '4300035', label: 'Z3-44(6)', type: 'Apartment' },
        { account: '4300144', label: 'D 44-Building Common', type: 'Common' },
    ],
    'D-45': [
        { account: '4300110', label: 'Z3-45(1A)', type: 'Apartment' },
        { account: '4300113', label: 'Z3-45(2A)', type: 'Apartment' },
        { account: '4300013', label: 'Z3-45(3A)', type: 'Apartment' },
        { account: '4300026', label: 'Z3-45(4A)', type: 'Apartment' },
        { account: '4300017', label: 'Z3-45(5)', type: 'Apartment' },
        { account: '4300019', label: 'Z3-45(6)', type: 'Apartment' },
        { account: '4300135', label: 'D 45-Building Common', type: 'Common' },
    ],
    'D-46': [
        { account: '4300011', label: 'Z3-46(1A)', type: 'Apartment' },
        { account: '4300014', label: 'Z3-46(2A)', type: 'Apartment' },
        { account: '4300007', label: 'Z3-46(3A)', type: 'Apartment' },
        { account: '4300043', label: 'Z3-46(4A)', type: 'Apartment' },
        { account: '4300003', label: 'Z3-46(5)', type: 'Apartment' },
        { account: '4300015', label: 'Z3-46(6)', type: 'Apartment' },
        { account: '4300138', label: 'D 46-Building Common', type: 'Common' },
    ],
    'D-47': [
        { account: '4300115', label: 'Z3-47(1)', type: 'Apartment' },
        { account: '4300012', label: 'Z3-47(2)', type: 'Apartment' },
        { account: '4300039', label: 'Z3-47(3)', type: 'Apartment' },
        { account: '4300016', label: 'Z3-47(4)', type: 'Apartment' },
        { account: '4300018', label: 'Z3-47(5)', type: 'Apartment' },
        { account: '4300051', label: 'Z3-47(6)', type: 'Apartment' },
        { account: '4300143', label: 'D 47-Building Common', type: 'Common' },
    ],
    'D-48': [
        { account: '4300117', label: 'Z3-48(1)', type: 'Apartment' },
        { account: '4300123', label: 'Z3-48(2)', type: 'Apartment' },
        { account: '4300040', label: 'Z3-48(3)', type: 'Apartment' },
        { account: '4300131', label: 'Z3-48(4)', type: 'Apartment' },
        { account: '4300048', label: 'Z3-48(5)', type: 'Apartment' },
        { account: '4300041', label: 'Z3-48(6)', type: 'Apartment' },
        { account: '4300141', label: 'D 48-Building Common', type: 'Common' },
    ],
    'D-49': [
        { account: '4300107', label: 'Z3-49(1)', type: 'Apartment' },
        { account: '4300108', label: 'Z3-49(2)', type: 'Apartment' },
        { account: '4300004', label: 'Z3-49(3)', type: 'Apartment' },
        { account: '4300010', label: 'Z3-049(4)', type: 'Apartment' },
        { account: '4300053', label: 'Z3-49(5)', type: 'Apartment' },
        { account: '4300061', label: 'Z3-49(6)', type: 'Apartment' },
        { account: '4300140', label: 'D 49-Building Common', type: 'Common' },
    ],
    'D-50': [
        { account: '4300109', label: 'Z3-50(1)', type: 'Apartment' },
        { account: '4300114', label: 'Z3-050(2)', type: 'Apartment' },
        { account: '4300047', label: 'Z3-50(3)', type: 'Apartment' },
        { account: '4300021', label: 'Z3-50(4)', type: 'Apartment' },
        { account: '4300027', label: 'Z3-50(5)', type: 'Apartment' },
        { account: '4300028', label: 'Z3-50(6)', type: 'Apartment' },
        { account: '4300136', label: 'D 50-Building Common', type: 'Common' },
    ],
    'D-51': [
        { account: '4300111', label: 'Z3-51(1)', type: 'Apartment' },
        { account: '4300112', label: 'Z3-51(2)', type: 'Apartment' },
        { account: '4300121', label: 'Z3-51(3)', type: 'Apartment' },
        { account: '4300127', label: 'Z3-51(4)', type: 'Apartment' },
        { account: '4300128', label: 'Z3-051(5)', type: 'Apartment' },
        { account: '4300134', label: 'Z3-51(6)', type: 'Apartment' },
        { account: '4300137', label: 'D 51-Building Common', type: 'Common' },
    ],
    'D-74': [
        { account: '4300106', label: 'Z3-74(1)', type: 'Apartment' },
        { account: '4300118', label: 'Z3-74(2)', type: 'Apartment' },
        { account: '4300022', label: 'Z3-74(3)', type: 'Apartment' },
        { account: '4300125', label: 'Z3-74(4)', type: 'Apartment' },
        { account: '4300045', label: 'Z3-74(5)', type: 'Apartment' },
        { account: '4300046', label: 'Z3-74(6)', type: 'Apartment' },
        { account: '4300139', label: 'D 74-Building Common', type: 'Common' },
    ],
    'D-75': [
        { account: '4300036', label: 'Z3-75(1)', type: 'Apartment' },
        { account: '4300122', label: 'Z3-75(2)', type: 'Apartment' },
        { account: '4300037', label: 'Z3-75(3)', type: 'Apartment' },
        { account: '4300006', label: 'Z3-75(4)', type: 'Apartment' },
        { account: '4300055', label: 'Z3-75(5)', type: 'Apartment' },
        { account: '4300063', label: 'Z3-75(6)', type: 'Apartment' },
        { account: '4300145', label: 'D 75-Building Common', type: 'Common' },
    ],
    // ── Zone 3B (11 buildings, 113 total children) ──────────────────────────
    'D-52': [
        { account: '4300116', label: 'Z3-52(1A)', type: 'Apartment' },
        { account: '4300069', label: 'Z3-52(2A)', type: 'Apartment' },
        { account: '4300042', label: 'Z3-52(3A)', type: 'Apartment' },
        { account: '4300029', label: 'Z3-52(4A)', type: 'Apartment' },
        { account: '4300056', label: 'Z3-52(5)', type: 'Apartment' },
        { account: '4300008', label: 'Z3-52(6)', type: 'Apartment' },
        { account: '4300126', label: 'D 52-Building Common', type: 'Common' },
    ],
    'D-53': [
        { account: '4300210', label: 'Z3-53(1A)', type: 'Apartment' },
        { account: '4300211', label: 'Z3-53(1B)', type: 'Apartment' },
        { account: '4300212', label: 'Z3-53(2A)', type: 'Apartment' },
        { account: '4300213', label: 'Z3-53(2B)', type: 'Apartment' },
        { account: '4300214', label: 'Z3-53(3A)', type: 'Apartment' },
        { account: '4300215', label: 'Z3-53(3B)', type: 'Apartment' },
        { account: '4300216', label: 'Z3-53(4A)', type: 'Apartment' },
        { account: '4300064', label: 'Z3-53(4B)', type: 'Apartment' },
        { account: '4300217', label: 'Z3-53(5)', type: 'Apartment' },
        { account: '4300074', label: 'Z3-53(6)', type: 'Apartment' },
        { account: '4300201', label: 'D 53-Building Common', type: 'Common' },
    ],
    'D-54': [
        { account: '4300218', label: 'Z3-54(1A)', type: 'Apartment' },
        { account: '4300219', label: 'Z3-54(1B)', type: 'Apartment' },
        { account: '4300220', label: 'Z3-54(2A)', type: 'Apartment' },
        { account: '4300221', label: 'Z3-54(2B)', type: 'Apartment' },
        { account: '4300222', label: 'Z3-54(3A)', type: 'Apartment' },
        { account: '4300223', label: 'Z3-54(3B)', type: 'Apartment' },
        { account: '4300224', label: 'Z3-54(4A)', type: 'Apartment' },
        { account: '4300225', label: 'Z3-54(4B)', type: 'Apartment' },
        { account: '4300226', label: 'Z3-54(5)', type: 'Apartment' },
        { account: '4300227', label: 'Z3-54(6)', type: 'Apartment' },
        { account: '4300202', label: 'D 54-Building Common', type: 'Common' },
    ],
    'D-55': [
        { account: '4300228', label: 'Z3-55(1A)', type: 'Apartment' },
        { account: '4300071', label: 'Z3-55(1B)', type: 'Apartment' },
        { account: '4300229', label: 'Z3-55(2A)', type: 'Apartment' },
        { account: '4300230', label: 'Z3-55(2B)', type: 'Apartment' },
        { account: '4300231', label: 'Z3-55(3A)', type: 'Apartment' },
        { account: '4300232', label: 'Z3-55(3B)', type: 'Apartment' },
        { account: '4300233', label: 'Z3-55(4A)', type: 'Apartment' },
        { account: '4300234', label: 'Z3-55(4B)', type: 'Apartment' },
        { account: '4300235', label: 'Z3-55(5)', type: 'Apartment' },
        { account: '4300236', label: 'Z3-55(6)', type: 'Apartment' },
        { account: '4300203', label: 'D 55-Building Common', type: 'Common' },
    ],
    'D-56': [
        { account: '4300237', label: 'Z3-56(1A)', type: 'Apartment' },
        { account: '4300238', label: 'Z3-56(1B)', type: 'Apartment' },
        { account: '4300239', label: 'Z3-56(2A)', type: 'Apartment' },
        { account: '4300240', label: 'Z3-56(2B)', type: 'Apartment' },
        { account: '4300241', label: 'Z3-56(3A)', type: 'Apartment' },
        { account: '4300242', label: 'Z3-56(3B)', type: 'Apartment' },
        { account: '4300243', label: 'Z3-56(4A)', type: 'Apartment' },
        { account: '4300244', label: 'Z3-56(4B)', type: 'Apartment' },
        { account: '4300245', label: 'Z3-56(5)', type: 'Apartment' },
        { account: '4300246', label: 'Z3-56(6)', type: 'Apartment' },
        { account: '4300204', label: 'D 56-Building Common', type: 'Common' },
    ],
    'D-57': [
        { account: '4300247', label: 'Z3-57(1A)', type: 'Apartment' },
        { account: '4300248', label: 'Z3-57(1B)', type: 'Apartment' },
        { account: '4300249', label: 'Z3-57(2A)', type: 'Apartment' },
        { account: '4300250', label: 'Z3-57(2B)', type: 'Apartment' },
        { account: '4300251', label: 'Z3-57(3A)', type: 'Apartment' },
        { account: '4300252', label: 'Z3-57(3B)', type: 'Apartment' },
        { account: '4300253', label: 'Z3-57(4A)', type: 'Apartment' },
        { account: '4300254', label: 'Z3-57(4B)', type: 'Apartment' },
        { account: '4300255', label: 'Z3-57(5)', type: 'Apartment' },
        { account: '4300256', label: 'Z3-57(6)', type: 'Apartment' },
        { account: '4300205', label: 'D 57-Building Common', type: 'Common' },
    ],
    'D-58': [
        { account: '4300257', label: 'Z3-58(1A)', type: 'Apartment' },
        { account: '4300070', label: 'Z3-58(1B)', type: 'Apartment' },
        { account: '4300258', label: 'Z3-58(2A)', type: 'Apartment' },
        { account: '4300259', label: 'Z3-58(2B)', type: 'Apartment' },
        { account: '4300260', label: 'Z3-58(3A)', type: 'Apartment' },
        { account: '4300130', label: 'Z3-58(3B)', type: 'Apartment' },
        { account: '4300261', label: 'Z3-58(4A)', type: 'Apartment' },
        { account: '4300132', label: 'Z3-058(4B)', type: 'Apartment' },
        { account: '4300120', label: 'Z3-58(5)', type: 'Apartment' },
        { account: '4300262', label: 'Z3-58(6)', type: 'Apartment' },
        { account: '4300206', label: 'D 58-Building Common', type: 'Common' },
    ],
    'D-59': [
        { account: '4300263', label: 'Z3-59(1A)', type: 'Apartment' },
        { account: '4300264', label: 'Z3-59(1B)', type: 'Apartment' },
        { account: '4300265', label: 'Z3-59(2A)', type: 'Apartment' },
        { account: '4300266', label: 'Z3-59(2B)', type: 'Apartment' },
        { account: '4300073', label: 'Z3-59(3A)', type: 'Apartment' },
        { account: '4300267', label: 'Z3-59(3B)', type: 'Apartment' },
        { account: '4300268', label: 'Z3-59(4A)', type: 'Apartment' },
        { account: '4300066', label: 'Z3-59(4B)', type: 'Apartment' },
        { account: '4300269', label: 'Z3-59(5)', type: 'Apartment' },
        { account: '4300270', label: 'Z3-59(6)', type: 'Apartment' },
        { account: '4300207', label: 'D 59-Building Common', type: 'Common' },
    ],
    'D-60': [
        { account: '4300271', label: 'Z3-60(1A)', type: 'Apartment' },
        { account: '4300065', label: 'Z3-60(1B)', type: 'Apartment' },
        { account: '4300272', label: 'Z3-60(2A)', type: 'Apartment' },
        { account: '4300072', label: 'Z3-60(2B)', type: 'Apartment' },
        { account: '4300273', label: 'Z3-60(3A)', type: 'Apartment' },
        { account: '4300067', label: 'Z3-60(3B)', type: 'Apartment' },
        { account: '4300274', label: 'Z3-60(4A)', type: 'Apartment' },
        { account: '4300068', label: 'Z3-60(4B)', type: 'Apartment' },
        { account: '4300275', label: 'Z3-60(5)', type: 'Apartment' },
        { account: '4300276', label: 'Z3-60(6)', type: 'Apartment' },
        { account: '4300208', label: 'D 60-Building Common', type: 'Common' },
    ],
    'D-61': [
        { account: '4300277', label: 'Z3-61(1A)', type: 'Apartment' },
        { account: '4300278', label: 'Z3-61(1B)', type: 'Apartment' },
        { account: '4300279', label: 'Z3-61(2A)', type: 'Apartment' },
        { account: '4300280', label: 'Z3-61(2B)', type: 'Apartment' },
        { account: '4300281', label: 'Z3-61(3A)', type: 'Apartment' },
        { account: '4300282', label: 'Z3-61(3B)', type: 'Apartment' },
        { account: '4300283', label: 'Z3-61(4A)', type: 'Apartment' },
        { account: '4300284', label: 'Z3-61(4B)', type: 'Apartment' },
        { account: '4300285', label: 'Z3-61(5)', type: 'Apartment' },
        { account: '4300286', label: 'Z3-61(6)', type: 'Apartment' },
        { account: '4300209', label: 'D 61-Building Common', type: 'Common' },
    ],
    'D-62': [
        { account: '4300062', label: 'Z3-62(1)', type: 'Apartment' },
        { account: '4300119', label: 'Z3-62(2)', type: 'Apartment' },
        { account: '4300124', label: 'Z3-62(3)', type: 'Apartment' },
        { account: '4300129', label: 'Z3-62(4)', type: 'Apartment' },
        { account: '4300133', label: 'Z3-62(5)', type: 'Apartment' },
        { account: '4300054', label: 'Z3-62(6)', type: 'Apartment' },
        { account: '4300142', label: 'D 62-Building Common', type: 'Common' },
    ],
};

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
