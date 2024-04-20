const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy, // Import LocalStrategy from Passport
  Models = require('./models.js'),
  passportJWT = require('passport-jwt'); // Import JWT strategy from Passport

  // Initialize User model
let Users = Models.User,
  JWTStrategy = passportJWT.Strategy, // Define JWTStrategy from Passport
  ExtractJWT = passportJWT.ExtractJwt; // Define ExtractJWT from Passport

  // Configure LocalStrategy for basic HTTP authentication
passport.use(
  new LocalStrategy(
    { // Define username and password in request body
      usernameField: 'Username',
      passwordField: 'Password',
    },
    async (username, password, callback) => { // Define callback function for LocalStrategy
      console.log(`${username} ${password}`); // Log username and password for debugging
      await Users.findOne({ Username: username })
        .then((user) => { // If user found
            if (!user) { // If user not found, return error
                console.log('incorrect username');
                return callback(null, false, { 
                    message: 'Incorrect username or password.', 
                });
            }
            if (!user.validatePassword(password)) {
                console.log("incorrect password");
                return callback(null, false, { message: "Incorrect password." });
            }
            console.log('finished');
            return callback(null, user);
        })
        .catch((error) => {
            if (error) {
                console.log(error);
                return callback(error);
            }
        })
    }
  )
);

// Configure JWTStrategy for JWT authentication
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(), // Extract JWT “bearer token" from header  of the HTTP request
  secretOrKey: 'your_jwt_secret' // Define JWT secret key
}, async (jwtPayload, callback) => { // Define callback function for JWTStrategy
  return await Users.findById(jwtPayload._id)
    .then((user) => {
      return callback(null, user);
    })
    .catch((error) => {
      return callback(error)
    });
}));