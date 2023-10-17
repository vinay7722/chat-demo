const jwt = require("jsonwebtoken");
const db = require("../config/db");

function generateAccessToken(username) {
  return jwt.sign({ user_id: username.user_id }, "vinay", {
    expiresIn: "9000000000min",
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader === undefined) {
    return res.status(401).json({ error: true, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  //console.log("authHeader", token);

  // Verify the JWT token
  jwt.verify(token, "vinay", (err, data) => {
    if (err) {
      return res.status(401).json({ error: true, message: "Unauthorized" });
    }

    // If the token is valid, you can access the user_id from the decoded data
    const userId = data.user_id;
    //console.log(userId);
    //const newUserID = userId.slice(1);
    // console.log(newUserID);
    if (!userId) {
      return res.status(401).json({ error: true, message: "Unauthorized" });
    }

    // Check if the user exists in the database by user_id
    const query = "SELECT * FROM user WHERE phoneNumber = ?";
    db.query(query, [userId], (err, results) => {
      console.log("resultsresults", results);
      if (err) {
        // Handle database error
        return res.status(500).json({ error: true, message: err.message });
      }

      if (results.length === 0) {
        // User does not exist in the database
        return res.status(401).json({ error: true, message: "Unauthorized" });
      }
      
      console.log("resultsresults", results);

      // Attach the user object to the request for further use in your routes
      req.user = results[0];
      next();
    });
  });
}

module.exports = { generateAccessToken, authenticateToken };
