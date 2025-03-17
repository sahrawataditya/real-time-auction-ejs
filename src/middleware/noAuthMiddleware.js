const noAuthMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    return res.redirect("/");
  }
  next();
};

export default noAuthMiddleware;
