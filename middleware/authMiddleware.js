exports.protect = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login.html?message=Please login first");
  }

  next();
};

exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect("/login.html?message=Please login first");
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.redirect(
        `/not-authorized.html?message=You are not allowed to access this dashboard`
      );
    }

    next();
  };
};