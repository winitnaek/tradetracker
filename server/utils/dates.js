function dateKey(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayBounds(value = new Date()) {
  const key = typeof value === 'string' ? value : dateKey(value);
  return {
    start: new Date(`${key}T00:00:00.000Z`),
    end: new Date(`${key}T23:59:59.999Z`)
  };
}

module.exports = { dateKey, dayBounds };
