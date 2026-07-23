const { prisma } = require("../config/prisma");
const { createUser, authenticateUser } = require("../services/authService");
const { validateRegistration, validateLogin } = require("../validators/authValidators");

function showLogin(req, res) {
  res.render("auth/login", {
    pageTitle: "Logg inn",
    loggedOutMessage: req.query.loggedOut === "1" ? "Du er logget ut." : "",
    formData: {
      username: ""
    }
  });
}

function showRegister(req, res) {
  res.render("auth/register", {
    pageTitle: "Registrer konto",
    formData: {
      fullName: "",
      username: ""
    }
  });
}

async function register(req, res, next) {
  const { errors, values } = validateRegistration(req.body);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: values.username }
    });

    if (existingUser) {
      errors.push("Brukernavnet er allerede i bruk.");
    }

    if (errors.length > 0) {
      return res.status(422).render("auth/register", {
        pageTitle: "Registrer konto",
        errors,
        formData: values
      });
    }

    await createUser({
      fullName: values.fullName,
      username: values.username,
      password: req.body.password
    });

    req.flash("success", "Kontoen er opprettet og venter på godkjenning fra administrator.");
    return res.redirect("/auth/login");
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  const { username, password } = validateLogin(req.body);

  try {
    const { user, message } = await authenticateUser({ username, password });

    if (!user) {
      return res.status(401).render("auth/login", {
        pageTitle: "Logg inn",
        errors: [message],
        formData: { username }
      });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) {
          reject(error);
          return;
        }

        req.session.userId = user.id;
        resolve();
      });
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    req.flash("success", `Velkommen tilbake, ${user.fullName}.`);
    return res.redirect(user.role === "ADMIN" ? "/admin" : "/products");
  } catch (error) {
    return next(error);
  }
}

function showPending(req, res) {
  res.render("auth/pending", {
    pageTitle: "Venter på godkjenning"
  });
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie(process.env.SESSION_COOKIE_NAME || "bjork.sid");
    return res.redirect("/auth/login?loggedOut=1");
  });
}

module.exports = {
  showLogin,
  showRegister,
  register,
  login,
  showPending,
  logout
};
