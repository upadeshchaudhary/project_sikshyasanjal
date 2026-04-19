// Full BS month-day lookup table (2075–2092)
// Each row: [BS_YEAR, days_in_month_1 .. days_in_month_12]
const BS_MONTH_DATA = [
  [2075, 31,31,32,32,31,30,30,29,30,29,30,30],
  [2076, 31,32,31,32,31,30,30,29,30,29,30,30],
  [2077, 31,32,31,32,31,30,30,30,29,29,30,30],
  [2078, 31,31,32,31,31,30,30,30,29,30,29,31],
  [2079, 31,31,32,31,31,30,30,30,29,30,29,31],
  [2080, 31,32,31,32,31,30,30,30,29,30,29,31],
  [2081, 31,31,32,31,31,31,30,29,30,29,30,30],
  [2082, 31,32,31,32,31,30,30,29,30,29,30,30],
  [2083, 31,32,31,32,31,30,30,30,29,29,30,31],
  [2084, 31,31,32,31,31,30,30,30,29,30,29,31],
  [2085, 31,31,32,31,31,31,30,29,30,29,30,30],
  [2086, 31,32,31,32,31,30,30,29,30,29,30,30],
  [2087, 31,32,31,32,31,30,30,30,29,29,30,31],
  [2088, 31,31,32,31,31,31,30,29,30,29,30,30],
  [2089, 31,31,32,31,31,30,30,30,29,30,29,31],
  [2090, 31,32,31,32,31,30,30,29,30,29,30,30],
  [2091, 31,32,31,32,31,30,30,30,29,29,30,31],
  [2092, 31,31,32,31,31,31,30,29,30,29,30,30],
];

export const BS_MONTH_NAMES = [
  "Baisakh","Jestha","Ashadh","Shrawan",
  "Bhadra","Ashwin","Kartik","Mangsir",
  "Poush","Magh","Falgun","Chaitra",
];

export const BS_MONTH_NAMES_NP = [
  "बैशाख","जेठ","असार","साउन",
  "भदौ","असोज","कार्तिक","मंसिर",
  "पुष","माघ","फागुन","चैत",
];

export const getDaysInBSMonth = (year, month) => {
  const row = BS_MONTH_DATA.find(r => r[0] === year);
  return row ? row[month] : 30; // month is 1-indexed
};

export const formatBSDate = (bsDate) => {
  if (!bsDate) return "";
  const [y, m, d] = bsDate.split("-").map(Number);
  return `${d} ${BS_MONTH_NAMES[m - 1]} ${y} BS`;
};

export const getCurrentBSYear = () => 2082;
export const getCurrentBSMonth = () => 10; // Magh (as of early 2026 AD)

// ─── BS → AD conversion ────────────────────────────────────────────────────
// Reference point: BS 2081 Baisakh 1 = AD 2024 April 13 (Saturday)
// We count total days from that anchor to find the AD date, then get weekday.

const ANCHOR_BS  = { year: 2081, month: 1, day: 1 };
const ANCHOR_AD  = new Date(2024, 3, 13); // April 13 2024 (month is 0-indexed)

function totalBSDaysFrom2081(bsYear, bsMonth, bsDay) {
  let total = 0;
  for (let y = 2081; y < bsYear; y++) {
    const row = BS_MONTH_DATA.find(r => r[0] === y);
    if (row) total += row.slice(1).reduce((a, b) => a + b, 0);
    else total += 365;
  }
  const row = BS_MONTH_DATA.find(r => r[0] === bsYear);
  for (let m = 1; m < bsMonth; m++) {
    total += row ? row[m] : 30;
  }
  total += bsDay - 1;
  return total;
}

// Returns a JS Date for a given BS date string "YYYY-MM-DD"
export function bsToAD(bsDateStr) {
  const [y, m, d] = bsDateStr.split("-").map(Number);
  const dayOffset = totalBSDaysFrom2081(y, m, d);
  const result = new Date(ANCHOR_AD);
  result.setDate(result.getDate() + dayOffset);
  return result;
}

// Returns 0=Sun,1=Mon,...,6=Sat for the 1st day of a BS month
export function getFirstWeekdayOfBSMonth(bsYear, bsMonth) {
  const adDate = bsToAD(`${bsYear}-${String(bsMonth).padStart(2,"0")}-01`);
  return adDate.getDay(); // 0=Sun, 6=Sat
}

// AD month/year label for a BS month (approximate, shows start month)
export function getADMonthLabel(bsYear, bsMonth) {
  const adDate = bsToAD(`${bsYear}-${String(bsMonth).padStart(2,"0")}-01`);
  return adDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}