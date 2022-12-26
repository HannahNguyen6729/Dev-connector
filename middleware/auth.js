const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  //get token from header
  //when send a request to a protected route, need to send the token within the header
  const token = req.header("x-auth-token");

  //check if not token
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  //if the header includes token, verify token
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    //decoded value:
    // {
    //   "newUser": {
    //     "id": "63a96fc0de52b17f27805edd"
    //   },
    //   "iat": 1672048576,
    //   "exp": 1672408576
    // }
    req.user = decoded.currentUser; //get user id after verify token, then assign user id to req.user
    return next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "token is not valid" });
  }
};
