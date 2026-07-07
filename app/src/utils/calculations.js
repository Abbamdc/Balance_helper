import { parseNum } from './formatters';

/**
 * Calculate results for a single pump
 */
export const calcPump = (pump) => {
  const open = parseNum(pump.open);
  const close = parseNum(pump.close);
  const price = parseNum(pump.price);
  const liters = close - open;
  const amount = liters * price;
  return { ...pump, liters, amount };
};

/**
 * Calculate the full shift balance.
 *
 * @param {object} params
 * @param {string} params.date       - "YYYY-MM-DD"
 * @param {string} params.shift      - "morning" | "afternoon"
 * @param {Array}  params.pumps      - [{ num, open, close, price }]
 * @param {number} params.pos        - POS amount
 * @param {Array}  params.deposits   - [{ label, value }]
 * @param {string} params.localId    - UUID
 *
 * @returns {{ valid: false, errors: string[] } | { valid: true, result: object }}
 */
export const calculateShift = ({ date, shift, pumps, pos, deposits, localId }) => {
  const errors = [];

  if (!date) errors.push('Please select a date.');
  if (!shift) errors.push('Please select a shift.');

  if (!pumps || pumps.length === 0) {
    errors.push('Add at least one pump.');
  }

  const calcedPumps = [];

  pumps.forEach((p, i) => {
    const open = parseNum(p.open);
    const close = parseNum(p.close);
    const price = parseNum(p.price);

    if (!p.num) errors.push(`Pump ${i + 1}: pump number is required.`);
    if (!p.open && p.open !== 0) errors.push(`Pump ${i + 1}: opening meter is required.`);
    if (!p.close && p.close !== 0) errors.push(`Pump ${i + 1}: closing meter is required.`);
    if (!p.price) errors.push(`Pump ${i + 1}: price per liter is required.`);
    if (close < open) errors.push(`Pump ${i + 1}: closing meter must be ≥ opening meter.`);

    const liters = close - open;
    const amount = liters * price;
    calcedPumps.push({ num: Number(p.num), open, close, price, liters, amount });
  });

  if (errors.length > 0) return { valid: false, errors };

  // Totals
  const totalLiters = calcedPumps.reduce((s, p) => s + p.liters, 0);
  const totalAmountDue = calcedPumps.reduce((s, p) => s + p.amount, 0);

  const posAmount = parseNum(pos) || 0;
  const cleanDeposits = (deposits || [])
    .filter((d) => d.label && parseNum(d.value) > 0)
    .map((d) => ({ label: d.label, value: parseNum(d.value) }));

  const totalDeposited = posAmount + cleanDeposits.reduce((s, d) => s + d.value, 0);
  const diff = totalDeposited - totalAmountDue;

  return {
    valid: true,
    result: {
      localId,
      date,
      shift,
      pumps: calcedPumps,
      pos: posAmount,
      deposits: cleanDeposits,
      totalLiters,
      totalAmountDue,
      totalDeposited,
      diff,
    },
  };
};

/**
 * Compute monthly aggregate from an array of records
 */
export const computeMonthlyStats = (records) => {
  const months = {};

  records.forEach((r) => {
    const key = r.date ? r.date.slice(0, 7) : 'unknown';
    if (!months[key]) {
      months[key] = {
        key,
        totalLiters: 0,
        totalAmountDue: 0,
        totalDeposited: 0,
        totalOvers: 0,
        totalShorts: 0,
        netBalance: 0,
        shifts: [],
      };
    }
    const m = months[key];
    m.totalLiters += r.totalLiters || 0;
    m.totalAmountDue += r.totalAmountDue || 0;
    m.totalDeposited += r.totalDeposited || 0;
    const d = r.diff || 0;
    m.netBalance += d;
    if (d > 0) m.totalOvers += d;
    else if (d < 0) m.totalShorts += Math.abs(d);
    m.shifts.push(r);
  });

  return Object.values(months).sort((a, b) => b.key.localeCompare(a.key));
};
