const { Prisma } = require("@prisma/client");

function notFoundHandler(req, res) {
  res.status(404).render("errors/404", {
    pageTitle: "Siden finnes ikke"
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.code === "EBADCSRFTOKEN") {
    req.flash("error", "Skjemaet utløp. Last siden inn på nytt og prøv igjen.");
    return res.redirect(req.get("referer") || "/");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    req.flash("error", "Databasen svarte med en feil. Prøv igjen.");
    return res.redirect(req.get("referer") || "/");
  }

  return res.status(500).render("errors/500", {
    pageTitle: "Intern feil"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
