function escapeCsv(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return `"${stringValue.replace(/"/g, "\"\"")}"`;
}

function toCsv(rows) {
  const bom = "\uFEFF";
  return bom + rows.map((row) => row.map(escapeCsv).join(";")).join("\n");
}

module.exports = {
  toCsv
};
