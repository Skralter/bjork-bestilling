const path = require("path");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const morgan = require("morgan");
const csrf = require("csurf");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

const { prisma } = require("./config/prisma");
const { sessionCookieConfig, isProduction } = require("./config/env");
const { attachCurrentUser } = require("./middleware/auth");
const { attachViewData } = require("./middleware/viewData");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const accountRoutes = require("./routes/accountRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandlers");

function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );
  app.use(morgan(isProduction ? "combined" : "dev"));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(methodOverride("_method"));
  app.use(express.static(path.join(process.cwd(), "public")));

  app.use(
    session({
      name: sessionCookieConfig.name,
      secret: sessionCookieConfig.secret,
      resave: false,
      saveUninitialized: false,
      proxy: isProduction,
      cookie: sessionCookieConfig.cookie,
      store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined
      })
    })
  );

  app.use(flash());
  app.use(attachCurrentUser);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "For mange forsøk. Vent litt før du prøver igjen."
  });

  app.use((req, res, next) => {
    if (req.path.startsWith("/webhook")) {
      return next();
    }

    return csrf()(req, res, next);
  });

  app.use(attachViewData);

  app.use("/auth/login", authLimiter);
  app.use("/auth/register", authLimiter);

  app.get("/", (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/auth/login");
    }

    return res.redirect("/products");
  });

  app.use("/auth", authRoutes);
  app.use("/products", productRoutes);
  app.use("/account", accountRoutes);
  app.use("/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
