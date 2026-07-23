const bcrypt = require("bcrypt");
const { prisma } = require("../config/prisma");
const { updateAccountProfile, updatePassword } = require("../services/adminService");
const { validatePasswordChange } = require("../validators/authValidators");

function showAccount(req, res) {
  res.render("account/index", {
    pageTitle: "Min konto"
  });
}

async function updateProfile(req, res, next) {
  const fullName = String(req.body.fullName || "").trim();

  if (!fullName) {
    req.flash("error", "Navn kan ikke være tomt.");
    return res.redirect("/account");
  }

  try {
    await updateAccountProfile(req.currentUser.id, fullName);
    req.flash("success", "Navnet ditt ble oppdatert.");
    return res.redirect("/account");
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  const { errors, values } = validatePasswordChange(req.body);
  if (errors.length > 0) {
    req.flash("error", errors.join(" "));
    return res.redirect("/account");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.currentUser.id }
    });

    const matches = await bcrypt.compare(values.currentPassword, user.passwordHash);
    if (!matches) {
      req.flash("error", "Nåværende passord er feil.");
      return res.redirect("/account");
    }

    await updatePassword(req.currentUser.id, values.newPassword);
    req.flash("success", "Passordet ditt ble oppdatert.");
    return res.redirect("/account");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  showAccount,
  updateProfile,
  changePassword
};
