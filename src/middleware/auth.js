const { prisma } = require("../config/prisma");
const { UserRole, UserStatus } = require("@prisma/client");

async function attachCurrentUser(req, res, next) {
  if (!req.session.userId) {
    req.currentUser = null;
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId }
    });

    if (!user || user.status === UserStatus.DISABLED) {
      req.session.destroy(() => {});
      req.currentUser = null;
      return next();
    }

    req.currentUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireLogin(req, res, next) {
  if (!req.currentUser) {
    req.flash("error", "Du må logge inn for å fortsette.");
    return res.redirect("/auth/login");
  }

  return next();
}

function requireApprovedUser(req, res, next) {
  if (!req.currentUser) {
    req.flash("error", "Du må logge inn for å fortsette.");
    return res.redirect("/auth/login");
  }

  if (req.currentUser.status !== UserStatus.APPROVED) {
    return res.status(403).render("errors/403", {
      pageTitle: "Ingen tilgang",
      message: "Kontoen din er ikke godkjent for tilgang til denne siden enda."
    });
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser) {
    req.flash("error", "Du må logge inn for å fortsette.");
    return res.redirect("/auth/login");
  }

  if (req.currentUser.role !== UserRole.ADMIN || req.currentUser.status !== UserStatus.APPROVED) {
    return res.status(403).render("errors/403", {
      pageTitle: "Ingen tilgang",
      message: "Du har ikke tilgang til administrasjonssiden."
    });
  }

  return next();
}

module.exports = {
  attachCurrentUser,
  requireLogin,
  requireApprovedUser,
  requireAdmin
};
