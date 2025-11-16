import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const token =
    req.headers.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.json({
      success: false,
      message: "Not authorized. Login again.",
    });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.id) {
      req.body = req.body || {};
      req.body.userId = tokenDecode.id;
      next();
    } else {
      return res.json({
        success: false,
        message: "Not Authorized. Please log in again.",
      });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;
