const { USERNAME_PATTERN } = require("../utils/constants");

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function validateRegistration(body) {
  const fullName = String(body.fullName || "").trim();
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");
  const errors = [];

  if (!fullName) {
    errors.push("Fullt navn er obligatorisk.");
  }

  if (!USERNAME_PATTERN.test(username)) {
    errors.push("Brukernavn må være 3-30 tegn og kan bare inneholde bokstaver, tall, punktum, bindestrek og understrek.");
  }

  if (password.length < 8) {
    errors.push("Passord må være minst 8 tegn langt.");
  }

  if (password !== confirmPassword) {
    errors.push("Passordene må være like.");
  }

  return {
    errors,
    values: { fullName, username }
  };
}

function validateLogin(body) {
  return {
    username: normalizeUsername(body.username),
    password: String(body.password || "")
  };
}

function validatePasswordChange(body) {
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmNewPassword = String(body.confirmNewPassword || "");
  const errors = [];

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    errors.push("Alle passordfeltene må fylles ut.");
  }

  if (newPassword.length < 8) {
    errors.push("Nytt passord må være minst 8 tegn langt.");
  }

  if (newPassword !== confirmNewPassword) {
    errors.push("Nytt passord og bekreftelse må være like.");
  }

  return {
    errors,
    values: {
      currentPassword,
      newPassword
    }
  };
}

module.exports = {
  normalizeUsername,
  validateRegistration,
  validateLogin,
  validatePasswordChange
};
