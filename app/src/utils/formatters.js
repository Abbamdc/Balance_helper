/**
 * Format a number with commas: 1234567 → "1,234,567"
 */
export const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Format as Naira: 5000 → "₦5,000"
 */
export const fmtNaira = (n) => `₦${fmt(n)}`;

/**
 * Format liters: 500 → "500 L"
 */
export const fmtLiters = (n) => `${fmt(n)} L`;

/**
 * Format date string "2025-06-15" → "June 15, 2025"
 */
export const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format date string "2025-06-15" → "Jun 15"
 */
export const fmtDateShort = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

/**
 * Format "2025-06" → "June 2025"
 */
export const fmtMonthKey = (key) => {
  if (!key) return '';
  try {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return key;
  }
};

/**
 * Today as "YYYY-MM-DD"
 */
export const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Get "YYYY-MM" from "YYYY-MM-DD"
 */
export const getMonthKey = (dateStr) => (dateStr ? dateStr.slice(0, 7) : '');

/**
 * Parse a string to float, return 0 if invalid
 */
export const parseNum = (val) => {
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

/**
 * Format a Date object → "YYYY-MM-DD"
 */
export const formatDate = (date) => {
  if (!date) return todayStr();
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Generate a simple unique ID (UUID v4-like, no external dep)
 */
export const generateId = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-4${s4().slice(1)}-${s4()}-${s4()}${s4()}${s4()}`;
};

/**
 * Build plain-text shift report (same format as HTML app)
 */
export const buildTextReport = (r) => {
  const sn = r.shift === 'morning' ? 'MORNING' : 'AFTERNOON';
  let t = `============================\n  BALANCE HELPER — SHIFT REPORT\n  Date  : ${r.date}\n  Shift : ${sn}\n============================\n\n`;
  (r.pumps || []).forEach((p) => {
    t += `--- Pump ${p.num} ---\n`;
    t += `  Opening Meter : ${fmt(p.open)}\n`;
    t += `  Closing Meter : ${fmt(p.close)}\n`;
    t += `  Price/Liter   : ₦${fmt(p.price)}\n`;
    t += `  Total Liters  : ${fmt(p.liters)} L\n`;
    t += `  Amount        : ₦${fmt(p.amount)}\n\n`;
  });
  t += `--- SUMMARY ---\n`;
  t += `  Total Liters Sold   : ${fmt(r.totalLiters)} L\n`;
  t += `  Amount to Deposit   : ₦${fmt(r.totalAmountDue)}\n`;
  t += `  POS                 : ₦${fmt(r.pos)}\n`;
  (r.deposits || []).forEach((d) => {
    t += `  ${d.label.padEnd(20)}: ₦${fmt(d.value)}\n`;
  });
  t += `  Total Deposited     : ₦${fmt(r.totalDeposited)}\n\n`;
  if (r.diff > 0) t += `  STATUS: OVER by ₦${fmt(r.diff)}\n`;
  else if (r.diff < 0) t += `  STATUS: SHORT by ₦${fmt(Math.abs(r.diff))}\n`;
  else t += `  STATUS: BALANCED ✓\n`;
  t += `============================\n`;
  return t;
};
