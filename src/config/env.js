const isProduction = process.env.NODE_ENV === "production";

const sessionCookieConfig = {
  name: process.env.SESSION_COOKIE_NAME || "bjork.sid",
  secret: process.env.SESSION_SECRET || "development-secret-change-me",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

module.exports = {
  isProduction,
  sessionCookieConfig
};
