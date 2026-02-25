
export interface DailyMeterNode {
    id: string; // Account #
    name: string; // Meter Name
    label: 'L1' | 'L2' | 'L3' | 'L4' | 'DC';
    zone: string;
    parent: string;
    type: string;
    children?: DailyMeterNode[];
}

export const DAILY_WATER_HIERARCHY: DailyMeterNode = {
    id: "C43659",
    name: "Main Bulk (NAMA)",
    label: "L1",
    zone: "Main Bulk",
    parent: "NAMA",
    type: "Main BULK",
    children: [
        // ==========================================
        // L2 - Zone Bulks
        // ==========================================
        {
            id: "4300343",
            name: "ZONE 3A (Bulk Zone 3A)",
            label: "L2",
            zone: "Zone_03_(A)",
            parent: "Main Bulk (NAMA)",
            type: "Zone Bulk",
            children: [
                // ... L3 meters will be populated dynamically or hardcoded if provided
            ]
        },
        {
            id: "4300344",
            name: "ZONE 3B (Bulk Zone 3B)",
            label: "L2",
            zone: "Zone_03_(B)",
            parent: "Main Bulk (NAMA)",
            type: "Zone Bulk",
            children: []
        },
        {
            id: "4300345",
            name: "ZONE 5 (Bulk Zone 5)",
            label: "L2",
            zone: "Zone_05",
            parent: "Main Bulk (NAMA)",
            type: "Zone Bulk",
            children: []
        },
        {
            id: "4300342",
            name: "ZONE 8 (Bulk Zone 8)",
            label: "L2",
            zone: "Zone_08",
            parent: "Main Bulk (NAMA)",
            type: "Zone Bulk",
            children: []
        },
        {
            id: "4300346",
            name: "ZONE FM (BULK ZONE FM)",
            label: "L2",
            zone: "Zone_01_(FM)",
            parent: "Main Bulk (NAMA)",
            type: "Zone Bulk",
            children: []
        },
        {
            id: "4300335",
            name: "Village Square (Zone Bulk)",
            label: "L2",
            zone: "Zone_VS",
            parent: "Main Bulk (NAMA)",
            type: "Zone Bulk",
            children: []
        },
        {
            id: "4300295",
            name: "Sales Center Common Building (Zone Bulk)",
            label: "L2",
            zone: "Zone_SC",
            parent: "Main Bulk (NAMA)",
            type: "Zone Bulk",
            children: []
        },

        // ==========================================
        // DC - Direct Connections
        // ==========================================
        { id: "4300334", name: "Hotel Main Building", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "Retail", children: [] },
        { id: "4300336", name: "Community Mgmt - Technical Zone, STP", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "MB_Common", children: [] },
        { id: "4300297", name: "Building (Security)", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "MB_Common", children: [] },
        { id: "4300299", name: "Building (ROP)", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "MB_Common", children: [] },
        { id: "4300338", name: "PHASE 02, MAIN ENTRANCE (Infrastructure)", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "MB_Common", children: [] },
        { id: "4300348", name: "Al Adrak Camp", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "Retail", children: [] },
        { id: "4300349", name: "Al Adrak Company (Accommodation) Camp Area", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "Retail", children: [] },
        { id: "4300323", name: "Irrigation Tank 01 (Inlet)", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "IRR_Servies", children: [] },
        { id: "4300294", name: "Irrigation Tank 04 - (Z08)", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "IRR_Servies", children: [] },
        { id: "4300340", name: "Irrigation- Controller UP", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "IRR_Servies", children: [] },
        { id: "4300341", name: "Irrigation- Controller DOWN", label: "DC", zone: "Direct Connection", parent: "Main Bulk (NAMA)", type: "IRR_Servies", children: [] }
    ]
};

// Helper to populate children
export const POPULATE_HIERARCHY_DATA = [
    // Zone 05 L3 (Children of 4300345)
    {
        parentId: "4300345", items: [
            { id: "4300001", name: "Z5-17", type: "Residential (Villa)" },
            { id: "4300058", name: "Z5-13", type: "Residential (Villa)" },
            { id: "4300059", name: "Z5-14", type: "Residential (Villa)" },
            { id: "4300146", name: "Z5-5", type: "Residential (Villa)" },
            { id: "4300147", name: "Z5-30", type: "Residential (Villa)" },
            { id: "4300148", name: "Z5-2", type: "Residential (Villa)" },
            { id: "4300149", name: "Z5-10", type: "Residential (Villa)" },
            { id: "4300150", name: "Z5-4", type: "Residential (Villa)" },
            { id: "4300151", name: "Z5-6", type: "Residential (Villa)" },
            { id: "4300152", name: "Z5 020", type: "Residential (Villa)" },
            { id: "4300153", name: "Z5-23", type: "Residential (Villa)" },
            { id: "4300154", name: "Z5-15", type: "Residential (Villa)" },
            { id: "4300155", name: "Z5-9", type: "Residential (Villa)" },
            { id: "4300156", name: "Z5-26", type: "Residential (Villa)" },
            { id: "4300157", name: "Z5-25", type: "Residential (Villa)" },
            { id: "4300158", name: "Z5-31", type: "Residential (Villa)" },
            { id: "4300159", name: "Z5-33", type: "Residential (Villa)" },
            { id: "4300160", name: "Z5-29", type: "Residential (Villa)" },
            { id: "4300161", name: "Z5-28", type: "Residential (Villa)" },
            { id: "4300162", name: "Z5-32", type: "Residential (Villa)" },
            { id: "4300163", name: "Z5-22", type: "Residential (Villa)" },
            { id: "4300164", name: "Z5-7", type: "Residential (Villa)" },
            { id: "4300165", name: "Z5-27", type: "Residential (Villa)" },
            { id: "4300166", name: "Z5-12", type: "Residential (Villa)" },
            { id: "4300167", name: "Z5 024", type: "Residential (Villa)" },
            { id: "4300168", name: "Z5 016", type: "Residential (Villa)" },
            { id: "4300169", name: "Z5-21", type: "Residential (Villa)" },
            { id: "4300170", name: "Z5-3", type: "Residential (Villa)" },
            { id: "4300171", name: "Z5 019", type: "Residential (Villa)" },
            { id: "4300172", name: "Z5-1", type: "Residential (Villa)" },
            { id: "4300173", name: "Z5-11", type: "Residential (Villa)" },
            { id: "4300174", name: "Z5-18", type: "Residential (Villa)" },
            { id: "4300175", name: "Z5-8", type: "Residential (Villa)" },
            { id: "4300321", name: "Irrigation Tank 03 (Z05)", type: "IRR_Servies" } // L3 Irrigation
        ]
    },

    // Zone 08 L3 (Children of 4300342)
    {
        parentId: "4300342", items: [
            { id: "4300188", name: "Z8-1", type: "Residential (Villa)" },
            { id: "4300189", name: "Z8-2", type: "Residential (Villa)" },
            { id: "4300190", name: "Z8-3", type: "Residential (Villa)" },
            { id: "4300191", name: "Z8-4", type: "Residential (Villa)" },
            { id: "4300287", name: "Z8-5", type: "Residential (Villa)" },
            { id: "4300192", name: "Z8-6", type: "Residential (Villa)" },
            { id: "4300193", name: "Z8-7", type: "Residential (Villa)" },
            { id: "4300194", name: "Z8-8", type: "Residential (Villa)" },
            { id: "4300288", name: "Z8-9", type: "Residential (Villa)" },
            { id: "4300195", name: "Z8-10", type: "Residential (Villa)" },
            { id: "4300023", name: "Z8-11", type: "Residential (Villa)" },
            { id: "4300196", name: "Z8-12", type: "Residential (Villa)" },
            { id: "4300024", name: "Z8-13", type: "Residential (Villa)" },
            { id: "4300197", name: "Z8-14", type: "Residential (Villa)" },
            { id: "4300198", name: "Z8-15", type: "Residential (Villa)" },
            { id: "4300199", name: "Z8-16", type: "Residential (Villa)" },
            { id: "4300200", name: "Z8-17", type: "Residential (Villa)" },
            { id: "4300289", name: "Z8-18", type: "Residential (Villa)" },
            { id: "4300290", name: "Z8-19", type: "Residential (Villa)" },
            { id: "4300291", name: "Z8-20", type: "Residential (Villa)" },
            { id: "4300292", name: "Z8-21", type: "Residential (Villa)" },
            { id: "4300293", name: "Z8-22", type: "Residential (Villa)" }
            // Note: Irrigation Tank 04 (4300294) is explicitly DC in user request
        ]
    },

    // Zone 3A L3 (Children of 4300343)
    {
        parentId: "4300343", items: [
            // Villas
            { id: "4300002", name: "Z3-42", type: "Residential (Villa)" },
            { id: "4300005", name: "Z3-38", type: "Residential (Villa)" },
            { id: "4300038", name: "Z3-23", type: "Residential (Villa)" },
            { id: "4300044", name: "Z3-41", type: "Residential (Villa)" },
            { id: "4300049", name: "Z3-37", type: "Residential (Villa)" },
            { id: "4300050", name: "Z3-43", type: "Residential (Villa)" },
            { id: "4300052", name: "Z3-31", type: "Residential (Villa)" },
            { id: "4300075", name: "Z3-35", type: "Residential (Villa)" },
            { id: "4300079", name: "Z3-40", type: "Residential (Villa)" },
            { id: "4300081", name: "Z3-30", type: "Residential (Villa)" },
            { id: "4300082", name: "Z3-33", type: "Residential (Villa)" },
            { id: "4300084", name: "Z3-36", type: "Residential (Villa)" },
            { id: "4300085", name: "Z3-32", type: "Residential (Villa)" },
            { id: "4300086", name: "Z3-39", type: "Residential (Villa)" },
            { id: "4300087", name: "Z3-34", type: "Residential (Villa)" },
            { id: "4300089", name: "Z3-27", type: "Residential (Villa)" },
            { id: "4300091", name: "Z3-24", type: "Residential (Villa)" },
            { id: "4300093", name: "Z3-25", type: "Residential (Villa)" },
            { id: "4300095", name: "Z3-26", type: "Residential (Villa)" },
            { id: "4300097", name: "Z3-29", type: "Residential (Villa)" },
            { id: "4300101", name: "Z3-28", type: "Residential (Villa)" },
            // Building Bulks
            { id: "4300178", name: "D-44 Bulk", type: "D_Building_Bulk" },
            { id: "4300179", name: "D-45 Bulk", type: "D_Building_Bulk" },
            { id: "4300180", name: "D-46 Bulk", type: "D_Building_Bulk" },
            { id: "4300181", name: "D-47 Bulk", type: "D_Building_Bulk" },
            { id: "4300182", name: "D-48 Bulk", type: "D_Building_Bulk" },
            { id: "4300183", name: "D-49 Bulk", type: "D_Building_Bulk" },
            { id: "4300184", name: "D-50 Bulk", type: "D_Building_Bulk" },
            { id: "4300185", name: "D-51 Bulk", type: "D_Building_Bulk" },
            { id: "4300177", name: "D-74 Bulk", type: "D_Building_Bulk" },
            { id: "4300176", name: "D-75 Bulk", type: "D_Building_Bulk" },
        ]
    },

    // Zone 3B L3 (Children of 4300344)
    {
        parentId: "4300344", items: [
            // Villas
            { id: "4300009", name: "Z3-21", type: "Residential (Villa)" },
            { id: "4300020", name: "Z3-20", type: "Residential (Villa)" },
            { id: "4300025", name: "Z3-13", type: "Residential (Villa)" },
            { id: "4300057", name: "Z3-15", type: "Residential (Villa)" },
            { id: "4300060", name: "Z3-14", type: "Residential (Villa)" },
            { id: "4300076", name: "Z3-12", type: "Residential (Villa)" },
            { id: "4300077", name: "Z3-11", type: "Residential (Villa)" },
            { id: "4300078", name: "Z3-4", type: "Residential (Villa)" },
            { id: "4300080", name: "Z3-17", type: "Residential (Villa)" },
            { id: "4300083", name: "Z3-18", type: "Residential (Villa)" },
            { id: "4300088", name: "Z3-3", type: "Residential (Villa)" },
            { id: "4300090", name: "Z3-7", type: "Residential (Villa)" },
            { id: "4300092", name: "Z3-10", type: "Residential (Villa)" },
            { id: "4300094", name: "Z3-1", type: "Residential (Villa)" },
            { id: "4300096", name: "Z3-9", type: "Residential (Villa)" },
            { id: "4300098", name: "Z3-2", type: "Residential (Villa)" },
            { id: "4300099", name: "Z3-19", type: "Residential (Villa)" },
            { id: "4300100", name: "Z3-6", type: "Residential (Villa)" },
            { id: "4300102", name: "Z3-22", type: "Residential (Villa)" },
            { id: "4300103", name: "Z3-16", type: "Residential (Villa)" },
            { id: "4300104", name: "Z3-5", type: "Residential (Villa)" },
            { id: "4300105", name: "Z3-8", type: "Residential (Villa)" },
            // Building Bulks
            { id: "4300186", name: "D-52 Bulk", type: "D_Building_Bulk" },
            { id: "4300311", name: "D-53 Bulk", type: "D_Building_Bulk" },
            { id: "4300312", name: "D-54 Bulk", type: "D_Building_Bulk" },
            { id: "4300313", name: "D-55 Bulk", type: "D_Building_Bulk" },
            { id: "4300314", name: "D-56 Bulk", type: "D_Building_Bulk" },
            { id: "4300315", name: "D-57 Bulk", type: "D_Building_Bulk" },
            { id: "4300316", name: "D-58 Bulk", type: "D_Building_Bulk" },
            { id: "4300317", name: "D-59 Bulk", type: "D_Building_Bulk" },
            { id: "4300318", name: "D-60 Bulk", type: "D_Building_Bulk" },
            { id: "4300319", name: "D-61 Bulk", type: "D_Building_Bulk" },
            { id: "4300187", name: "D-62 Bulk", type: "D_Building_Bulk" },
            // Irrigation
            { id: "4300320", name: "Irrigation Tank 02 (Z03)", type: "IRR_Servies" }
        ]
    },

    // Zone FM L3 (Children of 4300346)
    {
        parentId: "4300346", items: [
            { id: "4300296", name: "Building FM", type: "MB_Common" },
            { id: "4300298", name: "Building Taxi", type: "Retail" },
            { id: "4300300", name: "Building B1", type: "Retail" },
            { id: "4300301", name: "Building B2", type: "Retail" },
            { id: "4300302", name: "Building B3", type: "Retail" },
            { id: "4300303", name: "Building B4", type: "Retail" },
            { id: "4300304", name: "Building B5", type: "Retail" },
            { id: "4300305", name: "Building B6", type: "Retail" },
            { id: "4300306", name: "Building B7", type: "Retail" },
            { id: "4300307", name: "Building B8", type: "Retail" },
            { id: "4300308", name: "Irrigation Tank (Z01_FM)", type: "IRR_Servies" },
            { id: "4300309", name: "Room PUMP (FIRE)", type: "MB_Common" },
            { id: "4300310", name: "Building (MEP)", type: "MB_Common" },
            { id: "4300324", name: "Building CIF/CB", type: "Retail" },
            { id: "4300325", name: "Nursery Building", type: "Retail" },
            { id: "4300337", name: "Cabinet FM (Contractors Office)", type: "Building" },
            { id: "4300339", name: "Building CIF/CB (Coffee Sh)", type: "Retail" },
        ]
    },

    // Village Square L3 (Children of 4300335)
    {
        parentId: "4300335", items: [
            { id: "4300326", name: "Irrigation Tank - VS PO Water", type: "IRR_Servies" },
            { id: "4300327", name: "Coffee 1", type: "Retail" },
            { id: "4300329", name: "Coffee 2", type: "Retail" },
            { id: "4300330", name: "Supermarket", type: "Retail" },
            { id: "4300331", name: "Pharmacy", type: "Retail" },
            { id: "4300332", name: "Laundry Services", type: "Retail" },
            { id: "4300333", name: "Shop No.593 A", type: "Retail" },
            // VS TSE Tank 4300347 excluded as per request (N/A)
        ]
    },

    // Sales Center L3 (Children of 4300295)
    {
        parentId: "4300295", items: [
            { id: "4300328", name: "Sale Centre Caffe & Bar", type: "Retail" }
        ]
    },
];

// L4 Children mapping (Apartments/Common for Building Bulks)
export const L4_CHILDREN_MAP = {
    // D-44 Bulk 4300178
    "4300178": [
        { id: "4300030", name: "D-44 Apt 1", type: "Residential (Apart)" },
        { id: "4300031", name: "D-44 Apt 2", type: "Residential (Apart)" },
        { id: "4300032", name: "D-44 Apt 3", type: "Residential (Apart)" },
        { id: "4300033", name: "D-44 Apt 4", type: "Residential (Apart)" },
        { id: "4300034", name: "D-44 Apt 5", type: "Residential (Apart)" },
        { id: "4300035", name: "D-44 Apt 6", type: "Residential (Apart)" },
        { id: "4300144", name: "D-44 Common", type: "D_Building_Common" },
    ],
    // D-45 Bulk 4300179
    "4300179": [
        { id: "4300013", name: "D-45 Apt 1", type: "Residential (Apart)" },
        { id: "4300017", name: "D-45 Apt 2", type: "Residential (Apart)" },
        { id: "4300019", name: "D-45 Apt 3", type: "Residential (Apart)" },
        { id: "4300026", name: "D-45 Apt 4", type: "Residential (Apart)" },
        { id: "4300110", name: "D-45 Apt 5", type: "Residential (Apart)" },
        { id: "4300113", name: "D-45 Apt 6", type: "Residential (Apart)" },
        { id: "4300135", name: "D-45 Common", type: "D_Building_Common" },
    ],
    // D-46 Bulk 4300180
    "4300180": [
        { id: "4300003", name: "D-46 Apt 1", type: "Residential (Apart)" },
        { id: "4300007", name: "D-46 Apt 2", type: "Residential (Apart)" },
        { id: "4300011", name: "D-46 Apt 3", type: "Residential (Apart)" },
        { id: "4300014", name: "D-46 Apt 4", type: "Residential (Apart)" },
        { id: "4300015", name: "D-46 Apt 5", type: "Residential (Apart)" },
        { id: "4300043", name: "D-46 Apt 6", type: "Residential (Apart)" },
        { id: "4300138", name: "D-46 Common", type: "D_Building_Common" },
    ],
    // D-47 Bulk 4300181
    "4300181": [
        { id: "4300012", name: "D-47 Apt 1", type: "Residential (Apart)" },
        { id: "4300016", name: "D-47 Apt 2", type: "Residential (Apart)" },
        { id: "4300018", name: "D-47 Apt 3", type: "Residential (Apart)" },
        { id: "4300039", name: "D-47 Apt 4", type: "Residential (Apart)" },
        { id: "4300051", name: "D-47 Apt 5", type: "Residential (Apart)" },
        { id: "4300115", name: "D-47 Apt 6", type: "Residential (Apart)" },
        { id: "4300143", name: "D-47 Common", type: "D_Building_Common" },
    ],
    // D-48 Bulk 4300182
    "4300182": [
        { id: "4300040", name: "D-48 Apt 1", type: "Residential (Apart)" },
        { id: "4300041", name: "D-48 Apt 2", type: "Residential (Apart)" },
        { id: "4300048", name: "D-48 Apt 3", type: "Residential (Apart)" },
        { id: "4300117", name: "D-48 Apt 4", type: "Residential (Apart)" },
        { id: "4300123", name: "D-48 Apt 5", type: "Residential (Apart)" },
        { id: "4300131", name: "D-48 Apt 6", type: "Residential (Apart)" },
        { id: "4300141", name: "D-48 Common", type: "D_Building_Common" },
    ],
    // D-49 Bulk 4300183
    "4300183": [
        { id: "4300004", name: "D-49 Apt 1", type: "Residential (Apart)" },
        { id: "4300010", name: "D-49 Apt 2", type: "Residential (Apart)" },
        { id: "4300053", name: "D-49 Apt 3", type: "Residential (Apart)" },
        { id: "4300061", name: "D-49 Apt 4", type: "Residential (Apart)" },
        { id: "4300107", name: "D-49 Apt 5", type: "Residential (Apart)" },
        { id: "4300108", name: "D-49 Apt 6", type: "Residential (Apart)" },
        { id: "4300140", name: "D-49 Common", type: "D_Building_Common" },
    ],
    // D-50 Bulk 4300184
    "4300184": [
        { id: "4300021", name: "D-50 Apt 1", type: "Residential (Apart)" },
        { id: "4300027", name: "D-50 Apt 2", type: "Residential (Apart)" },
        { id: "4300028", name: "D-50 Apt 3", type: "Residential (Apart)" },
        { id: "4300047", name: "D-50 Apt 4", type: "Residential (Apart)" },
        { id: "4300109", name: "D-50 Apt 5", type: "Residential (Apart)" },
        { id: "4300114", name: "D-50 Apt 6", type: "Residential (Apart)" },
        { id: "4300136", name: "D-50 Common", type: "D_Building_Common" },
    ],
    // D-51 Bulk 4300185
    "4300185": [
        { id: "4300111", name: "D-51 Apt 1", type: "Residential (Apart)" },
        { id: "4300112", name: "D-51 Apt 2", type: "Residential (Apart)" },
        { id: "4300121", name: "D-51 Apt 3", type: "Residential (Apart)" },
        { id: "4300127", name: "D-51 Apt 4", type: "Residential (Apart)" },
        { id: "4300128", name: "D-51 Apt 5", type: "Residential (Apart)" },
        { id: "4300134", name: "D-51 Apt 6", type: "Residential (Apart)" },
        { id: "4300137", name: "D-51 Common", type: "D_Building_Common" },
    ],
    // D-52 Bulk 4300186
    "4300186": [
        { id: "4300116", name: "Z3-52(1A)", type: "Residential (Apart)" },
        { id: "4300069", name: "Z3-52(2A)", type: "Residential (Apart)" },
        { id: "4300042", name: "Z3-52(3A)", type: "Residential (Apart)" },
        { id: "4300029", name: "Z3-52(4A)", type: "Residential (Apart)" },
        { id: "4300056", name: "Z3-52(5)", type: "Residential (Apart)" },
        { id: "4300008", name: "Z3-52(6)", type: "Residential (Apart)" },
        { id: "4300126", name: "D 52-Building Common Meter", type: "D_Building_Common" },
    ],
    // D-53 Bulk 4300311
    "4300311": [
        { id: "4300064", name: "D-53 Apt 1", type: "Residential (Apart)" },
        { id: "4300074", name: "D-53 Apt 2", type: "Residential (Apart)" },
        { id: "4300201", name: "D-53 Apt 3", type: "Residential (Apart)" },
        { id: "4300210", name: "D-53 Apt 4", type: "Residential (Apart)" },
        { id: "4300211", name: "D-53 Apt 5", type: "Residential (Apart)" },
        { id: "4300212", name: "D-53 Apt 6", type: "Residential (Apart)" },
        { id: "4300213", name: "D-53 Apt 7", type: "Residential (Apart)" },
        { id: "4300214", name: "D-53 Apt 8", type: "Residential (Apart)" },
        { id: "4300215", name: "D-53 Apt 9", type: "Residential (Apart)" },
        { id: "4300216", name: "D-53 Apt 10", type: "Residential (Apart)" },
        { id: "4300217", name: "D-53 Common", type: "D_Building_Common" },
    ],
    // D-54 Bulk 4300312
    "4300312": [
        { id: "4300202", name: "D-54 Apt 1", type: "Residential (Apart)" },
        { id: "4300218", name: "D-54 Apt 2", type: "Residential (Apart)" },
        { id: "4300219", name: "D-54 Apt 3", type: "Residential (Apart)" },
        { id: "4300220", name: "D-54 Apt 4", type: "Residential (Apart)" },
        { id: "4300221", name: "D-54 Apt 5", type: "Residential (Apart)" },
        { id: "4300222", name: "D-54 Apt 6", type: "Residential (Apart)" },
        { id: "4300223", name: "D-54 Apt 7", type: "Residential (Apart)" },
        { id: "4300224", name: "D-54 Apt 8", type: "Residential (Apart)" },
        { id: "4300225", name: "D-54 Apt 9", type: "Residential (Apart)" },
        { id: "4300226", name: "D-54 Apt 10", type: "Residential (Apart)" },
        { id: "4300227", name: "D-54 Common", type: "D_Building_Common" },
    ],
    // D-55 Bulk 4300313
    "4300313": [
        { id: "4300071", name: "D-55 Apt 1", type: "Residential (Apart)" },
        { id: "4300203", name: "D-55 Apt 2", type: "Residential (Apart)" },
        { id: "4300228", name: "D-55 Apt 3", type: "Residential (Apart)" },
        { id: "4300229", name: "D-55 Apt 4", type: "Residential (Apart)" },
        { id: "4300230", name: "D-55 Apt 5", type: "Residential (Apart)" },
        { id: "4300231", name: "D-55 Apt 6", type: "Residential (Apart)" },
        { id: "4300232", name: "D-55 Apt 7", type: "Residential (Apart)" },
        { id: "4300233", name: "D-55 Apt 8", type: "Residential (Apart)" },
        { id: "4300234", name: "D-55 Apt 9", type: "Residential (Apart)" },
        { id: "4300235", name: "D-55 Apt 10", type: "Residential (Apart)" },
        { id: "4300236", name: "D-55 Common", type: "D_Building_Common" },
    ],
    // D-56 Bulk 4300314
    "4300314": [
        { id: "4300204", name: "D-56 Apt 1", type: "Residential (Apart)" },
        { id: "4300237", name: "D-56 Apt 2", type: "Residential (Apart)" },
        { id: "4300238", name: "D-56 Apt 3", type: "Residential (Apart)" },
        { id: "4300239", name: "D-56 Apt 4", type: "Residential (Apart)" },
        { id: "4300240", name: "D-56 Apt 5", type: "Residential (Apart)" },
        { id: "4300241", name: "D-56 Apt 6", type: "Residential (Apart)" },
        { id: "4300242", name: "D-56 Apt 7", type: "Residential (Apart)" },
        { id: "4300243", name: "D-56 Apt 8", type: "Residential (Apart)" },
        { id: "4300244", name: "D-56 Apt 9", type: "Residential (Apart)" },
        { id: "4300245", name: "D-56 Apt 10", type: "Residential (Apart)" },
        { id: "4300246", name: "D-56 Common", type: "D_Building_Common" },
    ],
    // D-57 Bulk 4300315
    "4300315": [
        { id: "4300205", name: "D-57 Apt 1", type: "Residential (Apart)" },
        { id: "4300247", name: "D-57 Apt 2", type: "Residential (Apart)" },
        { id: "4300248", name: "D-57 Apt 3", type: "Residential (Apart)" },
        { id: "4300249", name: "D-57 Apt 4", type: "Residential (Apart)" },
        { id: "4300250", name: "D-57 Apt 5", type: "Residential (Apart)" },
        { id: "4300251", name: "D-57 Apt 6", type: "Residential (Apart)" },
        { id: "4300252", name: "D-57 Apt 7", type: "Residential (Apart)" },
        { id: "4300253", name: "D-57 Apt 8", type: "Residential (Apart)" },
        { id: "4300254", name: "D-57 Apt 9", type: "Residential (Apart)" },
        { id: "4300255", name: "D-57 Apt 10", type: "Residential (Apart)" },
        { id: "4300256", name: "D-57 Common", type: "D_Building_Common" },
    ],
    // D-58 Bulk 4300316
    "4300316": [
        { id: "4300070", name: "D-58 Apt 1", type: "Residential (Apart)" },
        { id: "4300120", name: "D-58 Apt 2", type: "Residential (Apart)" },
        { id: "4300130", name: "D-58 Apt 3", type: "Residential (Apart)" },
        { id: "4300132", name: "D-58 Apt 4", type: "Residential (Apart)" },
        { id: "4300206", name: "D-58 Apt 5", type: "Residential (Apart)" },
        { id: "4300257", name: "D-58 Apt 6", type: "Residential (Apart)" },
        { id: "4300258", name: "D-58 Apt 7", type: "Residential (Apart)" },
        { id: "4300259", name: "D-58 Apt 8", type: "Residential (Apart)" },
        { id: "4300260", name: "D-58 Apt 9", type: "Residential (Apart)" },
        { id: "4300261", name: "D-58 Apt 10", type: "Residential (Apart)" },
        { id: "4300262", name: "D-58 Common", type: "D_Building_Common" },
    ],
    // D-59 Bulk 4300317
    "4300317": [
        { id: "4300066", name: "D-59 Apt 1", type: "Residential (Apart)" },
        { id: "4300073", name: "D-59 Apt 2", type: "Residential (Apart)" },
        { id: "4300207", name: "D-59 Apt 3", type: "Residential (Apart)" },
        { id: "4300263", name: "D-59 Apt 4", type: "Residential (Apart)" },
        { id: "4300264", name: "D-59 Apt 5", type: "Residential (Apart)" },
        { id: "4300265", name: "D-59 Apt 6", type: "Residential (Apart)" },
        { id: "4300266", name: "D-59 Apt 7", type: "Residential (Apart)" },
        { id: "4300267", name: "D-59 Apt 8", type: "Residential (Apart)" },
        { id: "4300268", name: "D-59 Apt 9", type: "Residential (Apart)" },
        { id: "4300269", name: "D-59 Apt 10", type: "Residential (Apart)" },
        { id: "4300270", name: "D-59 Common", type: "D_Building_Common" },
    ],
    // D-60 Bulk 4300318
    "4300318": [
        { id: "4300065", name: "D-60 Apt 1", type: "Residential (Apart)" },
        { id: "4300067", name: "D-60 Apt 2", type: "Residential (Apart)" },
        { id: "4300068", name: "D-60 Apt 3", type: "Residential (Apart)" },
        { id: "4300072", name: "D-60 Apt 4", type: "Residential (Apart)" },
        { id: "4300208", name: "D-60 Apt 5", type: "Residential (Apart)" },
        { id: "4300271", name: "D-60 Apt 6", type: "Residential (Apart)" },
        { id: "4300272", name: "D-60 Apt 7", type: "Residential (Apart)" },
        { id: "4300273", name: "D-60 Apt 8", type: "Residential (Apart)" },
        { id: "4300274", name: "D-60 Apt 9", type: "Residential (Apart)" },
        { id: "4300275", name: "D-60 Apt 10", type: "Residential (Apart)" },
        { id: "4300276", name: "D-60 Common", type: "D_Building_Common" },
    ],
    // D-61 Bulk 4300319
    "4300319": [
        { id: "4300209", name: "D-61 Apt 1", type: "Residential (Apart)" },
        { id: "4300277", name: "D-61 Apt 2", type: "Residential (Apart)" },
        { id: "4300278", name: "D-61 Apt 3", type: "Residential (Apart)" },
        { id: "4300279", name: "D-61 Apt 4", type: "Residential (Apart)" },
        { id: "4300280", name: "D-61 Apt 5", type: "Residential (Apart)" },
        { id: "4300281", name: "D-61 Apt 6", type: "Residential (Apart)" },
        { id: "4300282", name: "D-61 Apt 7", type: "Residential (Apart)" },
        { id: "4300283", name: "D-61 Apt 8", type: "Residential (Apart)" },
        { id: "4300284", name: "D-61 Apt 9", type: "Residential (Apart)" },
        { id: "4300285", name: "D-61 Apt 10", type: "Residential (Apart)" },
        { id: "4300286", name: "D-61 Common", type: "D_Building_Common" },
    ],
    // D-62 Bulk 4300187
    "4300187": [
        { id: "4300054", name: "D-62 Apt 1", type: "Residential (Apart)" },
        { id: "4300062", name: "D-62 Apt 2", type: "Residential (Apart)" },
        { id: "4300119", name: "D-62 Apt 3", type: "Residential (Apart)" },
        { id: "4300124", name: "D-62 Apt 4", type: "Residential (Apart)" },
        { id: "4300129", name: "D-62 Apt 5", type: "Residential (Apart)" },
        { id: "4300133", name: "D-62 Apt 6", type: "Residential (Apart)" },
        { id: "4300142", name: "D-62 Common", type: "D_Building_Common" },
    ],
    // D-74 Bulk 4300177
    "4300177": [
        { id: "4300022", name: "D-74 Apt 1", type: "Residential (Apart)" },
        { id: "4300045", name: "D-74 Apt 2", type: "Residential (Apart)" },
        { id: "4300046", name: "D-74 Apt 3", type: "Residential (Apart)" },
        { id: "4300106", name: "D-74 Apt 4", type: "Residential (Apart)" },
        { id: "4300118", name: "D-74 Apt 5", type: "Residential (Apart)" },
        { id: "4300125", name: "D-74 Apt 6", type: "Residential (Apart)" },
        { id: "4300139", name: "D-74 Common", type: "D_Building_Common" },
    ],
    // D-75 Bulk 4300176
    "4300176": [
        { id: "4300006", name: "D-75 Apt 1", type: "Residential (Apart)" },
        { id: "4300036", name: "D-75 Apt 2", type: "Residential (Apart)" },
        { id: "4300037", name: "D-75 Apt 3", type: "Residential (Apart)" },
        { id: "4300055", name: "D-75 Apt 4", type: "Residential (Apart)" },
        { id: "4300063", name: "D-75 Apt 5", type: "Residential (Apart)" },
        { id: "4300122", name: "D-75 Apt 6", type: "Residential (Apart)" },
        { id: "4300145", name: "D-75 Common", type: "D_Building_Common" },
    ],
};

export function buildDailyHierarchy(): DailyMeterNode {
    const root = JSON.parse(JSON.stringify(DAILY_WATER_HIERARCHY)); // Deep copy using JSON

    // 1. Populate L3 children into L2 zones
    if (root.children) {
        root.children.forEach((l2Node: any) => {
            const l3Data = POPULATE_HIERARCHY_DATA.find(d => d.parentId === l2Node.id);
            if (l3Data) {
                l2Node.children = l3Data.items.map(item => ({
                    ...item,
                    label: "L3",
                    zone: l2Node.zone, // Inherit zone? User listed them as L3 children
                    parent: l2Node.name,
                    children: []
                }));
            }
        });
    }

    // 2. Populate L4 children into L3 Building Bulks
    if (root.children) {
        root.children.forEach((l2Node: any) => {
            if (l2Node.children) {
                l2Node.children.forEach((l3Node: any) => {
                    const l4Data = L4_CHILDREN_MAP[l3Node.id as keyof typeof L4_CHILDREN_MAP];
                    if (l4Data) {
                        l3Node.children = l4Data.map(item => ({
                            ...item,
                            label: "L4",
                            zone: l3Node.zone,
                            parent: l3Node.name,
                            children: []
                        }));
                    }
                });
            }
        });
    }

    return root;
}
