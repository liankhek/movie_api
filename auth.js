const jwtSecret = "your_jwt_secret"; // This has to be the same key used in the JWTStrategy
const jwt = require("jsonwebtoken"), // Import jsonwebtoken module
  passport = require("passport");

require("./passport"); // Your local passport file

// Function to generate JWT token
let generateJWTToken = (user) => { // Sign user data with JWT secret key
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // This is the username you’re encoding in the JWT
    expiresIn: "7d", // This specifies that the token will expire in 7 days
    algorithm: "HS256" // This is the algorithm used to “sign” or encode the values of the JWT
  });
}


/* POST login. */
module.exports = (router) => {
  router.post("/login", (req, res) => { // Define POST login route
    passport.authenticate("local", { session: false }, (error, user, info) => { // Authenticate user with local strategy
      if (error || !user) { // If error or user not found
        return res.status(400).json({
          message: "Something is not right",
          user: user
        });
      }
      req.login(user, { session: false }, (error) => { // Log user in
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON()); // Generate JWT token
        return res.json({ user, token }); // Return user and token as response
      });
    })(req, res);
  });
}