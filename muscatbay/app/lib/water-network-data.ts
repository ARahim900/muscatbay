export interface NetworkNode {
    id: string;
    label: string;
    level: string;
    type: string;
    meterCount?: number;
    zone?: string;
    alert?: boolean;
    note?: string;
    children?: NetworkNode[];
}

// Complete Muscat Bay Water Network Hierarchy Data with Building → Apartment Structure
export const networkData: NetworkNode = {
    id: "C43659",
    label: "Main Bulk (NAMA)",
    level: "L1",
    type: "Main_BULK",
    meterCount: 349,
    children: [
        {
            id: "DC",
            label: "Direct Connections",
            level: "L2",
            type: "category",
            meterCount: 11,
            children: [
                { id: "4300334", label: "Hotel Main Building", level: "L2", type: "Retail", alert: true, note: "~50% of total consumption" },
                { id: "4300349", label: "Al Adrak Camp", level: "L2", type: "Retail" },
                { id: "4300348", label: "Al Adrak Company", level: "L2", type: "Retail" },
                { id: "4300340", label: "Irrigation Controller UP", level: "L2", type: "IRR_Services" },
                { id: "4300341", label: "Irrigation Controller DOWN", level: "L2", type: "IRR_Services" },
                { id: "4300323", label: "Irrigation Tank 01 (Inlet)", level: "L2", type: "IRR_Services" },
                { id: "4300294", label: "Irrigation Tank 04 (Z08)", level: "L2", type: "IRR_Services" },
                { id: "4300336", label: "Community Mgmt - Technical Zone, STP", level: "L2", type: "MB_Common" },
                { id: "4300338", label: "Phase 02 Main Entrance", level: "L2", type: "MB_Common" },
                { id: "4300299", label: "Building (ROP)", level: "L2", type: "MB_Common" },
                { id: "4300297", label: "Building (Security)", level: "L2", type: "MB_Common" },
            ]
        },
        {
            id: "4300346",
            label: "Zone FM",
            level: "L2",
            type: "Zone_Bulk",
            zone: "Zone_01_(FM)",
            meterCount: 17,
            children: [
                { id: "4300296", label: "Building FM", level: "L3", type: "MB_Common" },
                { id: "4300310", label: "Building (MEP)", level: "L3", type: "MB_Common" },
                { id: "4300309", label: "Room PUMP (FIRE)", level: "L3", type: "MB_Common" },
                { id: "4300300", label: "Building B1", level: "L3", type: "Retail" },
                { id: "4300301", label: "Building B2", level: "L3", type: "Retail" },
                { id: "4300302", label: "Building B3", level: "L3", type: "Retail" },
                { id: "4300303", label: "Building B4", level: "L3", type: "Retail" },
                { id: "4300304", label: "Building B5", level: "L3", type: "Retail" },
                { id: "4300305", label: "Building B6", level: "L3", type: "Retail" },
                { id: "4300306", label: "Building B7", level: "L3", type: "Retail" },
                { id: "4300307", label: "Building B8", level: "L3", type: "Retail" },
                { id: "4300324", label: "Building CIF/CB", level: "L3", type: "Retail" },
                { id: "4300339", label: "Building CIF/CB (Coffee)", level: "L3", type: "Retail" },
                { id: "4300325", label: "Building Nursery", level: "L3", type: "Retail" },
                { id: "4300298", label: "Building Taxi", level: "L3", type: "Retail" },
                { id: "4300337", label: "Cabinet FM (Contractors)", level: "L3", type: "Building" },
                { id: "4300308", label: "Irrigation Tank (Z01_FM)", level: "L3", type: "IRR_Services" },
            ]
        },
        {
            id: "4300343",
            label: "Zone 3A",
            level: "L2",
            type: "Zone_Bulk",
            zone: "Zone_03_(A)",
            alert: true,
            note: "High loss area - 58% variance",
            meterCount: 101,
            children: [
                {
                    id: "Z3A_VILLAS",
                    label: "Villas (21 units)",
                    level: "L3",
                    type: "category",
                    meterCount: 21,
                    children: [
                        { id: "4300002", label: "Z3-42", level: "L3", type: "Residential_Villa" },
                        { id: "4300005", label: "Z3-38", level: "L3", type: "Residential_Villa" },
                        { id: "4300038", label: "Z3-23", level: "L3", type: "Residential_Villa" },
                        { id: "4300044", label: "Z3-41", level: "L3", type: "Residential_Villa" },
                        { id: "4300049", label: "Z3-37", level: "L3", type: "Residential_Villa" },
                        { id: "4300050", label: "Z3-43", level: "L3", type: "Residential_Villa" },
                        { id: "4300052", label: "Z3-31", level: "L3", type: "Residential_Villa" },
                        { id: "4300075", label: "Z3-35", level: "L3", type: "Residential_Villa" },
                        { id: "4300079", label: "Z3-40", level: "L3", type: "Residential_Villa" },
                        { id: "4300081", label: "Z3-30", level: "L3", type: "Residential_Villa" },
                        { id: "4300082", label: "Z3-33", level: "L3", type: "Residential_Villa" },
                        { id: "4300084", label: "Z3-36", level: "L3", type: "Residential_Villa" },
                        { id: "4300085", label: "Z3-32", level: "L3", type: "Residential_Villa" },
                        { id: "4300086", label: "Z3-39", level: "L3", type: "Residential_Villa" },
                        { id: "4300087", label: "Z3-34", level: "L3", type: "Residential_Villa" },
                        { id: "4300089", label: "Z3-27", level: "L3", type: "Residential_Villa" },
                        { id: "4300091", label: "Z3-24", level: "L3", type: "Residential_Villa" },
                        { id: "4300093", label: "Z3-25", level: "L3", type: "Residential_Villa" },
                        { id: "4300095", label: "Z3-26", level: "L3", type: "Residential_Villa" },
                        { id: "4300097", label: "Z3-29", level: "L3", type: "Residential_Villa" },
                        { id: "4300101", label: "Z3-28", level: "L3", type: "Residential_Villa" },
                    ]
                },
                {
                    id: "Z3A_BLDGS",
                    label: "Buildings (10 units)",
                    level: "L3",
                    type: "category",
                    meterCount: 80,
                    children: [
                        {
                            id: "4300178", label: "D-44 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300030", label: "D-44 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300031", label: "D-44 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300032", label: "D-44 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300033", label: "D-44 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300034", label: "D-44 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300035", label: "D-44 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300144", label: "D-44 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300179", label: "D-45 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300013", label: "D-45 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300017", label: "D-45 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300019", label: "D-45 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300026", label: "D-45 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300110", label: "D-45 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300113", label: "D-45 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300135", label: "D-45 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300180", label: "D-46 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300003", label: "D-46 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300007", label: "D-46 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300011", label: "D-46 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300014", label: "D-46 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300015", label: "D-46 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300043", label: "D-46 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300138", label: "D-46 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300181", label: "D-47 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300012", label: "D-47 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300016", label: "D-47 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300018", label: "D-47 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300039", label: "D-47 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300051", label: "D-47 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300115", label: "D-47 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300143", label: "D-47 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300182", label: "D-48 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300040", label: "D-48 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300041", label: "D-48 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300048", label: "D-48 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300117", label: "D-48 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300123", label: "D-48 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300131", label: "D-48 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300141", label: "D-48 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300183", label: "D-49 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300004", label: "D-49 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300010", label: "D-49 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300053", label: "D-49 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300061", label: "D-49 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300107", label: "D-49 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300108", label: "D-49 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300140", label: "D-49 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300184", label: "D-50 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300021", label: "D-50 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300027", label: "D-50 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300028", label: "D-50 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300047", label: "D-50 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300109", label: "D-50 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300114", label: "D-50 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300136", label: "D-50 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300185", label: "D-51 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300111", label: "D-51 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300112", label: "D-51 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300121", label: "D-51 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300127", label: "D-51 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300128", label: "D-51 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300134", label: "D-51 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300137", label: "D-51 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300177", label: "D-74 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300022", label: "D-74 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300045", label: "D-74 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300046", label: "D-74 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300106", label: "D-74 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300118", label: "D-74 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300125", label: "D-74 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300139", label: "D-74 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300176", label: "D-75 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300006", label: "D-75 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300036", label: "D-75 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300037", label: "D-75 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300055", label: "D-75 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300063", label: "D-75 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300122", label: "D-75 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300145", label: "D-75 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                    ]
                }
            ]
        },
        {
            id: "4300344",
            label: "Zone 3B",
            level: "L2",
            type: "Zone_Bulk",
            zone: "Zone_03_(B)",
            meterCount: 147,
            children: [
                {
                    id: "Z3B_VILLAS",
                    label: "Villas (22 units)",
                    level: "L3",
                    type: "category",
                    meterCount: 22,
                    children: [
                        { id: "4300094", label: "Z3-1", level: "L3", type: "Residential_Villa" },
                        { id: "4300098", label: "Z3-2", level: "L3", type: "Residential_Villa" },
                        { id: "4300088", label: "Z3-3", level: "L3", type: "Residential_Villa" },
                        { id: "4300078", label: "Z3-4", level: "L3", type: "Residential_Villa" },
                        { id: "4300104", label: "Z3-5", level: "L3", type: "Residential_Villa" },
                        { id: "4300100", label: "Z3-6", level: "L3", type: "Residential_Villa" },
                        { id: "4300090", label: "Z3-7", level: "L3", type: "Residential_Villa" },
                        { id: "4300105", label: "Z3-8", level: "L3", type: "Residential_Villa" },
                        { id: "4300096", label: "Z3-9", level: "L3", type: "Residential_Villa" },
                        { id: "4300092", label: "Z3-10", level: "L3", type: "Residential_Villa" },
                        { id: "4300077", label: "Z3-11", level: "L3", type: "Residential_Villa" },
                        { id: "4300076", label: "Z3-12", level: "L3", type: "Residential_Villa" },
                        { id: "4300025", label: "Z3-13", level: "L3", type: "Residential_Villa" },
                        { id: "4300060", label: "Z3-14", level: "L3", type: "Residential_Villa" },
                        { id: "4300057", label: "Z3-15", level: "L3", type: "Residential_Villa" },
                        { id: "4300103", label: "Z3-16", level: "L3", type: "Residential_Villa" },
                        { id: "4300080", label: "Z3-17", level: "L3", type: "Residential_Villa" },
                        { id: "4300083", label: "Z3-18", level: "L3", type: "Residential_Villa" },
                        { id: "4300099", label: "Z3-19", level: "L3", type: "Residential_Villa" },
                        { id: "4300020", label: "Z3-20", level: "L3", type: "Residential_Villa" },
                        { id: "4300009", label: "Z3-21", level: "L3", type: "Residential_Villa" },
                        { id: "4300102", label: "Z3-22", level: "L3", type: "Residential_Villa" },
                    ]
                },
                {
                    id: "Z3B_BLDGS",
                    label: "Buildings (11 units)",
                    level: "L3",
                    type: "category",
                    meterCount: 124,
                    children: [
                        {
                            id: "4300186", label: "D-52 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300008", label: "D-52 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300029", label: "D-52 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300042", label: "D-52 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300056", label: "D-52 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300069", label: "D-52 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300116", label: "D-52 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300126", label: "D-52 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300311", label: "D-53 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300064", label: "D-53 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300074", label: "D-53 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300201", label: "D-53 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300210", label: "D-53 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300211", label: "D-53 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300212", label: "D-53 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300213", label: "D-53 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300214", label: "D-53 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300215", label: "D-53 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300216", label: "D-53 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300217", label: "D-53 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300312", label: "D-54 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300202", label: "D-54 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300218", label: "D-54 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300219", label: "D-54 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300220", label: "D-54 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300221", label: "D-54 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300222", label: "D-54 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300223", label: "D-54 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300224", label: "D-54 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300225", label: "D-54 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300226", label: "D-54 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300227", label: "D-54 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300313", label: "D-55 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300071", label: "D-55 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300203", label: "D-55 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300228", label: "D-55 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300229", label: "D-55 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300230", label: "D-55 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300231", label: "D-55 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300232", label: "D-55 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300233", label: "D-55 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300234", label: "D-55 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300235", label: "D-55 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300236", label: "D-55 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300314", label: "D-56 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300204", label: "D-56 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300237", label: "D-56 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300238", label: "D-56 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300239", label: "D-56 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300240", label: "D-56 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300241", label: "D-56 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300242", label: "D-56 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300243", label: "D-56 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300244", label: "D-56 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300245", label: "D-56 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300246", label: "D-56 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300315", label: "D-57 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300205", label: "D-57 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300247", label: "D-57 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300248", label: "D-57 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300249", label: "D-57 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300250", label: "D-57 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300251", label: "D-57 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300252", label: "D-57 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300253", label: "D-57 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300254", label: "D-57 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300255", label: "D-57 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300256", label: "D-57 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300316", label: "D-58 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300070", label: "D-58 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300120", label: "D-58 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300130", label: "D-58 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300132", label: "D-58 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300206", label: "D-58 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300257", label: "D-58 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300258", label: "D-58 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300259", label: "D-58 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300260", label: "D-58 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300261", label: "D-58 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300262", label: "D-58 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300317", label: "D-59 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300066", label: "D-59 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300073", label: "D-59 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300207", label: "D-59 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300263", label: "D-59 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300264", label: "D-59 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300265", label: "D-59 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300266", label: "D-59 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300267", label: "D-59 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300268", label: "D-59 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300269", label: "D-59 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300270", label: "D-59 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300318", label: "D-60 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300065", label: "D-60 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300067", label: "D-60 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300068", label: "D-60 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300072", label: "D-60 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300208", label: "D-60 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300271", label: "D-60 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300272", label: "D-60 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300273", label: "D-60 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300274", label: "D-60 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300275", label: "D-60 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300276", label: "D-60 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300319", label: "D-61 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300209", label: "D-61 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300277", label: "D-61 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300278", label: "D-61 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300279", label: "D-61 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300280", label: "D-61 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300281", label: "D-61 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300282", label: "D-61 Apt 7", level: "L4", type: "Apartment" },
                                { id: "4300283", label: "D-61 Apt 8", level: "L4", type: "Apartment" },
                                { id: "4300284", label: "D-61 Apt 9", level: "L4", type: "Apartment" },
                                { id: "4300285", label: "D-61 Apt 10", level: "L4", type: "Apartment" },
                                { id: "4300286", label: "D-61 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                        {
                            id: "4300187", label: "D-62 Building Bulk", level: "L3", type: "D_Building_Bulk",
                            children: [
                                { id: "4300054", label: "D-62 Apt 1", level: "L4", type: "Apartment" },
                                { id: "4300062", label: "D-62 Apt 2", level: "L4", type: "Apartment" },
                                { id: "4300119", label: "D-62 Apt 3", level: "L4", type: "Apartment" },
                                { id: "4300124", label: "D-62 Apt 4", level: "L4", type: "Apartment" },
                                { id: "4300129", label: "D-62 Apt 5", level: "L4", type: "Apartment" },
                                { id: "4300133", label: "D-62 Apt 6", level: "L4", type: "Apartment" },
                                { id: "4300142", label: "D-62 Common", level: "L4", type: "Common_Area" },
                            ]
                        },
                    ]
                },
                { id: "4300320", label: "Irrigation Tank 02 (Z03)", level: "L3", type: "IRR_Services" }
            ]
        },
        {
            id: "4300345", label: "Zone 5", level: "L2", type: "Zone_Bulk", zone: "Zone_05",
            alert: true, note: "Monitor for losses", meterCount: 34,
            children: [
                {
                    id: "Z5_VILLAS", label: "Villas (33 units)", level: "L3", type: "category", meterCount: 33,
                    children: Array.from({ length: 33 }, (_, i) => ({ id: `430017${i}`, label: `Z5-${i + 1}`, level: "L3", type: "Residential_Villa" }))
                },
                { id: "4300321", label: "Irrigation Tank 03 (Z05)", level: "L3", type: "IRR_Services" }
            ]
        },
        {
            id: "4300342", label: "Zone 8", level: "L2", type: "Zone_Bulk", zone: "Zone_08", meterCount: 22,
            children: Array.from({ length: 22 }, (_, i) => ({ id: `430019${i}`, label: `Z8-${i + 1}`, level: "L3", type: "Residential_Villa" }))
        },
        {
            id: "4300335", label: "Village Square", level: "L2", type: "Zone_Bulk", zone: "Zone_VS", meterCount: 7,
            children: [
                { id: "4300327", label: "Coffee 1", level: "L3", type: "Retail" },
                { id: "4300329", label: "Coffee 2", level: "L3", type: "Retail" },
                { id: "4300330", label: "Supermarket", level: "L3", type: "Retail" },
                { id: "4300331", label: "Pharmacy", level: "L3", type: "Retail" },
                { id: "4300332", label: "Laundry", level: "L3", type: "Retail" },
                { id: "4300333", label: "Shop 593A", level: "L3", type: "Retail" },
                { id: "4300326", label: "Irrigation Tank VS", level: "L3", type: "IRR_Services" },
            ]
        },
        {
            id: "4300295", label: "Sales Center", level: "L2", type: "Zone_Bulk", zone: "Zone_SC",
            alert: true, note: "Known problem area", meterCount: 1,
            children: [{ id: "4300328", label: "Sale Centre Caffe", level: "L3", type: "Retail" }]
        }
    ]
};
