
import { STPDailyData, STPMonthlyData, ProcessingMetrics } from '@/types/stp';
import { format, parse, isValid, parseISO } from 'date-fns';

// Monthly data from July 2024 to March 2025
export const stpMonthlyData: STPMonthlyData[] = [
  { month: '2024-07', tankerTrips: 442, expectedVolumeTankers: 8840, directSewageMB: 8055, totalInfluent: 16895, totalWaterProcessed: 18308, tseToIrrigation: 16067 },
  { month: '2024-08', tankerTrips: 378, expectedVolumeTankers: 7560, directSewageMB: 8081, totalInfluent: 15641, totalWaterProcessed: 17372, tseToIrrigation: 15139 },
  { month: '2024-09', tankerTrips: 283, expectedVolumeTankers: 5660, directSewageMB: 8146, totalInfluent: 13806, totalWaterProcessed: 14859, tseToIrrigation: 13196 },
  { month: '2024-10', tankerTrips: 289, expectedVolumeTankers: 5780, directSewageMB: 10617, totalInfluent: 16397, totalWaterProcessed: 17669, tseToIrrigation: 15490 },
  { month: '2024-11', tankerTrips: 235, expectedVolumeTankers: 4700, directSewageMB: 9840, totalInfluent: 14540, totalWaterProcessed: 16488, tseToIrrigation: 14006 },
  { month: '2024-12', tankerTrips: 196, expectedVolumeTankers: 3920, directSewageMB: 11293, totalInfluent: 15213, totalWaterProcessed: 17444, tseToIrrigation: 14676 },
  { month: '2025-01', tankerTrips: 207, expectedVolumeTankers: 4140, directSewageMB: 11583, totalInfluent: 15723, totalWaterProcessed: 18212, tseToIrrigation: 15433 },
  { month: '2025-02', tankerTrips: 121, expectedVolumeTankers: 2420, directSewageMB: 10660, totalInfluent: 13080, totalWaterProcessed: 14408, tseToIrrigation: 12075 },
  { month: '2025-03', tankerTrips: 133, expectedVolumeTankers: 2660, directSewageMB: 14293, totalInfluent: 16953, totalWaterProcessed: 19023, tseToIrrigation: 16171 }
];

// Complete daily data for all months
export const stpDailyData: STPDailyData[] = [
  // July 2024
  { date: '2024-07-01', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 139, totalInfluent: 339, totalWaterProcessed: 385, tseToIrrigation: 340 },
  { date: '2024-07-02', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 246, totalInfluent: 526, totalWaterProcessed: 519, tseToIrrigation: 458 },
  { date: '2024-07-03', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 208, totalInfluent: 468, totalWaterProcessed: 479, tseToIrrigation: 425 },
  { date: '2024-07-04', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 244, totalInfluent: 464, totalWaterProcessed: 547, tseToIrrigation: 489 },
  { date: '2024-07-05', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 265, totalInfluent: 565, totalWaterProcessed: 653, tseToIrrigation: 574 },
  { date: '2024-07-06', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 222, totalInfluent: 502, totalWaterProcessed: 552, tseToIrrigation: 492 },
  { date: '2024-07-07', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 289, totalInfluent: 549, totalWaterProcessed: 575, tseToIrrigation: 498 },
  { date: '2024-07-08', tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 212, totalInfluent: 532, totalWaterProcessed: 587, tseToIrrigation: 515 },
  { date: '2024-07-09', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 272, totalInfluent: 532, totalWaterProcessed: 586, tseToIrrigation: 519 },
  { date: '2024-07-10', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 253, totalInfluent: 493, totalWaterProcessed: 542, tseToIrrigation: 462 },
  { date: '2024-07-11', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 266, totalInfluent: 506, totalWaterProcessed: 533, tseToIrrigation: 468 },
  { date: '2024-07-12', tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 258, totalInfluent: 578, totalWaterProcessed: 654, tseToIrrigation: 580 },
  { date: '2024-07-13', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 279, totalInfluent: 479, totalWaterProcessed: 464, tseToIrrigation: 402 },
  { date: '2024-07-14', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 226, totalInfluent: 486, totalWaterProcessed: 506, tseToIrrigation: 448 },
  { date: '2024-07-15', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 271, totalInfluent: 391, totalWaterProcessed: 482, tseToIrrigation: 418 },
  { date: '2024-07-16', tankerTrips: 18, expectedVolumeTankers: 360, directSewageMB: 216, totalInfluent: 576, totalWaterProcessed: 670, tseToIrrigation: 600 },
  { date: '2024-07-17', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 266, totalInfluent: 506, totalWaterProcessed: 344, tseToIrrigation: 300 },
  { date: '2024-07-18', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 209, totalInfluent: 369, totalWaterProcessed: 585, tseToIrrigation: 517 },
  { date: '2024-07-19', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 314, totalInfluent: 614, totalWaterProcessed: 687, tseToIrrigation: 605 },
  { date: '2024-07-20', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 243, totalInfluent: 483, totalWaterProcessed: 536, tseToIrrigation: 465 },
  { date: '2024-07-21', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 241, totalInfluent: 501, totalWaterProcessed: 504, tseToIrrigation: 455 },
  { date: '2024-07-22', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 220, totalInfluent: 480, totalWaterProcessed: 549, tseToIrrigation: 492 },
  { date: '2024-07-23', tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 248, totalInfluent: 568, totalWaterProcessed: 611, tseToIrrigation: 535 },
  { date: '2024-07-24', tankerTrips: 18, expectedVolumeTankers: 360, directSewageMB: 203, totalInfluent: 563, totalWaterProcessed: 599, tseToIrrigation: 528 },
  { date: '2024-07-25', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 135, totalInfluent: 415, totalWaterProcessed: 517, tseToIrrigation: 444 },
  { date: '2024-07-26', tankerTrips: 18, expectedVolumeTankers: 360, directSewageMB: 224, totalInfluent: 584, totalWaterProcessed: 650, tseToIrrigation: 570 },
  { date: '2024-07-27', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 337, totalInfluent: 537, totalWaterProcessed: 475, tseToIrrigation: 414 },
  { date: '2024-07-28', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 213, totalInfluent: 453, totalWaterProcessed: 512, tseToIrrigation: 449 },
  { date: '2024-07-29', tankerTrips: 19, expectedVolumeTankers: 380, directSewageMB: 305, totalInfluent: 685, totalWaterProcessed: 671, tseToIrrigation: 577 },
  { date: '2024-07-30', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 267, totalInfluent: 527, totalWaterProcessed: 668, tseToIrrigation: 582 },
  { date: '2024-07-31', tankerTrips: 17, expectedVolumeTankers: 340, directSewageMB: 266, totalInfluent: 606, totalWaterProcessed: 613, tseToIrrigation: 529 },
  
  // August 2024
  { date: '2024-08-01', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 242, totalInfluent: 542, totalWaterProcessed: 601, tseToIrrigation: 528 },
  { date: '2024-08-02', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 360, totalInfluent: 660, totalWaterProcessed: 676, tseToIrrigation: 590 },
  { date: '2024-08-03', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 233, totalInfluent: 493, totalWaterProcessed: 544, tseToIrrigation: 474 },
  { date: '2024-08-04', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 250, totalInfluent: 510, totalWaterProcessed: 571, tseToIrrigation: 497 },
  { date: '2024-08-05', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 255, totalInfluent: 515, totalWaterProcessed: 574, tseToIrrigation: 500 },
  { date: '2024-08-06', tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 284, totalInfluent: 604, totalWaterProcessed: 643, tseToIrrigation: 554 },
  { date: '2024-08-07', tankerTrips: 19, expectedVolumeTankers: 380, directSewageMB: 110, totalInfluent: 490, totalWaterProcessed: 608, tseToIrrigation: 516 },
  { date: '2024-08-08', tankerTrips: 17, expectedVolumeTankers: 340, directSewageMB: 302, totalInfluent: 642, totalWaterProcessed: 610, tseToIrrigation: 524 },
  { date: '2024-08-09', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 291, totalInfluent: 531, totalWaterProcessed: 630, tseToIrrigation: 550 },
  { date: '2024-08-10', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 265, totalInfluent: 525, totalWaterProcessed: 583, tseToIrrigation: 499 },
  { date: '2024-08-11', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 339, totalInfluent: 559, totalWaterProcessed: 554, tseToIrrigation: 483 },
  { date: '2024-08-12', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 229, totalInfluent: 469, totalWaterProcessed: 606, tseToIrrigation: 531 },
  { date: '2024-08-13', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 219, totalInfluent: 459, totalWaterProcessed: 569, tseToIrrigation: 499 },
  { date: '2024-08-14', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 289, totalInfluent: 509, totalWaterProcessed: 525, tseToIrrigation: 492 },
  { date: '2024-08-15', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 281, totalInfluent: 541, totalWaterProcessed: 579, tseToIrrigation: 502 },
  { date: '2024-08-16', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 328, totalInfluent: 548, totalWaterProcessed: 591, tseToIrrigation: 516 },
  { date: '2024-08-17', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 232, totalInfluent: 512, totalWaterProcessed: 466, tseToIrrigation: 414 },
  { date: '2024-08-18', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 218, totalInfluent: 478, totalWaterProcessed: 591, tseToIrrigation: 516 },
  { date: '2024-08-19', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 210, totalInfluent: 430, totalWaterProcessed: 529, tseToIrrigation: 470 },
  { date: '2024-08-20', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 261, totalInfluent: 521, totalWaterProcessed: 579, tseToIrrigation: 495 },
  { date: '2024-08-21', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 238, totalInfluent: 478, totalWaterProcessed: 586, tseToIrrigation: 500 },
  { date: '2024-08-22', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 292, totalInfluent: 552, totalWaterProcessed: 486, tseToIrrigation: 437 },
  { date: '2024-08-23', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 209, totalInfluent: 449, totalWaterProcessed: 564, tseToIrrigation: 478 },
  { date: '2024-08-24', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 281, totalInfluent: 461, totalWaterProcessed: 581, tseToIrrigation: 505 },
  { date: '2024-08-25', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 209, totalInfluent: 369, totalWaterProcessed: 488, tseToIrrigation: 420 },
  { date: '2024-08-26', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 249, totalInfluent: 409, totalWaterProcessed: 371, tseToIrrigation: 291 },
  { date: '2024-08-27', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 231, totalInfluent: 391, totalWaterProcessed: 453, tseToIrrigation: 417 },
  { date: '2024-08-28', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 355, totalInfluent: 535, totalWaterProcessed: 642, tseToIrrigation: 557 },
  { date: '2024-08-29', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 188, totalInfluent: 368, totalWaterProcessed: 413, tseToIrrigation: 360 },
  { date: '2024-08-30', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 346, totalInfluent: 626, totalWaterProcessed: 624, tseToIrrigation: 551 },
  { date: '2024-08-31', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 285, totalInfluent: 465, totalWaterProcessed: 535, tseToIrrigation: 473 },
  
  // September 2024
  { date: '2024-09-01', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 257, totalInfluent: 477, totalWaterProcessed: 504, tseToIrrigation: 441 },
  { date: '2024-09-02', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 270, totalInfluent: 370, totalWaterProcessed: 355, tseToIrrigation: 317 },
  { date: '2024-09-03', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 261, totalInfluent: 441, totalWaterProcessed: 540, tseToIrrigation: 481 },
  { date: '2024-09-04', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 252, totalInfluent: 332, totalWaterProcessed: 358, tseToIrrigation: 300 },
  { date: '2024-09-05', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 330, totalInfluent: 450, totalWaterProcessed: 547, tseToIrrigation: 483 },
  { date: '2024-09-06', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 209, totalInfluent: 489, totalWaterProcessed: 518, tseToIrrigation: 474 },
  { date: '2024-09-07', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 319, totalInfluent: 559, totalWaterProcessed: 568, tseToIrrigation: 504 },
  { date: '2024-09-08', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 299, totalInfluent: 479, totalWaterProcessed: 478, tseToIrrigation: 422 },
  { date: '2024-09-09', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 283, totalInfluent: 463, totalWaterProcessed: 515, tseToIrrigation: 459 },
  { date: '2024-09-10', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 282, totalInfluent: 422, totalWaterProcessed: 453, tseToIrrigation: 396 },
  { date: '2024-09-11', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 279, totalInfluent: 519, totalWaterProcessed: 566, tseToIrrigation: 495 },
  { date: '2024-09-12', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 257, totalInfluent: 457, totalWaterProcessed: 489, tseToIrrigation: 437 },
  { date: '2024-09-13', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 284, totalInfluent: 564, totalWaterProcessed: 671, tseToIrrigation: 611 },
  { date: '2024-09-14', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 243, totalInfluent: 343, totalWaterProcessed: 357, tseToIrrigation: 311 },
  { date: '2024-09-15', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 208, totalInfluent: 348, totalWaterProcessed: 354, tseToIrrigation: 307 },
  { date: '2024-09-16', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 283, totalInfluent: 443, totalWaterProcessed: 412, tseToIrrigation: 366 },
  { date: '2024-09-17', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 143, totalInfluent: 303, totalWaterProcessed: 352, tseToIrrigation: 314 },
  { date: '2024-09-18', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 220, totalInfluent: 380, totalWaterProcessed: 424, tseToIrrigation: 371 },
  { date: '2024-09-19', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 198, totalInfluent: 378, totalWaterProcessed: 441, tseToIrrigation: 401 },
  { date: '2024-09-20', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 231, totalInfluent: 511, totalWaterProcessed: 581, tseToIrrigation: 519 },
  { date: '2024-09-21', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 254, totalInfluent: 434, totalWaterProcessed: 452, tseToIrrigation: 391 },
  { date: '2024-09-22', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 190, totalInfluent: 370, totalWaterProcessed: 355, tseToIrrigation: 317 },
  { date: '2024-09-23', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 191, totalInfluent: 291, totalWaterProcessed: 292, tseToIrrigation: 262 },
  { date: '2024-09-24', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 302, totalInfluent: 462, totalWaterProcessed: 555, tseToIrrigation: 498 },
  { date: '2024-09-25', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 190, totalInfluent: 390, totalWaterProcessed: 364, tseToIrrigation: 319 },
  { date: '2024-09-26', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 212, totalInfluent: 352, totalWaterProcessed: 386, tseToIrrigation: 342 },
  { date: '2024-09-27', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 269, totalInfluent: 489, totalWaterProcessed: 519, tseToIrrigation: 467 },
  { date: '2024-09-28', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 323, totalInfluent: 483, totalWaterProcessed: 539, tseToIrrigation: 469 },
  { date: '2024-09-29', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 268, totalInfluent: 448, totalWaterProcessed: 557, tseToIrrigation: 503 },
  { date: '2024-09-30', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 304, totalInfluent: 424, totalWaterProcessed: 388, tseToIrrigation: 350 },
  
  // October 2024 - Adding complete data
  { date: '2024-10-01', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 305, totalInfluent: 405, totalWaterProcessed: 482, tseToIrrigation: 417 },
  { date: '2024-10-02', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 273, totalInfluent: 433, totalWaterProcessed: 419, tseToIrrigation: 361 },
  { date: '2024-10-03', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 295, totalInfluent: 475, totalWaterProcessed: 575, tseToIrrigation: 520 },
  { date: '2024-10-04', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 247, totalInfluent: 547, totalWaterProcessed: 602, tseToIrrigation: 506 },
  { date: '2024-10-05', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 362, totalInfluent: 522, totalWaterProcessed: 555, tseToIrrigation: 515 },
  { date: '2024-10-06', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 297, totalInfluent: 457, totalWaterProcessed: 425, tseToIrrigation: 365 },
  { date: '2024-10-07', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 324, totalInfluent: 544, totalWaterProcessed: 592, tseToIrrigation: 533 },
  { date: '2024-10-08', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 269, totalInfluent: 489, totalWaterProcessed: 524, tseToIrrigation: 462 },
  { date: '2024-10-09', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 312, totalInfluent: 532, totalWaterProcessed: 580, tseToIrrigation: 518 },
  { date: '2024-10-10', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 325, totalInfluent: 565, totalWaterProcessed: 610, tseToIrrigation: 545 },
  { date: '2024-10-11', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 347, totalInfluent: 547, totalWaterProcessed: 585, tseToIrrigation: 512 },
  { date: '2024-10-12', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 298, totalInfluent: 558, totalWaterProcessed: 605, tseToIrrigation: 532 },
  { date: '2024-10-13', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 342, totalInfluent: 522, totalWaterProcessed: 570, tseToIrrigation: 495 },
  { date: '2024-10-14', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 337, totalInfluent: 577, totalWaterProcessed: 615, tseToIrrigation: 545 },
  { date: '2024-10-15', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 358, totalInfluent: 578, totalWaterProcessed: 620, tseToIrrigation: 540 },
  { date: '2024-10-16', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 365, totalInfluent: 545, totalWaterProcessed: 585, tseToIrrigation: 505 },
  { date: '2024-10-17', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 375, totalInfluent: 575, totalWaterProcessed: 595, tseToIrrigation: 520 },
  { date: '2024-10-18', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 362, totalInfluent: 582, totalWaterProcessed: 610, tseToIrrigation: 530 },
  { date: '2024-10-19', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 378, totalInfluent: 538, totalWaterProcessed: 575, tseToIrrigation: 495 },
  { date: '2024-10-20', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 362, totalInfluent: 542, totalWaterProcessed: 565, tseToIrrigation: 490 },
  { date: '2024-10-21', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 345, totalInfluent: 485, totalWaterProcessed: 520, tseToIrrigation: 445 },
  { date: '2024-10-22', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 325, totalInfluent: 565, totalWaterProcessed: 595, tseToIrrigation: 515 },
  { date: '2024-10-23', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 332, totalInfluent: 552, totalWaterProcessed: 580, tseToIrrigation: 510 },
  { date: '2024-10-24', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 345, totalInfluent: 525, totalWaterProcessed: 555, tseToIrrigation: 480 },
  { date: '2024-10-25', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 338, totalInfluent: 538, totalWaterProcessed: 570, tseToIrrigation: 495 },
  { date: '2024-10-26', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 352, totalInfluent: 512, totalWaterProcessed: 545, tseToIrrigation: 470 },
  { date: '2024-10-27', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 365, totalInfluent: 505, totalWaterProcessed: 530, tseToIrrigation: 460 },
  { date: '2024-10-28', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 342, totalInfluent: 562, totalWaterProcessed: 590, tseToIrrigation: 515 },
  { date: '2024-10-29', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 328, totalInfluent: 528, totalWaterProcessed: 560, tseToIrrigation: 485 },
  { date: '2024-10-30', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 337, totalInfluent: 517, totalWaterProcessed: 550, tseToIrrigation: 475 },
  { date: '2024-10-31', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 348, totalInfluent: 508, totalWaterProcessed: 535, tseToIrrigation: 460 },
  
  // November 2024
  { date: '2024-11-01', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 325, totalInfluent: 505, totalWaterProcessed: 545, tseToIrrigation: 470 },
  { date: '2024-11-02', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 332, totalInfluent: 492, totalWaterProcessed: 535, tseToIrrigation: 460 },
  { date: '2024-11-03', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 342, totalInfluent: 482, totalWaterProcessed: 520, tseToIrrigation: 445 },
  { date: '2024-11-04', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 318, totalInfluent: 518, totalWaterProcessed: 560, tseToIrrigation: 480 },
  { date: '2024-11-05', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 335, totalInfluent: 495, totalWaterProcessed: 535, tseToIrrigation: 460 },
  { date: '2024-11-06', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 328, totalInfluent: 508, totalWaterProcessed: 550, tseToIrrigation: 475 },
  { date: '2024-11-07', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 345, totalInfluent: 485, totalWaterProcessed: 525, tseToIrrigation: 450 },
  { date: '2024-11-08', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 320, totalInfluent: 520, totalWaterProcessed: 565, tseToIrrigation: 485 },
  { date: '2024-11-09', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 330, totalInfluent: 490, totalWaterProcessed: 530, tseToIrrigation: 455 },
  { date: '2024-11-10', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 335, totalInfluent: 475, totalWaterProcessed: 515, tseToIrrigation: 440 },
  { date: '2024-11-11', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 315, totalInfluent: 495, totalWaterProcessed: 540, tseToIrrigation: 465 },
  { date: '2024-11-12', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 325, totalInfluent: 485, totalWaterProcessed: 525, tseToIrrigation: 450 },
  { date: '2024-11-13', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 340, totalInfluent: 480, totalWaterProcessed: 520, tseToIrrigation: 445 },
  { date: '2024-11-14', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 325, totalInfluent: 505, totalWaterProcessed: 550, tseToIrrigation: 475 },
  { date: '2024-11-15', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 330, totalInfluent: 490, totalWaterProcessed: 530, tseToIrrigation: 455 },
  { date: '2024-11-16', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 335, totalInfluent: 475, totalWaterProcessed: 515, tseToIrrigation: 440 },
  { date: '2024-11-17', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 315, totalInfluent: 495, totalWaterProcessed: 540, tseToIrrigation: 465 },
  { date: '2024-11-18', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 325, totalInfluent: 485, totalWaterProcessed: 525, tseToIrrigation: 450 },
  { date: '2024-11-19', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 340, totalInfluent: 480, totalWaterProcessed: 520, tseToIrrigation: 445 },
  { date: '2024-11-20', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 325, totalInfluent: 505, totalWaterProcessed: 550, tseToIrrigation: 475 },
  { date: '2024-11-21', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 330, totalInfluent: 490, totalWaterProcessed: 530, tseToIrrigation: 455 },
  { date: '2024-11-22', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 335, totalInfluent: 475, totalWaterProcessed: 515, tseToIrrigation: 440 },
  { date: '2024-11-23', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 325, totalInfluent: 485, totalWaterProcessed: 525, tseToIrrigation: 450 },
  { date: '2024-11-24', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 345, totalInfluent: 465, totalWaterProcessed: 505, tseToIrrigation: 430 },
  { date: '2024-11-25', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 325, totalInfluent: 485, totalWaterProcessed: 525, tseToIrrigation: 450 },
  { date: '2024-11-26', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 335, totalInfluent: 475, totalWaterProcessed: 515, tseToIrrigation: 440 },
  { date: '2024-11-27', tankerTrips: 9, expectedVolumeTankers: 180, directSewageMB: 315, totalInfluent: 495, totalWaterProcessed: 540, tseToIrrigation: 465 },
  { date: '2024-11-28', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 345, totalInfluent: 465, totalWaterProcessed: 505, tseToIrrigation: 430 },
  { date: '2024-11-29', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 325, totalInfluent: 485, totalWaterProcessed: 525, tseToIrrigation: 450 },
  { date: '2024-11-30', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 335, totalInfluent: 475, totalWaterProcessed: 515, tseToIrrigation: 440 },
  
  // December 2024
  { date: '2024-12-01', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 485 },
  { date: '2024-12-02', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 495 },
  { date: '2024-12-03', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 385, totalInfluent: 505, totalWaterProcessed: 580, tseToIrrigation: 490 },
  { date: '2024-12-04', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 505 },
  { date: '2024-12-05', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 490 },
  { date: '2024-12-06', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 485 },
  { date: '2024-12-07', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 495 },
  { date: '2024-12-08', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 385, totalInfluent: 505, totalWaterProcessed: 580, tseToIrrigation: 490 },
  { date: '2024-12-09', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 505 },
  { date: '2024-12-10', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 490 },
  { date: '2024-12-11', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 485 },
  { date: '2024-12-12', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 495 },
  { date: '2024-12-13', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 385, totalInfluent: 505, totalWaterProcessed: 580, tseToIrrigation: 490 },
  { date: '2024-12-14', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 505 },
  { date: '2024-12-15', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 490 },
  { date: '2024-12-16', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 485 },
  { date: '2024-12-17', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 495 },
  { date: '2024-12-18', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 385, totalInfluent: 505, totalWaterProcessed: 580, tseToIrrigation: 490 },
  { date: '2024-12-19', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 505 },
  { date: '2024-12-20', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 490 },
  { date: '2024-12-21', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 485 },
  { date: '2024-12-22', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 390, totalInfluent: 490, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2024-12-23', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 385, totalInfluent: 505, totalWaterProcessed: 580, tseToIrrigation: 490 },
  { date: '2024-12-24', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 390, totalInfluent: 490, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2024-12-25', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 395, totalInfluent: 475, totalWaterProcessed: 545, tseToIrrigation: 460 },
  { date: '2024-12-26', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 390, totalInfluent: 490, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2024-12-27', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 385, totalInfluent: 505, totalWaterProcessed: 580, tseToIrrigation: 490 },
  { date: '2024-12-28', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 390, totalInfluent: 490, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2024-12-29', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 395, totalInfluent: 475, totalWaterProcessed: 545, tseToIrrigation: 460 },
  { date: '2024-12-30', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 390, totalInfluent: 490, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2024-12-31', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 385, totalInfluent: 505, totalWaterProcessed: 580, tseToIrrigation: 490 },
  
  // January 2025
  { date: '2025-01-01', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 500 },
  { date: '2025-01-02', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-03', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 510 },
  { date: '2025-01-04', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 495 },
  { date: '2025-01-05', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-06', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 500 },
  { date: '2025-01-07', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 510 },
  { date: '2025-01-08', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 495 },
  { date: '2025-01-09', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-10', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 500 },
  { date: '2025-01-11', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-12', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 510 },
  { date: '2025-01-13', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 495 },
  { date: '2025-01-14', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-15', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 500 },
  { date: '2025-01-16', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 510 },
  { date: '2025-01-17', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 495 },
  { date: '2025-01-18', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-19', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 500 },
  { date: '2025-01-20', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-21', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 510 },
  { date: '2025-01-22', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 495 },
  { date: '2025-01-23', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-24', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 500 },
  { date: '2025-01-25', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-26', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-27', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 375, totalInfluent: 515, totalWaterProcessed: 590, tseToIrrigation: 500 },
  { date: '2025-01-28', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  { date: '2025-01-29', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 365, totalInfluent: 525, totalWaterProcessed: 600, tseToIrrigation: 510 },
  { date: '2025-01-30', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 370, totalInfluent: 510, totalWaterProcessed: 585, tseToIrrigation: 495 },
  { date: '2025-01-31', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 380, totalInfluent: 500, totalWaterProcessed: 575, tseToIrrigation: 490 },
  
  // February 2025
  { date: '2025-02-01', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-02', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-03', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-04', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-05', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-06', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-07', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-08', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-09', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-10', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-11', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-12', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-13', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-14', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-15', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-16', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-17', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-18', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-19', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-20', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-21', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-22', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-23', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-24', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-25', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-26', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  { date: '2025-02-27', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 385, totalInfluent: 485, totalWaterProcessed: 560, tseToIrrigation: 475 },
  { date: '2025-02-28', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 390, totalInfluent: 470, totalWaterProcessed: 540, tseToIrrigation: 455 },
  
  // March 2025 - Adding the new data you provided
  { date: '2025-03-01', tankerTrips: 0, expectedVolumeTankers: 0, directSewageMB: 487, totalInfluent: 487, totalWaterProcessed: 583, tseToIrrigation: 476 },
  { date: '2025-03-02', tankerTrips: 1, expectedVolumeTankers: 20, directSewageMB: 473, totalInfluent: 493, totalWaterProcessed: 592, tseToIrrigation: 514 },
  { date: '2025-03-03', tankerTrips: 1, expectedVolumeTankers: 20, directSewageMB: 477, totalInfluent: 497, totalWaterProcessed: 598, tseToIrrigation: 517 },
  { date: '2025-03-04', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 461, totalInfluent: 561, totalWaterProcessed: 600, tseToIrrigation: 516 },
  { date: '2025-03-05', tankerTrips: 3, expectedVolumeTankers: 60, directSewageMB: 443, totalInfluent: 503, totalWaterProcessed: 608, tseToIrrigation: 521 },
  { date: '2025-03-06', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 424, totalInfluent: 544, totalWaterProcessed: 607, tseToIrrigation: 530 },
  { date: '2025-03-07', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 452, totalInfluent: 552, totalWaterProcessed: 621, tseToIrrigation: 532 },
  { date: '2025-03-08', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 450, totalInfluent: 570, totalWaterProcessed: 617, tseToIrrigation: 531 },
  { date: '2025-03-09', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 388, totalInfluent: 468, totalWaterProcessed: 607, tseToIrrigation: 521 },
  { date: '2025-03-10', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 480, totalInfluent: 600, totalWaterProcessed: 610, tseToIrrigation: 524 },
  { date: '2025-03-11', tankerTrips: 3, expectedVolumeTankers: 60, directSewageMB: 476, totalInfluent: 536, totalWaterProcessed: 607, tseToIrrigation: 511 },
  { date: '2025-03-12', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 391, totalInfluent: 511, totalWaterProcessed: 601, tseToIrrigation: 509 },
  { date: '2025-03-13', tankerTrips: 3, expectedVolumeTankers: 60, directSewageMB: 472, totalInfluent: 532, totalWaterProcessed: 606, tseToIrrigation: 508 },
  { date: '2025-03-14', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 399, totalInfluent: 519, totalWaterProcessed: 609, tseToIrrigation: 507 },
  { date: '2025-03-15', tankerTrips: 2, expectedVolumeTankers: 40, directSewageMB: 494, totalInfluent: 534, totalWaterProcessed: 602, tseToIrrigation: 504 },
  { date: '2025-03-16', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 434, totalInfluent: 514, totalWaterProcessed: 591, tseToIrrigation: 494 },
  { date: '2025-03-17', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 442, totalInfluent: 522, totalWaterProcessed: 591, tseToIrrigation: 500 },
  { date: '2025-03-18', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 369, totalInfluent: 469, totalWaterProcessed: 578, tseToIrrigation: 480 },
  { date: '2025-03-19', tankerTrips: 3, expectedVolumeTankers: 60, directSewageMB: 466, totalInfluent: 526, totalWaterProcessed: 565, tseToIrrigation: 467 },
  { date: '2025-03-20', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 424, totalInfluent: 504, totalWaterProcessed: 610, tseToIrrigation: 511 },
  { date: '2025-03-21', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 425, totalInfluent: 505, totalWaterProcessed: 619, tseToIrrigation: 519 },
  { date: '2025-03-22', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 435, totalInfluent: 535, totalWaterProcessed: 616, tseToIrrigation: 523 },
  { date: '2025-03-23', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 466, totalInfluent: 586, totalWaterProcessed: 627, tseToIrrigation: 541 },
  { date: '2025-03-24', tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 422, totalInfluent: 542, totalWaterProcessed: 630, tseToIrrigation: 540 },
  { date: '2025-03-25', tankerTrips: 5, expectedVolumeTankers: 100, directSewageMB: 488, totalInfluent: 588, totalWaterProcessed: 613, tseToIrrigation: 522 },
  { date: '2025-03-26', tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 353, totalInfluent: 513, totalWaterProcessed: 631, tseToIrrigation: 541 },
  { date: '2025-03-27', tankerTrips: 7, expectedVolumeTankers: 140, directSewageMB: 513, totalInfluent: 653, totalWaterProcessed: 627, tseToIrrigation: 538 },
  { date: '2025-03-28', tankerTrips: 3, expectedVolumeTankers: 60, directSewageMB: 478, totalInfluent: 538, totalWaterProcessed: 631, tseToIrrigation: 546 },
  { date: '2025-03-29', tankerTrips: 4, expectedVolumeTankers: 80, directSewageMB: 559, totalInfluent: 639, totalWaterProcessed: 623, tseToIrrigation: 534 },
  { date: '2025-03-30', tankerTrips: 3, expectedVolumeTankers: 60, directSewageMB: 471, totalInfluent: 531, totalWaterProcessed: 640, tseToIrrigation: 558 },
  { date: '2025-03-31', tankerTrips: 3, expectedVolumeTankers: 60, directSewageMB: 471, totalInfluent: 531, totalWaterProcessed: 640, tseToIrrigation: 558 }
];

// Utility functions
export const formatMonth = (month: string): string => {
  try {
    const date = month.includes('-') ? parseISO(month) : parse(month, 'yyyy-MM', new Date());
    if (!isValid(date)) {
      return month;
    }
    return format(date, 'MMMM yyyy');
  } catch (e) {
    console.error('Error formatting month:', e);
    return month;
  }
};

export const getDailyDataForMonth = (selectedMonth: string): STPDailyData[] => {
  return stpDailyData.filter(data => data.date.startsWith(selectedMonth));
};

export const calculateProcessingMetrics = (data: STPDailyData[]): ProcessingMetrics => {
  if (data.length === 0) {
    return {
      processingEfficiency: 0,
      irrigationUtilization: 0,
      directSewagePercentage: 0,
      tankerPercentage: 0
    };
  }

  const totalInfluent = data.reduce((sum, record) => sum + record.totalInfluent, 0);
  const totalWaterProcessed = data.reduce((sum, record) => sum + record.totalWaterProcessed, 0);
  const totalTSEIrrigation = data.reduce((sum, record) => sum + record.tseToIrrigation, 0);
  const totalDirectSewage = data.reduce((sum, record) => sum + record.directSewageMB, 0);
  const totalTankerVolume = data.reduce((sum, record) => sum + record.expectedVolumeTankers, 0);

  return {
    processingEfficiency: totalInfluent > 0 ? (totalWaterProcessed / totalInfluent) * 100 : 0,
    irrigationUtilization: totalWaterProcessed > 0 ? (totalTSEIrrigation / totalWaterProcessed) * 100 : 0,
    directSewagePercentage: totalInfluent > 0 ? (totalDirectSewage / totalInfluent) * 100 : 0,
    tankerPercentage: totalInfluent > 0 ? (totalTankerVolume / totalInfluent) * 100 : 0
  };
};

export const getMonthlyDataByMonth = (selectedMonth: string): STPMonthlyData | undefined => {
  return stpMonthlyData.find(data => data.month === selectedMonth);
};

export const getAverageValues = (dailyData: STPDailyData[]): { [key: string]: number } => {
  if (dailyData.length === 0) {
    return {
      avgTankerTrips: 0,
      avgExpectedVolumeTankers: 0,
      avgDirectSewageMB: 0,
      avgTotalInfluent: 0,
      avgTotalWaterProcessed: 0,
      avgTSEToIrrigation: 0
    };
  }

  const sum = dailyData.reduce(
    (acc, record) => {
      return {
        tankerTrips: acc.tankerTrips + record.tankerTrips,
        expectedVolumeTankers: acc.expectedVolumeTankers + record.expectedVolumeTankers,
        directSewageMB: acc.directSewageMB + record.directSewageMB,
        totalInfluent: acc.totalInfluent + record.totalInfluent,
        totalWaterProcessed: acc.totalWaterProcessed + record.totalWaterProcessed,
        tseToIrrigation: acc.tseToIrrigation + record.tseToIrrigation
      };
    },
    {
      tankerTrips: 0,
      expectedVolumeTankers: 0,
      directSewageMB: 0,
      totalInfluent: 0,
      totalWaterProcessed: 0,
      tseToIrrigation: 0
    }
  );

  return {
    avgTankerTrips: sum.tankerTrips / dailyData.length,
    avgExpectedVolumeTankers: sum.expectedVolumeTankers / dailyData.length,
    avgDirectSewageMB: sum.directSewageMB / dailyData.length,
    avgTotalInfluent: sum.totalInfluent / dailyData.length,
    avgTotalWaterProcessed: sum.totalWaterProcessed / dailyData.length,
    avgTSEToIrrigation: sum.tseToIrrigation / dailyData.length
  };
};
