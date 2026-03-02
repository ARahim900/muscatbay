import { createClient } from '@supabase/supabase-js';

const url = 'https://utnlgeuqajmwibqmdmgt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bmxnZXVxYWptd2licW1kbWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODUzMDAsImV4cCI6MjA4MTM2MTMwMH0.W7SuJF5Ka0IhkCz4RwfaGuEboVrmR2tK9FqTxBb7kxM';
const supabase = createClient(url, key);

const METERS: [string, string, string][] = [
    ['Actuator DB 01 (Z8)', 'DB', 'R53196'],
    ['Actuator DB 02', 'DB', 'R51900'],
    ['Actuator DB 03', 'DB', 'R51904'],
    ['Actuator DB 04', 'DB', 'R51901'],
    ['Actuator DB 05', 'DB', 'R51907'],
    ['Actuator DB 06', 'DB', 'R51909'],
    ['Bank muscat', 'Retail', ''],
    ['Beachwell', 'Beach well', 'R51903'],
    ['Central Park', 'Common Building', 'R54672'],
    ['CIF kitchen', 'Retail', ''],
    ['D Building 44', 'D_Building', 'R53705'],
    ['D Building 45', 'D_Building', 'R53665'],
    ['D Building 46', 'D_Building', 'R53700'],
    ['D Building 47', 'D_Building', 'R53690'],
    ['D Building 48', 'D_Building', 'R53666'],
    ['D Building 49', 'D_Building', 'R53715'],
    ['D Building 50', 'D_Building', 'R53672'],
    ['D Building 51', 'D_Building', 'R53657'],
    ['D Building 52', 'D_Building', 'R53699'],
    ['D Building 53', 'D_Building', 'R54782'],
    ['D Building 54', 'D_Building', 'R54793'],
    ['D Building 55', 'D_Building', 'R54804'],
    ['D Building 56', 'D_Building', 'R54815'],
    ['D Building 57', 'D_Building', 'R54826'],
    ['D Building 58', 'D_Building', 'R54836'],
    ['D Building 59', 'D_Building', 'R54847'],
    ['D Building 60', 'D_Building', 'R54858'],
    ['D Building 61', 'D_Building', 'R54869'],
    ['D Building 62', 'D_Building', 'R53717'],
    ['D Building 74', 'D_Building', 'R53675'],
    ['D Building 75', 'D_Building', 'R53668'],
    ['Guard House', 'DB', 'R53651'],
    ['Helipad', 'DB', 'R52334'],
    ['Irrigation Tank 01', 'IRR', 'R52324 (R52326)'],
    ['Irrigation Tank 02', 'IRR', 'R52331'],
    ['Irrigation Tank 03', 'IRR', 'R52323'],
    ['Irrigation Tank 04', 'IRR', 'R53195'],
    ['Lifting Station 02', 'LS', 'R52328'],
    ['Lifting Station 03', 'LS', 'R52333'],
    ['Lifting Station 04', 'LS', 'R52324'],
    ['Lifting Station 05', 'LS', 'R52332'],
    ['OUA Store (BTU Meter)', 'Retail', ''],
    ['Pumping Station 01', 'PS', 'R52330'],
    ['Pumping Station 03', 'PS', 'R52329'],
    ['Pumping Station 04', 'PS', 'R52327'],
    ['Pumping Station 05', 'PS', 'R52325'],
    ['ROP Building', 'Common Building', 'R53648'],
    ['Security Building', 'Common Building', 'R53649'],
    ['Street Light FP 01 (Z8)', 'Street Light', 'R53197'],
    ['Street Light FP 02', 'Street Light', 'R51906'],
    ['Street Light FP 03', 'Street Light', 'R51905'],
    ['Street Light FP 04', 'Street Light', 'R51908'],
    ['Street Light FP 05', 'Street Light', 'R51902'],
    ['Village Square', 'Common Building', 'R56628'],
    ['Zone-3 landscape light 17', 'FP-Landscape Lights Z3', 'R54872'],
    ['Zone-3 landscape light 21', 'FP-Landscape Lights Z3', 'R54873'],
    ['Zone-3 landscape light 22', 'FP-Landscape Lights Z3', 'R54874'],
];

const MONTHS = ['Apr-24', 'May-24', 'Jun-24', 'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24', 'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'];

// Readings indexed by meter name
const R: Record<string, (number | null)[]> = {
    'Actuator DB 01 (Z8)': [39, 49, 43, 43, 45, 43, 36, 34, 29, 7, 28, 24, 27.1, 22.5, 31, 23, 427, 7, 3, 3, 3, 15, 14],
    'Actuator DB 02': [285, 335, 275, 220, 210, 219, 165, 232, 161, 33, 134, 139, 211, 234.5, 363, 145, 157, 215, 213, 172, 382, 402, 390],
    'Actuator DB 03': [188, 226, 197, 203, 212, 203, 196, 220, 199, 56, 203, 196, 211.6, 188.4, 217, 133, 124, 130, 127, 141, 136, 137, 129],
    'Actuator DB 04': [159, 275, 258, 210, 184, 201, 144, 172, 173, 186, 161, 227, 253, 163, 255, 211, 196, 228, 224, 240, 255, 247, 258],
    'Actuator DB 05': [15, 18, 15, 16, 16, 16, 15, 18, 16, 4, 18, 14, 17.7, 15.3, 21, 17, 18, 16, 18, 18, 18, 18, 17],
    'Actuator DB 06': [39, 50, 42, 48, 46, 129, 43, 49, 44, 47, 45, 38, 46.9, 44.1, 56, 42, 50, 45, 47, 46, 46, 49, 45],
    'Bank muscat': [0, 0, 0, 3, 71, -2, 1407, 148, 72, 59, 98, 88, 163, 175, 222, 191, 154, 93, 67, 69, 744, 51, 61],
    'Beachwell': [16908, 46, 19332, 23170, 42241, 15223, 25370, 24383, 37236, 38168, 18422, 40, 27749, 23674, 46800, 33727, 29775, 32040, 29438, 30159, 17344, 0, 22559],
    'Central Park': [12208, 21845, 29438, 28186, 21995, 20202, 14900, 9604, 19032, 22819, 19974, 14190, 13846, 18783, 32135, 24330, 20201, 19814, 16122, 18028, 22191, 10470, 19889],
    'CIF kitchen': [0, 0, 0, 17895, 16532, 18955, 15071, 16742, 15554, 16788, 16154, 14971, 18446, 17185, 23503, 20608, 20471, 17902, 14659, 13920, 13586, 13625, 15629],
    'D Building 44': [463, 2416, 2036, 2120, 1645, 1717, 1643, 1377, 764, 647, 657, 650, 1306, 2499, 3598, 1768, 2087, 1247, 1179, 1141, 650, 611, 636],
    'D Building 45': [709, 2944, 1267, 262, 3212, 1330, 1570, 1252, 841, 670, 556, 608, 1069, 1974, 2840, 957, 544, 1825, 1043, 725, 629, 592, 523],
    'D Building 46': [818, 2392, 1620, 2216, 1671, 1718, 1734, 1577, 890, 724, 690, 752, 1292, 1969, 2517, 1739, 2273, 1872, 1749, 1691, 1010, 755, 724],
    'D Building 47': [918, 2678, 1446, 2173, 2068, 2073, 1651, 1774, 1055, 887, 738, 792, 1545, 1395, 2864, 1814, 2491, 2633, 2246, 989, 977, 885, 906],
    'D Building 48': [725, 1970, 1415, 1895, 1853, 1084, 1127, 1046, 785, 826, 676, 683, 1092, 1851, 1927, 1175, 1974, 1772, 1569, 1060, 748, 393, 606],
    'D Building 49': [947, 2912, 780, 1911, 1714, 1839, 1785, 1608, 1068, 860, 837, 818, 984, 1346, 2986, 1092, 1105, 1848, 1616, 1137, 805, 561, 455],
    'D Building 50': [577, 1253, 849, 1097, 1059, 1091, 1107, 1102, 789, 765, 785, 707, 1331, 2376, 3556, 1893, 2207, 1716.9, 1686.1, 1142, 809, 755, 602],
    'D Building 51': [735, 3030, 1677, 2046, 2472, 2285, 2165, 1855, 710, 661, 682, 642, 904, 2170, 2235, 1825, 2406, 2149, 1970, 1308, 916, 774, 766],
    'D Building 52': [727, 2882, 2087, 2897, 2786, 2990, 2501, 1986, 1208, 979, 896, 952, 1651, 2676, 3662, 2099, 2691, 2018, 1949, 1300, 912, 813, 811],
    'D Building 53': [714, 2699, 1405, 1845, 1494, 1709, 1525, 1764, 968, 693, 732, 760, 1281, 1674, 1411, 1180, 1306, 1279.3, 2453.7, 1375, 1224, 999, 944],
    'D Building 54': [717, 2904, 1961, 2449, 3031, 1453, 1261, 1777, 834, 681, 559, 531, 1042, 1616, 2652, 1672, 1402, 1655, 1521, 1030, 842, 698, 717],
    'D Building 55': [693, 2550, 1735, 2430, 2250, 2100, 1947, 1828, 1035, 677, 616, 719, 1417, 2087, 2703, 1385, 1245, 1554, 1493, 1090, 751, 652, 557],
    'D Building 56': [938, 3099, 1617, 2384, 2185, 2190, 2055, 1805, 937, 683, 731, 765, 1536, 2052, 2938, 2391, 2330, 2724, 2863, 1725, 1076, 891, 978],
    'D Building 57': [574, 2704, 1816, 2477, 2429, 1935, 2260, 2262, 1332, 990, 846, 795, 1732, 2996, 3064, 1544, 2325, 2203, 1875, 1515, 1498, 838, 1305],
    'D Building 58': [568, 2430, 1555, 2233, 1860, 1688, 1469, 1534, 778, 593, 535, 594, 1415, 1613, 2307, 532, 864, 1881, 1971, 1517, 1104, 974, 768],
    'D Building 59': [546, 1847, 1514, 2112, 1691, 1792, 1790, 1634, 998, 628, 582, 697, 1138, 1871, 2511, 1561, 2106, 1703, 1581, 1193, 921, 681, 830],
    'D Building 60': [628, 1935, 1327, 1762, 1269, 1360, 1260, 1275, 705, 674, 612, 679, 1069, 1554, 2330, 1390, 2814, 2406, 2239, 1843, 1082, 680, 795],
    'D Building 61': [532, 2022, 1662, 2255, 1929, 1958, 1704, 1734, 977, 767, 800, 719, 1394, 2168, 2606, 2227, 3163, 2877, 2079, 1455, 733, 691, 746],
    'D Building 62': [858, 2297, 1744, 2425, 2018, 1950, 1768, 1630, 957, 715, 677, 595, 800, 1788, 2886, 2181, 1953, 1743, 1800, 1220, 722, 537, 729],
    'D Building 74': [718, 2495, 1291, 1895, 1339, 840, 1147, 1303, 766, 639, 566, 463, 1079, 2338, 3153, 1320, 1648, 1044, 701, 607, 429, 414, 382],
    'D Building 75': [795, 6744, 983, 1438, 1268, 1225, 1125, 1169, 702, 475, 508, 554, 912, 1510, 2005, 1851, 2072, 2262, 2418, 1940, 1127, 603, 593],
    'Guard House': [823, 1489, 1574, 1586, 1325, 1391, 1205, 1225, 814, 798, 936, 879, 1467, 1764, 2249, 1481, 1657, 1404, 1325, 1077, 816, 785, 905],
    'Helipad': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Irrigation Tank 01': [1543, 2673, 2763, 2623, 1467, 1290, 1244, 1432, 1268, 1689, 2214, 1718, 1663, 1980, 2380, 3457, 4004, 3800, 2726, 2781, 2678, 2622, 2687],
    'Irrigation Tank 02': [1272, 2839, 3118, 2330, 2458, 1875, 893, 974, 1026, 983, 1124, 1110, 1830, 2282, 3260, 2681, 2100, 1260, 1225, 1950, 1323, 883, 1888],
    'Irrigation Tank 03': [894, 866, 1869, 1543, 1793, 524, 266, 269, 417, 840, 1009, 845, 1205, 1305, 2266, 1479, 1979, 1891, 1221, 1304, 851, 954, 851],
    'Irrigation Tank 04': [880, 827, 555, 443, 336, 195, 183, 212, 213, 40, 233, 235, 447.2, 1648, 1394, 884, 545, 1525, 870, 796, 294, 281, 242],
    'Lifting Station 02': [44, 0, 0, 0, 153, 125, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Lifting Station 03': [198, 269, 122, 203, 208, 257, 196, 91, 185, 28, 40, 58, 83, 70, 85, 66, 68, 63.65, 64.35, 65, 71, 64, 62],
    'Lifting Station 04': [644, 865, 791, 768, 747, 723, 628, 686, 631, 701, 638, 572, 750.22, 659.78, 698, 623, 636, 781, 786, 401, 487, 484, 876],
    'Lifting Station 05': [2056, 2577, 2361, 3016, 3684, 5866, 1715, 2413, 2643, 2873, 3665, 3069, 4201.4, 5868.6, 8461, 6572, 6180, 3158, 3076, 2816, 2983, 2198, 51],
    'OUA Store (BTU Meter)': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1242, 1242, 1948, null, null],
    'Pumping Station 01': [1608, 1940, 1783, 1874, 1662, 3822, 6876, 1629, 1640, 1903, 2095, 3032, 3940, 2982, 3420, 2284, 2332, 2314, 2373, 2439, 2195, 2464, 2203],
    'Pumping Station 03': [31, 47, 25, 3, 0, 0, 33, 0, 179, 33, 137, 131, 276.6, 397, 278, 60, 63, 66.7, 66.3, 67, 68, 63, 63],
    'Pumping Station 04': [830, 818, 720, 731, 857, 1176, 445, 919, 921, 245, 870, 646, 984.9, 880.6, 1049.7, 999.1, 975, 1014.3, 896.7, 915, 924, 882, 803],
    'Pumping Station 05': [1774, 2216, 2011, 2059, 2229, 5217, 2483, 2599, 1952, 2069, 2521, 2601, 3317, 3582, 3254, 2354, 2702, 2737, 2642, 2653, 2773, 2925, 3211],
    'ROP Building': [2047, 4442, 3057, 4321, 4185, 3554, 3692, 3581, 2352, 2090, 2246, 1939, 3537, 4503, 4868, 3099, 3724, 2701, 2165, 2084, 1308, 1194, 1299],
    'Security Building': [3529, 3898, 4255, 4359, 3728, 3676, 3140, 5702, 5131, 5559, 5417, 4504, 5978, 4964, 8519, 6940, 7909, 4345, 3551, 5180, 6995, 4310, 4519],
    'Street Light FP 01 (Z8)': [2773, 3276, 3268, 3040, 3203, 3225, 3064, 3593, 3147, 787, 3228, 2663, 3230, 3089, 3804, 2834, 3342, 3413, 3129, 3581, 3518, 3391, 3285],
    'Street Light FP 02': [1705, 2076, 1758, 1738, 1940, 2006, 1944, 2361, 2258, 633, 2298, 1812, 2153, 1900, 2435, 1838, 2146, 2172, 2317, 2739, 2619, 2561, 2415],
    'Street Light FP 03': [1399, 1608, 1365, 1380, 1457, 1499, 1561, 2060, 1966, 1868, 1974, 1562, 1847, 1637, 1984, 1571, 1735, 1783, 1893, 2100, 2048, 2134, 2033],
    'Street Light FP 04': [861, 1045, 1051, 2268, 2478, 2513, 2341, 2299, 1389, 325, 1406, 1401, 2412.9, 3047.1, 4099, 3072, 3180, 2847, 2420, 2092, 1653, 1490, 1672],
    'Street Light FP 05': [532, 587, 575, 770, 1341, 1895, 1844, 1477, 1121, 449, 2070, 1870, 3233, 4796, 5406, 3769, 3953, 3402, 2790, 1690, 1418, 1232, 1538],
    'Village Square': [2550, 2550, 2550, 2550, 8117, 9087, 4038, 6229, 3695, 3304, 3335, 3383, 4415, 5963, 9112, 6904, 6890, 5908, 5946, 4798, 4425, 4505, 4484],
    'Zone-3 landscape light 17': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Zone-3 landscape light 21': [42, 67, 37, 42, 40, 33, 28, 40, 48, 13, 57, 47, 55, 41, 74, 59, 53, 55, 51, 67, 70, 67, 54],
    'Zone-3 landscape light 22': [5, 10, 3, 5, 4, 5, 12, 6, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 6],
};

async function main() {
    console.log('=== STEP 1: Delete all readings ===');
    // Delete in batches since Supabase might have RLS limits
    const { error: delR } = await supabase.from('electricity_readings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delR) { console.error('Error deleting readings:', delR); return; }
    console.log('✅ All readings deleted');

    console.log('\n=== STEP 2: Delete all meters ===');
    const { error: delM } = await supabase.from('electricity_meters').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delM) { console.error('Error deleting meters:', delM); return; }
    console.log('✅ All meters deleted');

    console.log('\n=== STEP 3: Insert meters ===');
    const meterInserts = METERS.map(([name, type, account]) => ({
        name, meter_type: type, account_number: account || null
    }));
    const { data: insertedMeters, error: insM } = await supabase.from('electricity_meters').insert(meterInserts).select();
    if (insM) { console.error('Error inserting meters:', insM); return; }
    console.log(`✅ Inserted ${insertedMeters!.length} meters`);

    // Build name->id map
    const nameToId = new Map<string, string>();
    for (const m of insertedMeters!) { nameToId.set(m.name, m.id); }

    console.log('\n=== STEP 4: Insert readings ===');
    const readingInserts: { meter_id: string; month: string; consumption: number }[] = [];
    for (const [name, values] of Object.entries(R)) {
        const meterId = nameToId.get(name);
        if (!meterId) { console.log(`⚠️ No meter found for: ${name}`); continue; }
        for (let i = 0; i < MONTHS.length; i++) {
            if (values[i] !== null && values[i] !== undefined) {
                readingInserts.push({ meter_id: meterId, month: MONTHS[i], consumption: values[i]! });
            }
        }
    }
    console.log(`Prepared ${readingInserts.length} readings to insert`);

    // Insert in batches of 200
    let inserted = 0;
    for (let i = 0; i < readingInserts.length; i += 200) {
        const batch = readingInserts.slice(i, i + 200);
        const { error } = await supabase.from('electricity_readings').insert(batch);
        if (error) { console.error(`Error inserting batch:`, error); return; }
        inserted += batch.length;
        console.log(`  Batch ${Math.floor(i / 200) + 1}: ${inserted}/${readingInserts.length}`);
    }
    console.log(`\n✅ Successfully inserted ${inserted} readings`);

    // Verify counts
    const { count: mCount } = await supabase.from('electricity_meters').select('*', { count: 'exact', head: true });
    const { count: rCount } = await supabase.from('electricity_readings').select('*', { count: 'exact', head: true });
    console.log(`\n=== FINAL COUNTS ===`);
    console.log(`Meters: ${mCount}`);
    console.log(`Readings: ${rCount}`);
}

main().catch(console.error);
