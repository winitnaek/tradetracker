function validDate(key) {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key)
    && Number.isFinite(new Date(`${key}T00:00:00.000Z`).getTime())
    && new Date(`${key}T00:00:00.000Z`).toISOString().slice(0, 10) === key;
}
const cents = value => Math.round(Number(value) * 100);
function summarize(payments, selectedDate) {
  const year = Number(selectedDate.slice(0, 4));
  const month = Number(selectedDate.slice(5, 7)) - 1;
  const quarter = Math.floor(month / 3);
  let total = 0, cash = 0, reinvested = 0;
  const months = Array(12).fill(0);
  for (const payment of payments) {
    const amount = cents(payment.amount);
    total += amount;
    if (payment.paymentType === 'Reinvested') reinvested += amount; else cash += amount;
    const date = new Date(payment.paymentDate);
    if (date.getUTCFullYear() === year) months[date.getUTCMonth()] += amount;
  }
  const quarters = Array.from({ length: 4 }, (_, i) => months.slice(i * 3, i * 3 + 3).reduce((a, b) => a + b, 0));
  return {
    total: total / 100, cash: cash / 100, reinvested: reinvested / 100,
    month: months[month] / 100, quarter: quarters[quarter] / 100,
    year: months.reduce((a, b) => a + b, 0) / 100,
    monthly: months.map((amount, i) => ({ label: new Date(Date.UTC(year, i, 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), amount: amount / 100 })),
    quarterly: quarters.map((amount, i) => ({ label: `Q${i + 1}`, amount: amount / 100 })),
    yearly: [...new Set([year - 2, year - 1, year, ...payments.map(p => new Date(p.paymentDate).getUTCFullYear())])].sort((a, b) => a - b).map(y => ({ label: String(y), amount: payments.filter(p => new Date(p.paymentDate).getUTCFullYear() === y).reduce((n, p) => n + cents(p.amount), 0) / 100 }))
  };
}
module.exports = { validDate, summarize };
