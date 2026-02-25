// Generate 2025 data Part 2 (4300176-C43659) + merge all into final water_meters_full.json
const fs = require('fs');
const path = require('path');
const M = ['jan_25', 'feb_25', 'mar_25', 'apr_25', 'may_25', 'jun_25', 'jul_25', 'aug_25', 'sep_25', 'oct_25', 'nov_25', 'dec_25', 'jan_26'];
const D = [
    "D-75 Building Bulk Meter|4300176|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|62.5|57.8|68.4|71.9|59.2|62.2|67|101|68|65|64|57|74",
    "D-74 Building Bulk Meter|4300177|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|40.3|31.6|40.1|54.4|51.2|62.6|101|106|136|116|66|59|56",
    "D-44 Building Bulk Meter|4300178|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|178|211|82.9|85.5|61.6|49.1|52|59|64|68|66|66|114",
    "D-45 Building Bulk Meter|4300179|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|19.5|29.8|47.2|56.3|54.8|9.55|12|11|36|29|39|36|27",
    "D-46 Building Bulk Meter|4300180|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|59.9|45.4|30.6|68.2|69.4|54.9|65|85|121|134|68|60|50",
    "D-47 Building Bulk Meter|4300181|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|102|63.7|61.9|69.7|56.8|83.2|121|62|76|96|83|65|71",
    "D-48 Building Bulk Meter|4300182|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|16.4|16.2|19.8|17.8|25.4|47|28|37|24|39|30|33|35",
    "D-49 Building Bulk Meter|4300183|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|58|63|59|0|108|42|59|63|77|141|0|128|78",
    "D-50 Building Bulk Meter|4300184|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|64.6|72.8|90.8|49.3|34.1|39.5|60|44|6|75|41|41|57",
    "D-51 Building Bulk Meter|4300185|L3|Zone_03_(A)|ZONE 3A (BULK ZONE 3A)|D_Building_Bulk|90.9|96.4|165|166|111|101|149|154|175|202|107|96|129",
    "D-52 Building Bulk Meter|4300186|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|39.6|33.8|27.2|36.6|47.8|46.4|52|47|26|104|41|36|37",
    "D-62 Building Bulk Meter|4300187|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|49.5|28.9|42.3|34.4|22.4|26.7|46|33|37|38|96|87|82",
    "Z8-1|4300188|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0.79|1.68|3|16.2|6.52|0.2|2|0|0|1|1|0|0",
    "Z8-2|4300189|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0|0.01|0|0|0.04|0.03|0|0|0|0|0|0|0",
    "Z8-3|4300190|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0|0|0.01|0|0.03|0.03|0|0|27|3|1|1|1",
    "Z8-4|4300191|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Z8-6|4300192|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0.34|0.22|0.01|0.09|0.39|0.37|0|0|0|0|0|0|0",
    "Z8-7|4300193|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Z8-8|4300194|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Z8-10|4300195|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Z8-12|4300196|L3|Zone_08|BULK ZONE 8|Residential (Villa)|235|185|258|266|295|388|464|550|320|233|199|134|110",
    "Z8-14|4300197|L3|Zone_08|BULK ZONE 8|Residential (Villa)|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Z8-15|4300198|L3|Zone_08|BULK ZONE 8|Residential (Villa)|97.9|57.9|73.3|125|112|121|123|126|109|107|129|126|92",
    "Z8-16|4300199|L3|Zone_08|BULK ZONE 8|Residential (Villa)|65.7|67.6|59|97.9|95.3|82|129|252|99|98|78|94|72",
    "Z8-17|4300200|L3|Zone_08|BULK ZONE 8|Residential (Villa)|161|152|187|205|238|211|191|200|189|206|200|170|156",
    "D 53-Building Common Meter|4300201|L4|Zone_03_(B)|D-53 Building Bulk Meter|D_Building_Common|0.24|0.46|6.86|2.8|1.96|0.91|1|1|1|1|1|0|0",
    "D 54-Building Common Meter|4300202|L4|Zone_03_(B)|D-54 Building Bulk Meter|D_Building_Common|0.39|0.28|1.22|3.55|1.08|1.02|1|0|1|0|1|0|0",
    "D 55-Building Common Meter|4300203|L4|Zone_03_(B)|D-55 Building Bulk Meter|D_Building_Common|1.4|1.1|2.04|2.69|1.67|0.3|1|1|4|13|0|0|0",
    "D 56-Building Common Meter|4300204|L4|Zone_03_(B)|D-56 Building Bulk Meter|D_Building_Common|1.27|2.26|7.76|3.03|3.72|2.02|2|2|2|2|2|2|2",
    "D 57-Building Common Meter|4300205|L4|Zone_03_(B)|D-57 Building Bulk Meter|D_Building_Common|1.51|1.35|3.98|7.22|2.57|1.93|3|2|2|1|1|1|1",
    "D 58-Building Common Meter|4300206|L4|Zone_03_(B)|D-58 Building Bulk Meter|D_Building_Common|0.32|0.69|0.3|2.31|0.32|0.55|1|1|1|0|1|0|0",
    "D 59-Building Common Meter|4300207|L4|Zone_03_(B)|D-59 Building Bulk Meter|D_Building_Common|0.45|0.61|0.45|1.07|0.96|0.39|1|1|1|0|0|0|0",
    "D 60-Building Common Meter|4300208|L4|Zone_03_(B)|D-60 Building Bulk Meter|D_Building_Common|0.72|0.51|0.29|1.07|1.99|0.38|1|1|1|1|0|0|0",
    "D 61-Building Common Meter|4300209|L4|Zone_03_(B)|D-61 Building Bulk Meter|D_Building_Common|0.43|0.49|0.44|2.56|0.35|0.57|1|2|1|1|1|1|1",
    "Z3-53(1A) (Building)|4300210|L4|Zone_03_(B)|D-53 Building Bulk Meter|Residential (Apart)|7.85|7.74|12.1|11.3|3.93|17.3|12|12|12|9|8|19|16",
    "Z3-53(1B) (Building)|4300211|L4|Zone_03_(B)|D-53 Building Bulk Meter|Residential (Apart)|5.94|7.48|6.56|8|9.37|7.76|7|8|4|7|6|8|8",
    "Z3-53(2A) (Building)|4300212|L4|Zone_03_(B)|D-53 Building Bulk Meter|Residential (Apart)|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Z3-53(2B) (Building)|4300213|L4|Zone_03_(B)|D-53 Building Bulk Meter|Residential (Apart)|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Z3-53(3A) (Building)|4300214|L4|Zone_03_(B)|D-53 Building Bulk Meter|Residential (Apart)|0|0.67|0.21|6.04|0.07|0.02|0|7|0|2|3|3|4",
    "Z3-53(3B) (Building)|4300215|L4|Zone_03_(B)|D-53 Building Bulk Meter|Residential (Apart)|1.11|2.81|1.04|6.08|5.51|0.83|0|0|1|0|3|0|3",
    "Z3-53(4A) (Building)|4300216|L4|Zone_03_(B)|D-53 Building Bulk Meter|Residential (Apart)|0.64|4.63|0.25|4.7|0.01|0|4|1|3|3|4|2|11",
    "Z3-53(5) (Building)|4300217|L4|Zone_03_(B)|D-53 Building Bulk Meter|Residential (Apart)|1.73|1.45|1.18|0.27|0.41|0.25|0|0|0|15|4|4|3",
    "Z3-54(1A) (Building)|4300218|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|10.9|11.8|8.65|13.1|5.01|14.7|30|13|16|13|12|13|14",
    "Z3-54(1B) (Building)|4300219|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|0.92|0.41|5.5|5.5|3.11|0.01|5|6|3|3|2|2|2",
    "Z3-54(2A) (Building)|4300220|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|2.49|2.95|3.43|0.91|0|0.16|1|0|0|0|0|0|1",
    "Z3-54(2B) (Building)|4300221|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|19.2|8.24|19.9|14.8|10.4|5.21|12|8|9|2|7|5|7",
    "Z3-54(3A) (Building)|4300222|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|7.43|6.86|5.35|7.23|4.95|0.22|0|0|0|0|0|0|0",
    "Z3-54(3B) (Building)|4300223|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|1.55|0.53|0.05|0.9|0.02|0.06|0|0|0|0|6|0|0",
    "Z3-54(4A) (Building)|4300224|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|0.42|0|4.66|8.85|0|11.6|0|0|0|0|21|6|8",
    "Z3-54(4B) (Building)|4300225|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|0|0|1.65|1.79|0|0|0|0|0|0|0|0|0",
    "Z3-54(5) (Building)|4300226|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|15.6|15.5|14.9|17.3|19.1|15.7|17|15|15|17|13|12|14",
    "Z3-54(6) (Building)|4300227|L4|Zone_03_(B)|D-54 Building Bulk Meter|Residential (Apart)|4.35|3.88|4.15|22.9|8.63|8.7|12|14|10|11|8|15|5",
    "Z3-55(1A) (Building)|4300228|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|0|0|0.01|0|0.47|0|0|0|0|0|0|0|0",
    "Z3-55(2A) (Building)|4300229|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|23.2|23.4|5.54|15.4|25.2|25.2|25|27|25|27|29|31|19",
    "Z3-55(2B) (Building)|4300230|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|3.37|3.32|5.04|5.18|4.26|0.14|4|1|0|2|3|4|3",
    "Z3-55(3A) (Building)|4300231|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|16.3|8.02|4.95|9.55|12.3|9.17|24|26|6|9|9|13|29",
    "Z3-55(3B) (Building)|4300232|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|7.07|2.35|5.33|7.13|4.91|7.23|6|8|5|7|7|7|8",
    "Z3-55(4A) (Building)|4300233|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|3.18|6.32|8.4|8.83|5.91|11.9|11|11|6|6|1|0|0",
    "Z3-55(4B) (Building)|4300234|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|5.12|4.17|5.68|5.65|2.88|4.05|4|6|1|4|6|6|6",
    "Z3-55(5) (Building)|4300235|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|0.02|0.22|1|0.45|0.93|0.24|0|0|1|12|14|0|0",
    "Z3-55(6) (Building)|4300236|L4|Zone_03_(B)|D-55 Building Bulk Meter|Residential (Apart)|6.98|5.76|72|125|31.4|0.37|0|0|2|9|3|13|5",
    "Z3-56(1A) (Building)|4300237|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|46.6|0|0|0|0|0|0|0|0|0|0|0|0",
    "Z3-56(1B) (Building)|4300238|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|0.64|0.3|0|0.27|0.68|0|1|0|1|1|1|1|1",
    "Z3-56(2A) (Building)|4300239|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|2.78|6.39|0.47|3.26|5.97|0.83|0|0|5|5|4|3|2",
    "Z3-56(2B) (Building)|4300240|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|4.48|1.31|7.4|11.9|2.74|0.04|0|0|0|0|8|8|5",
    "Z3-56(3A) (Building)|4300241|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|0|0|0.01|0|0.01|9.01|13|15|11|10|8|8|7",
    "Z3-56(3B) (Building)|4300242|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|0|1.01|0|0|0|0.11|0|0|0|0|5|4|2",
    "Z3-56(4A) (Building)|4300243|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|0|0|3.96|3.54|1.85|0.95|0|0|1|0|0|9|3",
    "Z3-56(4B) (Building)|4300244|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|7|0|0.8|3.4|3.6|3.83|9|10|7|7|10|8|9",
    "Z3-56(5) (Building)|4300245|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|1.69|1.87|0|1.25|0|0.07|4|1|2|0|0|0|13",
    "Z3-56(6) (Building)|4300246|L4|Zone_03_(B)|D-56 Building Bulk Meter|Residential (Apart)|13.9|3.42|17.7|1.96|0.13|0|0|0|0|0|0|0|0",
    "Z3-57(1A) (Building)|4300247|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|2.15|7.78|0.08|0.06|1.78|5.47|2|0|0|0|0|1|1",
    "Z3-57(1B) (Building)|4300248|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|3.49|0.23|0|1.08|0.05|1.2|0|1|0|0|3|2|4",
    "Z3-57(2A) (Building)|4300249|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|3.8|5.54|4.77|3.77|5.06|2.77|3|5|5|5|7|5|12",
    "Z3-57(2B) (Building)|4300250|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|0.92|1.7|4.85|8.09|11.2|7.28|7|6|9|10|8|9|9",
    "Z3-57(3A) (Building)|4300251|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|5|4.1|5.83|4.97|6.75|6.56|11|7|6|5|5|6|6",
    "Z3-57(3B) (Building)|4300252|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|0.25|0.18|0.38|0.19|0.06|0.29|0|0|0|1|1|0|5",
    "Z3-57(4A) (Building)|4300253|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|0|0|0|0.31|0|0.07|1|0|2|0|0|0|0",
    "Z3-57(4B) (Building)|4300254|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|0|2.8|0|3.25|0|3.64|0|0|7|0|0|5|5",
    "Z3-57(5) (Building)|4300255|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|16.6|13.6|7.09|21.1|29.8|24.6|22|21|20|15|18|20|30",
    "Z3-57(6) (Building)|4300256|L4|Zone_03_(B)|D-57 Building Bulk Meter|Residential (Apart)|9.33|26.3|22.4|13.6|13.4|6|9|12|15|9|23|9|8",
    "Z3-58(1A) (Building)|4300257|L4|Zone_03_(B)|D-58 Building Bulk Meter|Residential (Apart)|3.26|1.74|4.54|3.56|3.52|1.19|2|2|4|9|4|5|3",
    "Z3-58(2A) (Building)|4300258|L4|Zone_03_(B)|D-58 Building Bulk Meter|Residential (Apart)|0|0.85|4.24|4|0.06|0|0|0|0|0|0|0|0",
    "Z3-58(2B) (Building)|4300259|L4|Zone_03_(B)|D-58 Building Bulk Meter|Residential (Apart)|4.7|4.62|2.08|8.73|5.96|2.87|8|9|5|3|4|2|4",
    "Z3-58(3A) (Building)|4300260|L4|Zone_03_(B)|D-58 Building Bulk Meter|Residential (Apart)|0|0.01|0.06|0|11.8|8|4|3|4|3|4|1|3",
    "Z3-58(4A) (Building)|4300261|L4|Zone_03_(B)|D-58 Building Bulk Meter|Residential (Apart)|0.2|0.32|0.6|0.37|0.14|0.01|0|6|13|1|1|3|1",
    "Z3-58(6) (Building)|4300262|L4|Zone_03_(B)|D-58 Building Bulk Meter|Residential (Apart)|1.61|2.31|4.26|8.42|14|12.9|12|18|18|18|10|15|18",
    "Z3-59(1A) (Building)|4300263|L4|Zone_03_(B)|D-59 Building Bulk Meter|Residential (Apart)|6.93|6.52|4.54|4.77|5.82|4.51|4|4|4|3|3|3|7",
    "Z3-59(1B) (Building)|4300264|L4|Zone_03_(B)|D-59 Building Bulk Meter|Residential (Apart)|2.31|3.43|1|0.05|0.46|0.02|0|1|0|0|0|1|1",
    "Z3-59(2A) (Building)|4300265|L4|Zone_03_(B)|D-59 Building Bulk Meter|Residential (Apart)|9.24|12.4|14.6|14.1|14.3|12.8|13|12|9|8|7|13|9",
    "Z3-59(2B) (Building)|4300266|L4|Zone_03_(B)|D-59 Building Bulk Meter|Residential (Apart)|12.2|13.5|12.2|15.7|9.91|12.3|11|12|16|16|8|11|10",
    "Z3-59(3B) (Building)|4300267|L4|Zone_03_(B)|D-59 Building Bulk Meter|Residential (Apart)|1.21|3.21|4.45|2.61|0.31|0.01|0|0|0|0|0|0|0",
    "Z3-59(4A) (Building)|4300268|L4|Zone_03_(B)|D-59 Building Bulk Meter|Residential (Apart)|9.38|7.49|7.14|7.31|4.37|7.16|12|12|15|8|11|8|9",
    "Z3-59(5) (Building)|4300269|L4|Zone_03_(B)|D-59 Building Bulk Meter|Residential (Apart)|12|2.6|8.14|9.51|6.38|3.89|10|3|2|7|3|4|1",
    "Z3-59(6) (Building)|4300270|L4|Zone_03_(B)|D-59 Building Bulk Meter|Residential (Apart)|0|1|1|0|14|3|1|12|12|10|12|18|17",
    "Z3-60(1A) (Building)|4300271|L4|Zone_03_(B)|D-60 Building Bulk Meter|Residential (Apart)|2.89|6.3|6.41|6.05|6.01|3.26|5|7|6|5|4|10|8",
    "Z3-60(2A) (Building)|4300272|L4|Zone_03_(B)|D-60 Building Bulk Meter|Residential (Apart)|3.82|4.28|3.29|2.27|3.98|9.82|5|3|3|3|4|4|3",
    "Z3-60(3A) (Building)|4300273|L4|Zone_03_(B)|D-60 Building Bulk Meter|Residential (Apart)|4.72|8.44|17.5|9.33|6.68|5.89|4|4|1|7|7|7|7",
    "Z3-60(4A) (Building)|4300274|L4|Zone_03_(B)|D-60 Building Bulk Meter|Residential (Apart)|5.57|4.56|6.02|4.28|7.65|2.75|3|0|0|6|4|3|0",
    "Z3-60(5) (Building)|4300275|L4|Zone_03_(B)|D-60 Building Bulk Meter|Residential (Apart)|0.01|0.01|0.02|0.04|0.02|0.01|0|0|33|8|4|2|0",
    "Z3-60(6) (Building)|4300276|L4|Zone_03_(B)|D-60 Building Bulk Meter|Residential (Apart)|20.1|34|44.5|47.5|45.3|48.5|48|46|22|25|6|18|59",
    "Z3-61(1A) (Building)|4300277|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|1.46|0.43|2.76|3.16|1.25|0.13|0|11|6|7|7|3|0",
    "Z3-61(1B) (Building)|4300278|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|8.91|8.56|3.06|7.95|2.06|7.69|9|6|5|6|11|8|9",
    "Z3-61(2A) (Building)|4300279|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|0|0|11.2|10.8|12.7|2.67|1|2|3|2|1|1|1",
    "Z3-61(2B) (Building)|4300280|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|0.79|0.62|0.08|0.85|1.22|1.04|1|2|3|2|0|1|1",
    "Z3-61(3A) (Building)|4300281|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|0|5.69|21.1|22.3|1.55|0.11|0|0|0|0|0|0|7",
    "Z3-61(3B) (Building)|4300282|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|0.24|0.2|0.1|4.45|11.3|11.1|8|7|8|0|0|1|1",
    "Z3-61(4A) (Building)|4300283|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|6.39|9.57|7.16|7.79|5.28|6.85|6|23|4|6|10|6|9",
    "Z3-61(4B) (Building)|4300284|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|2.36|3.24|9.55|4.18|2.47|3.39|4|3|4|3|3|3|3",
    "Z3-61(5) (Building)|4300285|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|5.81|0|1.36|1.81|0|0|0|0|2|9|0|2|0",
    "Z3-61(6) (Building)|4300286|L4|Zone_03_(B)|D-61 Building Bulk Meter|Residential (Apart)|14.7|14.4|19.4|16.5|12|9.16|16|12|16|15|7|14|16",
    "Z8-5|4300287|L3|Zone_08|BULK ZONE 8|Residential (Villa)|142|278|313|336|325|236|224|98|343|203|155|183|156",
    "Z8-9|4300288|L3|Zone_08|BULK ZONE 8|Residential (Villa)|4.98|11.5|5.96|3.77|5.61|2.97|1|1|1|1|1|1|0",
    "Z8-18|4300289|L3|Zone_08|BULK ZONE 8|Residential (Villa)|122|102|331|342|359|361|242|127|157|137|141|111|113",
    "Z8-19|4300290|L3|Zone_08|BULK ZONE 8|Residential (Villa)|104|70.9|226|275|274|244|197|187|168|223|164|79|91",
    "Z8-20|4300291|L3|Zone_08|BULK ZONE 8|Residential (Villa)|146|101|307|298|300|89.9|122|106|160|125|96|94|108",
    "Z8-21|4300292|L3|Zone_08|BULK ZONE 8|Residential (Villa)|99|53.3|284|254|154|115|60|60|63|62|84|30|47",
    "Z8-22|4300293|L3|Zone_08|BULK ZONE 8|Residential (Villa)|225|147|327|451|387|254|105|55|48|31|35|38|16",
    "Irrigation Tank 04 - (Z08)|4300294|DC|Direct Connection|Main Bulk (NAMA)|IRR_Servies|0|0|0|0|0|0|1|0|0|0|0|0|-1",
    "Sales Center Common Building|4300295|L2|Zone_SC|Main Bulk (NAMA)|Zone Bulk|74.5|62.9|44.1|65.5|63.1|54.9|59|61|87|78|78|21|152",
    "Building FM|4300296|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|MB_Common|35.6|36.8|51.6|40|40.8|31.7|44|40|38|39|44|41|30",
    "Building (Security)|4300297|DC|Direct Connection|Main Bulk (NAMA)|MB_Common|17.1|15.8|15.1|15.9|15.9|13.4|18|16|17|20|25|27|27",
    "Building Taxi|4300298|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|11.1|15.1|13|14.5|13.3|13.6|13|17|17|17|15|20|15",
    "Building (ROP)|4300299|DC|Direct Connection|Main Bulk (NAMA)|MB_Common|22.4|20.7|19.6|19.6|19.7|16.9|22|20|21|23|31|31|33",
    "Building B1|4300300|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|225|200|266|248|233|146|227|298|273|265|250|253|256",
    "Building B2|4300301|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|231|189|232|183|199|172|190|240|224|248|256|255|280",
    "Building B3|4300302|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|166|148|152|132|160|153|168|148|165|210|257|214|177",
    "Building B4|4300303|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|106|95.6|165|145|121|150|158|179|211|175|169|161|153",
    "Building B5|4300304|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|1.6|1.49|1.06|0.73|0.12|179|62|54|41|42|37|32|6",
    "Building B6|4300305|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|250|220|282|278|214|195|194|210|221|229|231|260|287",
    "Building B7|4300306|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|175|170|197|200|200|155|191|155|168|200|201|211|214",
    "Building B8|4300307|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|268|250|233|0|413|213|62|84|196|383|281|280|262",
    "Irrigation Tank (Z01_FM)|4300308|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|IRR_Servies|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Room PUMP (FIRE)|4300309|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|MB_Common|75.9|0.32|0|0|0|0|0|0|0|0|2|1|1",
    "Building (MEP)|4300310|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|MB_Common|2|2|1|0|6|2|1|2|3|4|4|4|4",
    "D-53 Building Bulk Meter|4300311|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|17.4|25.1|27.9|38.9|21|26.7|26|30|46|94|106|100|96",
    "D-54 Building Bulk Meter|4300312|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|62.2|49.9|68.1|95.8|50.8|55.8|75|55|53|45|67|46|50",
    "D-55 Building Bulk Meter|4300313|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|69.9|58.2|112|181|94.4|60.7|78|82|54|90|76|77|74",
    "D-56 Building Bulk Meter|4300314|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|91.7|16.8|39|0|0|59|32|28|29|27|40|42|43",
    "D-57 Building Bulk Meter|4300315|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|46.5|63.5|49.4|63.5|72.3|46|64|54|66|31|0|0|87",
    "D-58 Building Bulk Meter|4300316|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|55.2|46.9|62.6|93.7|83|62.1|63|81|75|66|54|58|64",
    "D-59 Building Bulk Meter|4300317|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|56.5|53.7|53.1|65.9|46.9|43.7|53|56|57|51|45|63|62",
    "D-60 Building Bulk Meter|4300318|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|55.4|75.1|94.3|102|90.7|84.1|83|73|88|32|49|66|99",
    "D-61 Building Bulk Meter|4300319|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|D_Building_Bulk|41|43|76|82|49.2|43.1|62|66|50|49|40|40|46",
    "Irrigation Tank 02 (Z03)|4300320|L3|Zone_03_(B)|ZONE 3B (BULK ZONE 3B)|IRR_Servies|49|47|43|15|304.7|106|91|92|225|548|873|321|0",
    "Irrigation Tank 03 (Z05)|4300321|L3|Zone_05|ZONE 5 (Bulk Zone 5)|IRR_Servies|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Irrigation Tank 01 (Outlet)|4300322|N/A|N/A|N/A|IRR_Servies|27954|29422|26787|13780|30126.9|18885|20290|23295|19002|15136|13998|23239|28077",
    "Irrigation Tank 01 (Inlet)|4300323|DC|Direct Connection|Main Bulk (NAMA)|IRR_Servies|0|0|0|0|2|0|1|0|0|0|0|0|0",
    "Building CIF/CB|4300324|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|415|294|352|304|284|242|442|731|516|274|270|254|319",
    "Building Nursery Building|4300325|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|4|4|4|0|6|4|2|2|7|5|5|3|4",
    "Irrigation Tank - VS PO Water|4300326|L3|Zone_VS|Village Square (Zone Bulk)|IRR_Servies|0.02|0|0|0|0|0|0|0|0|0|0|0|0",
    "Coffee 1 (GF Shop No.591)|4300327|L3|Zone_VS|Village Square (Zone Bulk)|Retail|0.53|0|0|0|0|0|0|0|0|0|0|0|0",
    "Sale Centre Caffe & Bar (GF Shop No.592 A)|4300328|L3|Zone_SC|Sale Centre (Zone Bulk)|Retail|0.4|1.39|3.03|5.04|12|5.09|20|33|28|43|40|60|53",
    "Coffee 2 (GF Shop No.594 A)|4300329|L3|Zone_VS|Village Square (Zone Bulk)|Retail|2.65|2.81|4.28|4.94|5.19|3.76|9|5|16|10|11|14|7",
    "Supermarket (FF Shop No.591)|4300330|L3|Zone_VS|Village Square (Zone Bulk)|Retail|0|0|0|0|0|0|0|0|0|0|1|0|0",
    "Pharmacy (FF Shop No.591 A)|4300331|L3|Zone_VS|Village Square (Zone Bulk)|Retail|0.23|0.01|0|0.02|0|0.01|0|0|0|0|0|0|0",
    "Laundry Services (FF Shop No.593)|4300332|L3|Zone_VS|Village Square (Zone Bulk)|Retail|33|25|22|0|43.5|27.9|44|42|45|49|61|75|86",
    "Shop No.593 A|4300333|L3|Zone_VS|Village Square (Zone Bulk)|Retail|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Hotel Main Building|4300334|DC|Direct Connection|Main Bulk (NAMA)|Retail|18048|19482|22151|11667|26963|17379|14713|16249|13548|18876|18656|18102|-63838",
    "Village Square (Zone Bulk)|4300335|L2|Zone_VS|Main Bulk (NAMA)|Zone Bulk|14|12|21|13|18.8|18.6|60|77|81|122|126|189|249",
    "Community Mgmt - Technical Zone, STP|4300336|DC|Direct Connection|Main Bulk (NAMA)|MB_Common|29.1|37.1|25.7|35.1|28.5|53.1|50|56|55|62|42|38|40",
    "Cabinet FM (CONTRACTORS OFFICE)|4300337|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Building|67.1|53.2|59.4|56.9|51.3|49.7|56|49|39|0|64|43|36",
    "PHASE 02, MAIN ENTRANCE (Infrastructure)|4300338|DC|Direct Connection|Main Bulk (NAMA)|MB_Common|10.4|8.23|6.03|6.44|6.09|6.33|7|7|8|12|10|18|16",
    "Building CIF/CB (COFFEE SH)|4300339|L3|Zone_01_(FM)|ZONE FM ( BULK ZONE FM )|Retail|0|0|0|0|0|0|0|0|0|0|0|0|0",
    "Irrigation- Controller UP|4300340|DC|Direct Connection|Main Bulk (NAMA)|IRR_Servies|0|0|0|0|33|491|554|272|266|181|328|253|124",
    "Irrigation- Controller DOWN|4300341|DC|Direct Connection|Main Bulk (NAMA)|IRR_Servies|159|239|283|0|910|511|611|343|0|0|0|0|0",
    "ZONE 8 (Bulk Zone 8)|4300342|L2|Zone_08|Main Bulk (NAMA)|Zone Bulk|1547|1498|2605|3138|2937|3142|3492|3347|3783|3929|3306|3506|10017",
    "ZONE 3A (Bulk Zone 3A)|4300343|L2|Zone_03_(A)|Main Bulk (NAMA)|Zone Bulk|4235|4273|3591|3996|4898|6566|5949|6207|6440|7219|5208|1483|2616",
    "ZONE 3B (Bulk Zone 3B)|4300344|L2|Zone_03_(B)|Main Bulk (NAMA)|Zone Bulk|3256|2962|3331|935|3093|3231|3243|2886|16402|5467|11824|2050|6529",
    "ZONE 5 (Bulk Zone 5)|4300345|L2|Zone_05|Main Bulk (NAMA)|Zone Bulk|4267|4231|3862|3663|3849|4137|3476|3968|4030|4218|4433|4874|4598",
    "ZONE FM ( BULK ZONE FM )|4300346|L2|Zone_01_(FM)|Main Bulk (NAMA)|Zone Bulk|2008|1740|1880|1756|1693|1673|1960|2305|2089|2002|2059|2130|2271",
    "Irrigation Tank - VS (TSE Water)|4300347|N/A|N/A|N/A|IRR_Servies|934|934|855|0|2698|1164|825|1917|1444|1489|1053|749|917",
    "Al Adrak Camp|4300348|DC|Direct Connection|Main Bulk (NAMA)|Retail|1038|702|1161|1000|1228|1015|972|924|860|879|875|686|833",
    "Al Adrak Company (accommodation)Camp Area|4300349|DC|Direct Connection|Main Bulk (NAMA)|Retail|0|0|0|0|1805|1758|1859|1572|1774|1687|1448|1066|1352",
    "Main Bulk (NAMA)|C43659|L1|Main Bulk|NAMA|Main BULK|32580|44043|49697|31828|58425|41840|41475|38813|42088|46049|47347|45922|41320",
];

// Parse 2025 part 2
const part2_25 = {};
D.forEach(line => {
    const p = line.split('|');
    if (p.length < 19) return;
    const acct = p[1];
    part2_25[acct] = { label: p[0], account_number: p[1], level: p[2], zone: p[3], parent_meter: p[4], type: p[5] };
    M.forEach((m, i) => { const v = parseFloat(p[6 + i]); part2_25[acct][m] = isNaN(v) ? null : v; });
});

// Load 2025 part 1
const part1_25 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data_2025_part1.json'), 'utf-8'));
const all2025 = { ...part1_25, ...part2_25 };
console.log('Total 2025 meters: ' + Object.keys(all2025).length);

// Load 2024 data
const all2024 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data_2024_full.json'), 'utf-8'));
console.log('Total 2024 meters: ' + Object.keys(all2024).length);

// Merge: use 2025 labels/metadata as primary, add 2024 month columns
const M24 = ['jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24'];
const merged = [];
const allAccounts = new Set([...Object.keys(all2025), ...Object.keys(all2024)]);
for (const acct of allAccounts) {
    const r25 = all2025[acct];
    const r24 = all2024[acct];
    const base = r25 || r24;
    const row = {
        label: base.label,
        account_number: base.account_number,
        level: base.level,
        zone: base.zone,
        parent_meter: base.parent_meter,
        type: base.type,
    };
    // Add 2024 months
    M24.forEach(m => { row[m] = r24 ? (r24[m] ?? null) : null; });
    // Add 2025 months
    M.forEach(m => { row[m] = r25 ? (r25[m] ?? null) : null; });
    merged.push(row);
}

fs.writeFileSync(path.join(__dirname, 'water_meters_full.json'), JSON.stringify(merged, null, 2));
console.log('\n✅ Final merged: ' + merged.length + ' meters written to water_meters_full.json');
console.log('Months: Jan-24 through Jan-26 (25 months)');
