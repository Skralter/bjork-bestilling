const { Prisma } = require("@prisma/client");

function requestWantsJson(req) {
  return (
    req.xhr ||
    req.get("x-requested-with") === "XMLHttpRequest" ||
    (req.get("accept") || "").includes("application/json")
  );
}

function notFoundHandler(req, res) {
  if (requestWantsJson(req)) {
    return res.status(404).json({
      success: false,
      message: "Siden finnes ikke."
    });
  }

  return res.status(404).render("errors/404", {
    pageTitle: "Siden finnes ikke"
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.code === "EBADCSRFTOKEN") {
    if (requestWantsJson(req)) {
      return res.status(403).json({
        success: false,
        message: "Skjemaet utløp. Last siden inn på nytt og prøv igjen."
      });
    }

    req.flash("error", "Skjemaet utløp. Last siden inn på nytt og prøv igjen.");
    return res.redirect(req.get("referer") || "/");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (requestWantsJson(req)) {
      return res.status(500).json({
        success: false,
        message: "Databasen svarte med en feil. Prøv igjen."
      });
    }

    req.flash("error", "Databasen svarte med en feil. Prøv igjen.");
    return res.redirect(req.get("referer") || "/");
  }

  if (requestWantsJson(req)) {
    return res.status(500).json({
      success: false,
      message: "Noe gikk galt på serversiden. Prøv igjen om litt."
    });
  }

  return res.status(500).render("errors/500", {
    pageTitle: "Intern feil"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
