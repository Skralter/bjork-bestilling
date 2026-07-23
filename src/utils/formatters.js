function formatDateTime(date) {
  if (!date) {
    return "Ikke tilgjengelig";
  }

  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function formatDate(date) {
  if (!date) {
    return "Ikke satt";
  }

  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "medium"
  }).format(new Date(date));
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "Ikke satt";
  }

  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK"
  }).format(Number(value));
}

module.exports = {
  formatDateTime,
  formatDate,
  formatCurrency
};
