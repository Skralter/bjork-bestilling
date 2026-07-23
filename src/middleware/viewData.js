const { formatDateTime } = require("../utils/formatters");

function attachViewData(req, res, next) {
  res.locals.currentUser = req.currentUser || null;
  res.locals.csrfToken = typeof req.csrfToken === "function" ? req.csrfToken() : "";
  res.locals.flash = {
    success: req.flash("success"),
    error: req.flash("error")
  };
  res.locals.formatDateTime = formatDateTime;
  res.locals.currentPath = req.path;
  next();
}

module.exports = {
  attachViewData
};
