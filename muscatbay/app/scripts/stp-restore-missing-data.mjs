#!/usr/bin/env node
/**
 * STP Data Restore Script
 * Syncs Airtable data (Jul 2024 - Jun 2025) and applies migration file data
 * (Nov-Dec 2025, Jan 2026, Feb 2026) to Supabase stp_operations table.
 */

const SUPABASE_URL = 'https://utnlgeuqajmwibqmdmgt.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bmxnZXVxYWptd2licW1kbWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc4NTMwMCwiZXhwIjoyMDgxMzYxMzAwfQ.TB5XyjaJOY2BM8NWxmBULtBGwxFEa_BEj5jWGP8OpS0';

// Helper: convert DD/MM/YYYY → YYYY-MM-DD
function cvt(s) {
  const [d, m, y] = s.split('/');
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}

// ─────────────────────────────────────────────
// AIRTABLE DATA: Jul 2024 – Jun 2025
// Fields: d=date(DD/MM/YYYY), i=inlet_sewage, t=tse_for_irrigation, k=tanker_trips
// ─────────────────────────────────────────────
const airtableRaw = [
  // July 2024
  {d:"01/07/2024",i:339,t:340,k:10},{d:"03/07/2024",i:468,t:425,k:13},{d:"09/07/2024",i:532,t:519,k:13},
  {d:"10/07/2024",i:493,t:462,k:12},{d:"12/07/2024",i:578,t:580,k:16},{d:"13/07/2024",i:479,t:402,k:10},
  {d:"14/07/2024",i:486,t:448,k:13},{d:"15/07/2024",i:391,t:418,k:6},{d:"16/07/2024",i:576,t:600,k:18},
  {d:"17/07/2024",i:506,t:300,k:12},{d:"18/07/2024",i:369,t:517,k:8},{d:"19/07/2024",i:614,t:605,k:15},
  {d:"20/07/2024",i:483,t:465,k:12},{d:"21/07/2024",i:501,t:455,k:13},{d:"22/07/2024",i:480,t:492,k:13},
  {d:"23/07/2024",i:568,t:535,k:16},{d:"24/07/2024",i:563,t:528,k:18},{d:"25/07/2024",i:415,t:444,k:14},
  {d:"26/07/2024",i:584,t:570,k:18},{d:"27/07/2024",i:537,t:414,k:10},{d:"28/07/2024",i:453,t:449,k:12},
  {d:"29/07/2024",i:685,t:577,k:19},{d:"30/07/2024",i:527,t:582,k:13},{d:"31/07/2024",i:606,t:529,k:17},
  // August 2024
  {d:"01/08/2024",i:542,t:528,k:15},{d:"02/08/2024",i:660,t:590,k:15},{d:"05/08/2024",i:515,t:500,k:13},
  {d:"09/08/2024",i:531,t:550,k:12},{d:"10/08/2024",i:525,t:499,k:13},{d:"11/08/2024",i:559,t:483,k:11},
  {d:"12/08/2024",i:469,t:531,k:12},{d:"13/08/2024",i:459,t:499,k:12},{d:"14/08/2024",i:509,t:492,k:11},
  {d:"15/08/2024",i:541,t:502,k:13},{d:"16/08/2024",i:548,t:516,k:11},{d:"17/08/2024",i:512,t:414,k:14},
  {d:"18/08/2024",i:478,t:516,k:13},{d:"19/08/2024",i:430,t:470,k:11},{d:"20/08/2024",i:521,t:495,k:13},
  {d:"21/08/2024",i:478,t:500,k:12},{d:"22/08/2024",i:552,t:437,k:13},{d:"23/08/2024",i:449,t:478,k:12},
  {d:"24/08/2024",i:461,t:505,k:9},{d:"25/08/2024",i:369,t:420,k:8},{d:"26/08/2024",i:409,t:291,k:8},
  {d:"27/08/2024",i:391,t:417,k:8},{d:"28/08/2024",i:535,t:557,k:9},{d:"29/08/2024",i:368,t:360,k:9},
  {d:"30/08/2024",i:626,t:551,k:14},{d:"31/08/2024",i:465,t:473,k:9},
  // September 2024
  {d:"01/09/2024",i:477,t:441,k:11},{d:"09/09/2024",i:463,t:459,k:9},{d:"10/09/2024",i:422,t:396,k:7},
  {d:"11/09/2024",i:519,t:495,k:12},{d:"12/09/2024",i:457,t:437,k:10},{d:"13/09/2024",i:564,t:611,k:14},
  {d:"14/09/2024",i:343,t:311,k:5},{d:"15/09/2024",i:348,t:307,k:7},{d:"16/09/2024",i:443,t:366,k:8},
  {d:"17/09/2024",i:303,t:314,k:8},{d:"18/09/2024",i:380,t:371,k:8},{d:"19/09/2024",i:378,t:401,k:9},
  {d:"20/09/2024",i:511,t:519,k:14},{d:"21/09/2024",i:434,t:391,k:9},{d:"22/09/2024",i:370,t:317,k:9},
  {d:"23/09/2024",i:291,t:262,k:5},{d:"24/09/2024",i:462,t:498,k:8},{d:"25/09/2024",i:390,t:319,k:10},
  {d:"26/09/2024",i:352,t:342,k:7},{d:"27/09/2024",i:489,t:467,k:11},{d:"28/09/2024",i:483,t:469,k:8},
  {d:"29/09/2024",i:448,t:503,k:9},{d:"30/09/2024",i:424,t:350,k:6},
  // October 2024
  {d:"01/10/2024",i:405,t:417,k:5},{d:"09/10/2024",i:532,t:568,k:11},{d:"10/10/2024",i:494,t:491,k:11},
  {d:"11/10/2024",i:549,t:438,k:12},{d:"12/10/2024",i:511,t:512,k:8},{d:"13/10/2024",i:332,t:345,k:6},
  {d:"14/10/2024",i:509,t:548,k:7},{d:"15/10/2024",i:581,t:489,k:10},{d:"16/10/2024",i:548,t:538,k:8},
  {d:"17/10/2024",i:636,t:575,k:11},{d:"18/10/2024",i:565,t:597,k:10},{d:"19/10/2024",i:589,t:509,k:8},
  {d:"20/10/2024",i:537,t:542,k:10},{d:"21/10/2024",i:539,t:513,k:12},{d:"22/10/2024",i:525,t:528,k:9},
  {d:"23/10/2024",i:592,t:532,k:11},{d:"24/10/2024",i:546,t:442,k:11},{d:"25/10/2024",i:603,t:524,k:9},
  {d:"26/10/2024",i:588,t:557,k:12},{d:"27/10/2024",i:523,t:487,k:6},{d:"28/10/2024",i:595,t:535,k:9},
  {d:"29/10/2024",i:511,t:535,k:7},{d:"30/10/2024",i:543,t:506,k:9},{d:"31/10/2024",i:577,t:500,k:7},
  // November 2024
  {d:"03/11/2024",i:498,t:419,k:8},{d:"09/11/2024",i:517,t:500,k:13},{d:"10/11/2024",i:464,t:495,k:6},
  {d:"11/11/2024",i:449,t:505,k:11},{d:"12/11/2024",i:466,t:494,k:8},{d:"13/11/2024",i:546,t:495,k:8},
  {d:"14/11/2024",i:504,t:484,k:9},{d:"15/11/2024",i:489,t:488,k:6},{d:"16/11/2024",i:520,t:474,k:9},
  {d:"17/11/2024",i:461,t:363,k:5},{d:"18/11/2024",i:475,t:466,k:10},{d:"19/11/2024",i:479,t:484,k:8},
  {d:"20/11/2024",i:465,t:494,k:6},{d:"21/11/2024",i:478,t:461,k:6},{d:"22/11/2024",i:494,t:488,k:7},
  {d:"23/11/2024",i:417,t:427,k:7},{d:"24/11/2024",i:387,t:434,k:4},{d:"25/11/2024",i:560,t:474,k:8},
  {d:"26/11/2024",i:501,t:471,k:10},{d:"27/11/2024",i:524,t:447,k:9},{d:"28/11/2024",i:487,t:456,k:7},
  {d:"29/11/2024",i:403,t:464,k:6},{d:"30/11/2024",i:520,t:427,k:6},
  // December 2024
  {d:"01/12/2024",i:481,t:447,k:5},{d:"05/12/2024",i:595,t:455,k:9},{d:"06/12/2024",i:437,t:403,k:4},
  {d:"09/12/2024",i:429,t:450,k:6},{d:"10/12/2024",i:453,t:412,k:8},{d:"11/12/2024",i:496,t:501,k:5},
  {d:"12/12/2024",i:441,t:461,k:5},{d:"13/12/2024",i:441,t:439,k:8},{d:"14/12/2024",i:506,t:515,k:8},
  {d:"15/12/2024",i:501,t:414,k:7},{d:"16/12/2024",i:438,t:468,k:6},{d:"17/12/2024",i:553,t:476,k:9},
  {d:"18/12/2024",i:496,t:498,k:7},{d:"19/12/2024",i:542,t:471,k:8},{d:"20/12/2024",i:440,t:488,k:8},
  {d:"21/12/2024",i:502,t:475,k:6},{d:"22/12/2024",i:536,t:513,k:7},{d:"23/12/2024",i:448,t:497,k:7},
  {d:"24/12/2024",i:526,t:449,k:4},{d:"25/12/2024",i:517,t:513,k:6},{d:"26/12/2024",i:531,t:495,k:8},
  {d:"27/12/2024",i:542,t:517,k:5},{d:"28/12/2024",i:541,t:524,k:7},{d:"29/12/2024",i:528,t:511,k:7},
  {d:"30/12/2024",i:525,t:509,k:7},{d:"31/12/2024",i:535,t:506,k:4},
  // January 2025
  {d:"01/01/2025",i:436,t:459,k:3},{d:"03/01/2025",i:450,t:494,k:4},{d:"07/01/2025",i:549,t:506,k:7},
  {d:"10/01/2025",i:535,t:528,k:8},{d:"11/01/2025",i:436,t:459,k:3},{d:"12/01/2025",i:473,t:419,k:6},
  {d:"13/01/2025",i:456,t:489,k:6},{d:"14/01/2025",i:513,t:502,k:8},{d:"15/01/2025",i:494,t:504,k:8},
  {d:"16/01/2025",i:509,t:438,k:10},{d:"17/01/2025",i:502,t:518,k:7},{d:"18/01/2025",i:537,t:526,k:8},
  {d:"19/01/2025",i:560,t:523,k:8},{d:"20/01/2025",i:517,t:503,k:8},{d:"21/01/2025",i:552,t:517,k:8},
  {d:"22/01/2025",i:482,t:498,k:6},{d:"23/01/2025",i:477,t:526,k:6},{d:"24/01/2025",i:504,t:499,k:7},
  {d:"25/01/2025",i:543,t:523,k:8},{d:"26/01/2025",i:509,t:516,k:8},{d:"27/01/2025",i:519,t:515,k:8},
  {d:"28/01/2025",i:582,t:519,k:11},{d:"29/01/2025",i:521,t:529,k:9},{d:"30/01/2025",i:519,t:510,k:9},
  {d:"31/01/2025",i:513,t:526,k:7},
  // February 2025
  {d:"01/02/2025",i:511,t:456,k:8},{d:"09/02/2025",i:521,t:489,k:9},{d:"10/02/2025",i:514,t:495,k:6},
  {d:"11/02/2025",i:546,t:501,k:7},{d:"12/02/2025",i:528,t:527,k:5},{d:"13/02/2025",i:503,t:525,k:4},
  {d:"14/02/2025",i:554,t:527,k:4},{d:"15/02/2025",i:538,t:533,k:4},{d:"16/02/2025",i:561,t:539,k:5},
  {d:"17/02/2025",i:544,t:539,k:5},{d:"18/02/2025",i:517,t:520,k:5},{d:"19/02/2025",i:539,t:489,k:4},
  {d:"20/02/2025",i:482,t:459,k:2},{d:"21/02/2025",i:478,t:419,k:1},{d:"24/02/2025",i:491,t:361,k:0},
  {d:"25/02/2025",i:334,t:159,k:0},{d:"26/02/2025",i:342,t:226,k:0},{d:"27/02/2025",i:502,t:512,k:0},
  {d:"28/02/2025",i:498,t:468,k:2},
  // March 2025
  {d:"01/03/2025",i:487,t:476,k:0},{d:"03/03/2025",i:497,t:517,k:1},{d:"09/03/2025",i:468,t:521,k:4},
  {d:"10/03/2025",i:600,t:524,k:6},{d:"11/03/2025",i:536,t:511,k:3},{d:"12/03/2025",i:511,t:509,k:6},
  {d:"13/03/2025",i:532,t:508,k:3},{d:"14/03/2025",i:519,t:507,k:6},{d:"15/03/2025",i:534,t:504,k:2},
  {d:"16/03/2025",i:514,t:494,k:4},{d:"17/03/2025",i:522,t:500,k:4},{d:"18/03/2025",i:469,t:480,k:5},
  {d:"19/03/2025",i:526,t:467,k:3},{d:"20/03/2025",i:504,t:511,k:4},{d:"21/03/2025",i:505,t:519,k:4},
  {d:"22/03/2025",i:535,t:523,k:5},{d:"23/03/2025",i:586,t:541,k:6},{d:"24/03/2025",i:542,t:540,k:6},
  {d:"25/03/2025",i:588,t:522,k:5},{d:"26/03/2025",i:513,t:541,k:8},{d:"27/03/2025",i:653,t:538,k:7},
  {d:"28/03/2025",i:538,t:546,k:3},{d:"29/03/2025",i:639,t:534,k:4},{d:"30/03/2025",i:531,t:558,k:3},
  {d:"31/03/2025",i:531,t:558,k:3},
  // April 2025
  {d:"07/04/2025",i:550,t:574,k:7},{d:"09/04/2025",i:578,t:568,k:5},{d:"10/04/2025",i:617,t:558,k:6},
  {d:"11/04/2025",i:576,t:582,k:6},{d:"12/04/2025",i:620,t:576,k:8},{d:"13/04/2025",i:617,t:595,k:5},
  {d:"14/04/2025",i:601,t:592,k:8},{d:"15/04/2025",i:561,t:557,k:7},{d:"16/04/2025",i:643,t:590,k:8},
  {d:"17/04/2025",i:564,t:581,k:6},{d:"18/04/2025",i:589,t:577,k:7},{d:"19/04/2025",i:606,t:563,k:8},
  {d:"20/04/2025",i:654,t:553,k:7},{d:"21/04/2025",i:524,t:524,k:6},{d:"22/04/2025",i:585,t:565,k:3},
  {d:"23/04/2025",i:589,t:578,k:5},{d:"24/04/2025",i:606,t:594,k:6},{d:"25/04/2025",i:598,t:609,k:6},
  {d:"26/04/2025",i:638,t:584,k:6},{d:"27/04/2025",i:580,t:603,k:5},{d:"28/04/2025",i:573,t:607,k:5},
  {d:"29/04/2025",i:624,t:602,k:9},{d:"30/04/2025",i:642,t:646,k:9},
  // May 2025
  {d:"02/05/2025",i:691,t:626,k:11},{d:"03/05/2025",i:676,t:608,k:9},{d:"09/05/2025",i:655,t:592,k:10},
  {d:"10/05/2025",i:663,t:630,k:10},{d:"11/05/2025",i:624,t:646,k:8},{d:"12/05/2025",i:669,t:645,k:9},
  {d:"13/05/2025",i:646,t:592,k:9},{d:"14/05/2025",i:687,t:647,k:11},{d:"15/05/2025",i:632,t:626,k:10},
  {d:"16/05/2025",i:659,t:646,k:9},{d:"17/05/2025",i:690,t:642,k:8},{d:"18/05/2025",i:657,t:585,k:10},
  {d:"19/05/2025",i:603,t:579,k:10},{d:"20/05/2025",i:641,t:605,k:8},{d:"21/05/2025",i:644,t:620,k:8},
  {d:"22/05/2025",i:606,t:589,k:7},{d:"23/05/2025",i:601,t:581,k:5},{d:"24/05/2025",i:576,t:584,k:4},
  {d:"25/05/2025",i:640,t:653,k:4},{d:"26/05/2025",i:591,t:606,k:5},{d:"27/05/2025",i:613,t:613,k:7},
  {d:"28/05/2025",i:602,t:602,k:8},{d:"29/05/2025",i:638,t:604,k:8},{d:"30/05/2025",i:563,t:609,k:7},
  {d:"31/05/2025",i:567,t:607,k:8},
  // June 2025
  {d:"09/06/2025",i:596,t:564,k:11},{d:"10/06/2025",i:548,t:508,k:10},{d:"11/06/2025",i:592,t:549,k:11},
  {d:"12/06/2025",i:590,t:520,k:11},{d:"13/06/2025",i:497,t:485,k:11},{d:"14/06/2025",i:419,t:497,k:10},
  {d:"15/06/2025",i:430,t:454,k:11},{d:"16/06/2025",i:432,t:380,k:8},{d:"17/06/2025",i:530,t:493,k:14},
  {d:"18/06/2025",i:559,t:514,k:14},{d:"19/06/2025",i:491,t:512,k:11},{d:"20/06/2025",i:530,t:519,k:12},
  {d:"21/06/2025",i:541,t:492,k:12},{d:"22/06/2025",i:564,t:534,k:13},{d:"23/06/2025",i:507,t:524,k:12},
  {d:"24/06/2025",i:493,t:469,k:12},{d:"25/06/2025",i:535,t:497,k:13},{d:"26/06/2025",i:536,t:526,k:12},
  {d:"27/06/2025",i:530,t:513,k:12},{d:"28/06/2025",i:579,t:529,k:13},{d:"29/06/2025",i:573,t:568,k:13},
  {d:"30/06/2025",i:578,t:546,k:13},
];

// Deduplicate by date, keep first occurrence
const seen = new Map();
for (const r of airtableRaw) {
  const iso = cvt(r.d);
  if (!seen.has(iso)) {
    seen.set(iso, { date: iso, inlet_sewage: r.i, tse_for_irrigation: r.t, tanker_trips: r.k });
  }
}
const airtableRecords = Array.from(seen.values());

// ─────────────────────────────────────────────
// MIGRATION FILE DATA: Nov-Dec 2025, Jan 2026, Feb 2026
// ─────────────────────────────────────────────
// Note: Nov 2025, Dec 2025, Jan 2026 have inlet_sewage = tanker_trips * 20 (tanker-only volume)
// Feb 2026 has correct actual inlet_sewage values
const migrationRecords = [
  // November 2025
  {date:"2025-11-01",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:449},
  {date:"2025-11-02",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:418},
  {date:"2025-11-03",tanker_trips:17,inlet_sewage:340,tse_for_irrigation:423},
  {date:"2025-11-04",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:366},
  {date:"2025-11-05",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:449},
  {date:"2025-11-06",tanker_trips:20,inlet_sewage:400,tse_for_irrigation:362},
  {date:"2025-11-07",tanker_trips:16,inlet_sewage:320,tse_for_irrigation:344},
  {date:"2025-11-08",tanker_trips:7,inlet_sewage:140,tse_for_irrigation:390},
  {date:"2025-11-09",tanker_trips:15,inlet_sewage:300,tse_for_irrigation:363},
  {date:"2025-11-10",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:419},
  {date:"2025-11-11",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:331},
  {date:"2025-11-12",tanker_trips:15,inlet_sewage:300,tse_for_irrigation:369},
  {date:"2025-11-13",tanker_trips:16,inlet_sewage:320,tse_for_irrigation:-320},
  {date:"2025-11-14",tanker_trips:18,inlet_sewage:360,tse_for_irrigation:367},
  {date:"2025-11-15",tanker_trips:16,inlet_sewage:320,tse_for_irrigation:454},
  {date:"2025-11-16",tanker_trips:15,inlet_sewage:300,tse_for_irrigation:420},
  {date:"2025-11-17",tanker_trips:11,inlet_sewage:220,tse_for_irrigation:501},
  {date:"2025-11-18",tanker_trips:15,inlet_sewage:300,tse_for_irrigation:467},
  {date:"2025-11-19",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:499},
  {date:"2025-11-20",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:448},
  {date:"2025-11-21",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:505},
  {date:"2025-11-22",tanker_trips:9,inlet_sewage:180,tse_for_irrigation:469},
  {date:"2025-11-24",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:465},
  {date:"2025-11-26",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:474},
  {date:"2025-11-27",tanker_trips:5,inlet_sewage:100,tse_for_irrigation:447},
  {date:"2025-11-28",tanker_trips:9,inlet_sewage:180,tse_for_irrigation:464},
  {date:"2025-11-29",tanker_trips:5,inlet_sewage:100,tse_for_irrigation:489},
  {date:"2025-11-30",tanker_trips:8,inlet_sewage:160,tse_for_irrigation:429},
  // December 2025
  {date:"2025-12-01",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:439},
  {date:"2025-12-02",tanker_trips:6,inlet_sewage:120,tse_for_irrigation:453},
  {date:"2025-12-03",tanker_trips:7,inlet_sewage:140,tse_for_irrigation:440},
  {date:"2025-12-04",tanker_trips:8,inlet_sewage:160,tse_for_irrigation:414},
  {date:"2025-12-05",tanker_trips:9,inlet_sewage:180,tse_for_irrigation:410},
  {date:"2025-12-06",tanker_trips:6,inlet_sewage:120,tse_for_irrigation:442},
  {date:"2025-12-07",tanker_trips:8,inlet_sewage:160,tse_for_irrigation:435},
  {date:"2025-12-08",tanker_trips:8,inlet_sewage:160,tse_for_irrigation:433},
  {date:"2025-12-09",tanker_trips:8,inlet_sewage:160,tse_for_irrigation:401},
  {date:"2025-12-10",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:362},
  {date:"2025-12-11",tanker_trips:11,inlet_sewage:220,tse_for_irrigation:325},
  {date:"2025-12-12",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:401},
  {date:"2025-12-14",tanker_trips:9,inlet_sewage:180,tse_for_irrigation:357},
  {date:"2025-12-15",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:408},
  {date:"2025-12-17",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:387},
  {date:"2025-12-18",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:384},
  {date:"2025-12-20",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:408},
  {date:"2025-12-21",tanker_trips:11,inlet_sewage:220,tse_for_irrigation:377},
  {date:"2025-12-22",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:352},
  {date:"2025-12-23",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:350},
  {date:"2025-12-24",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:397},
  {date:"2025-12-25",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:408},
  {date:"2025-12-26",tanker_trips:15,inlet_sewage:300,tse_for_irrigation:385},
  {date:"2025-12-27",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:477},
  {date:"2025-12-28",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:349},
  {date:"2025-12-29",tanker_trips:11,inlet_sewage:220,tse_for_irrigation:459},
  {date:"2025-12-30",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:495},
  // January 2026
  {date:"2026-01-01",tanker_trips:6,inlet_sewage:120,tse_for_irrigation:427},
  {date:"2026-01-02",tanker_trips:3,inlet_sewage:60,tse_for_irrigation:448},
  {date:"2026-01-03",tanker_trips:11,inlet_sewage:220,tse_for_irrigation:326},
  {date:"2026-01-04",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:498},
  {date:"2026-01-05",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:433},
  {date:"2026-01-06",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:472},
  {date:"2026-01-07",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:507},
  {date:"2026-01-09",tanker_trips:7,inlet_sewage:140,tse_for_irrigation:454},
  {date:"2026-01-10",tanker_trips:7,inlet_sewage:140,tse_for_irrigation:463},
  {date:"2026-01-11",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:450},
  {date:"2026-01-12",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:438},
  {date:"2026-01-13",tanker_trips:16,inlet_sewage:320,tse_for_irrigation:432},
  {date:"2026-01-14",tanker_trips:10,inlet_sewage:200,tse_for_irrigation:462},
  {date:"2026-01-15",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:355},
  {date:"2026-01-16",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:378},
  {date:"2026-01-17",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:426},
  {date:"2026-01-18",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:331},
  {date:"2026-01-19",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:347},
  {date:"2026-01-20",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:349},
  {date:"2026-01-21",tanker_trips:13,inlet_sewage:260,tse_for_irrigation:383},
  {date:"2026-01-23",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:362},
  {date:"2026-01-24",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:342},
  {date:"2026-01-25",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:411},
  {date:"2026-01-26",tanker_trips:14,inlet_sewage:280,tse_for_irrigation:285},
  {date:"2026-01-27",tanker_trips:12,inlet_sewage:240,tse_for_irrigation:375},
  {date:"2026-01-29",tanker_trips:15,inlet_sewage:300,tse_for_irrigation:287},
  // February 2026 (correct actual inlet_sewage values)
  {date:"2026-02-01",tanker_trips:13,inlet_sewage:692,tse_for_irrigation:565},
  {date:"2026-02-02",tanker_trips:9,inlet_sewage:538,tse_for_irrigation:562},
  {date:"2026-02-03",tanker_trips:12,inlet_sewage:619,tse_for_irrigation:550},
  {date:"2026-02-05",tanker_trips:17,inlet_sewage:605,tse_for_irrigation:596},
  {date:"2026-02-06",tanker_trips:13,inlet_sewage:685,tse_for_irrigation:619},
  {date:"2026-02-07",tanker_trips:14,inlet_sewage:630,tse_for_irrigation:614},
  {date:"2026-02-08",tanker_trips:14,inlet_sewage:632,tse_for_irrigation:614},
  {date:"2026-02-09",tanker_trips:17,inlet_sewage:634,tse_for_irrigation:632},
  {date:"2026-02-10",tanker_trips:16,inlet_sewage:663,tse_for_irrigation:620},
  {date:"2026-02-11",tanker_trips:16,inlet_sewage:654,tse_for_irrigation:607},
  {date:"2026-02-12",tanker_trips:16,inlet_sewage:621,tse_for_irrigation:612},
  {date:"2026-02-13",tanker_trips:11,inlet_sewage:562,tse_for_irrigation:597},
  {date:"2026-02-14",tanker_trips:16,inlet_sewage:770,tse_for_irrigation:626},
  {date:"2026-02-15",tanker_trips:18,inlet_sewage:709,tse_for_irrigation:616},
  {date:"2026-02-16",tanker_trips:13,inlet_sewage:658,tse_for_irrigation:640},
  {date:"2026-02-17",tanker_trips:14,inlet_sewage:582,tse_for_irrigation:525},
  {date:"2026-02-18",tanker_trips:5,inlet_sewage:550,tse_for_irrigation:562},
  {date:"2026-02-19",tanker_trips:12,inlet_sewage:555,tse_for_irrigation:656},
  {date:"2026-02-20",tanker_trips:6,inlet_sewage:436,tse_for_irrigation:394},
  {date:"2026-02-21",tanker_trips:10,inlet_sewage:551,tse_for_irrigation:534},
  {date:"2026-02-22",tanker_trips:12,inlet_sewage:544,tse_for_irrigation:539},
  {date:"2026-02-23",tanker_trips:11,inlet_sewage:614,tse_for_irrigation:496},
  {date:"2026-02-24",tanker_trips:7,inlet_sewage:509,tse_for_irrigation:484},
  {date:"2026-02-25",tanker_trips:11,inlet_sewage:629,tse_for_irrigation:522},
  {date:"2026-02-26",tanker_trips:10,inlet_sewage:576,tse_for_irrigation:502},
  {date:"2026-02-27",tanker_trips:10,inlet_sewage:530,tse_for_irrigation:598},
];

// ─────────────────────────────────────────────
// Combine: Airtable first, then migration (migration wins for those dates)
// ─────────────────────────────────────────────
const allByDate = new Map();
for (const r of airtableRecords) allByDate.set(r.date, r);
for (const r of migrationRecords) allByDate.set(r.date, r); // migration overrides

const allRecords = Array.from(allByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
console.log(`Total records to upsert: ${allRecords.length}`);

// ─────────────────────────────────────────────
// Batch upsert to Supabase
// ─────────────────────────────────────────────
async function upsertBatch(records) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stp_operations?on_conflict=date`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
}

const BATCH = 50;
let inserted = 0;
for (let i = 0; i < allRecords.length; i += BATCH) {
  const batch = allRecords.slice(i, i + BATCH);
  await upsertBatch(batch);
  inserted += batch.length;
  process.stdout.write(`\rUpserted ${inserted}/${allRecords.length}`);
}
console.log('\nDone!');

// ─────────────────────────────────────────────
// Print summary of months covered
// ─────────────────────────────────────────────
const byMonth = {};
for (const r of allRecords) {
  const m = r.date.slice(0, 7);
  byMonth[m] = (byMonth[m] || 0) + 1;
}
console.log('\nRecords by month:');
for (const [m, c] of Object.entries(byMonth).sort()) {
  console.log(`  ${m}: ${c} records`);
}
console.log('\nNOTE: Oct 2025, Mar 2026, Apr 2026 have no source data available.');
console.log('NOTE: Nov 2025, Dec 2025, Jan 2026 inlet_sewage = tanker_trips×20 (tanker volume only — actual total not available).');
