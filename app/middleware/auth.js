const jwt = require("jsonwebtoken");

function checkRole(role) {
  return (req, res, next) => {
    let token = req.headers["x-access-token"];

    if (!token) {
      return res.status(403).send("Access denied. No token provided.");
    }

    jwt.verify(token, "secrect_key", (err, decoded) => {
      if (err) {
        return res.status(403).send("Invalid token");
      }

      if (decoded.role !== role) {
        return res.status(403).send("Access denied,you are not authorized");
      }

      req.user = decoded;
    });
  };
}
module.exports = checkRole;
