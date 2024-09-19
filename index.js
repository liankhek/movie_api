const { error } = require("console");
const express = require("express"),
      bodyParser = require("body-parser"),
      uuid = require ("uuid"),
      morgan = require("morgan"),
//      fs = require("fs"),
//      path = require("path"),
      mongoose = require("mongoose"),
      Models = require("./models.js");

const app = express();
const { check, validationResult } = require("express-validator");

const Movies = Models.Movie,
      Users = Models.User,
      Genres = Models.Genre,
      Directors = Models.Director;


// Allows Mongoose to connect to the database
//mongoose.connect("mongodb://localhost:27017/myflixDB", { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Database connected successfully'))
.catch((err) => console.log('Error connecting to database:', err));


// Midlware(log requestss to server)
app.use(morgan("common"));
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());
/* Want only certain origins to be given access,replace app.use(cors()); with the following code:

let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));
 */

let auth = require('./auth')(app); // ensures that Express is available in “auth.js” file
const passport = require('passport');
require('./passport');

// import auth into index
app.use(bodyParser.urlencoded({ extended: true }));



//------------- default text response when at /
app.get("/", (req, res) => {
    res.send("Welcome to myFlix!");
});

// return JSON object when at /movies
app.get("/movies", passport.authenticate("jwt", { session: false}), async (req, res) => {
    await Movies.find()
        .then ((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

// ---------- READ in Mongoose---------------

// Get all users
app.get("/users", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
});

// Get a user by username
app.get("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((users) => {
        res.json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
});

// Get JSON movie info when looking for specific title
app.get("/movies/:Title", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

// GET JSON genre info when looking for specific genre
app.get("/movies/genre/:genre", passport.authenticate("jwt", { session: false }), (req, res) => {
      Movies.find({ "Genre.Name": req.params.genre })
        .then((movie) => {
          if (!movie.length) {
            res.status(400).send(req.params.genre + " movies were not found.");
          } else {
            res.json(movie);
          }
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("Error: " + err);
        });
    }
  );
// GET info on director when looking for specific director
app.get("/movies/director/:directorName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "Director.Name": req.params.directorName })
      .then((director) => {
        if (!director) {
          res.status(404).send(req.params.directorName + " was not found.");
        } else {
          res.json(director);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err.message);
      });
  });

//--------- “CREATE” in Mongoose----------------------------- 
//--Add/Register user --------
/* Expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/

// Allow users to register
app.post("/users",
[
    check("Username", "Username must be at least 5 characters").isLength({ min: 5 }),
    check("Username", "Username can only contain alphanumeric characters").isAlphanumeric(),
    check("Password", "Password must not be empty").not().isEmpty(),
    check("Email", "Invalid email address").isEmail()
],
async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const hashedPassword = bcrypt.hashSync(req.body.Password,10);

    await Users.findOne({ Username: req.body.Username }) // check if the provided username already exists
        .then((user) => { // Handling Existing User
            if (user) {
                return res.status(400).send(req.body.Username + " already exists");
            } 
            else {
                //If the user doesn’t exist, use Mongoose’s 'create' command & create new user
                Users.create ({ 
                    Username: req.body.Username, // req.body is the request that the user sends
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                })
                .then ((user) => {
                    res.status(201).json(user); 
                })
                .catch ((error) => {
                    console.error(error);
                    res.status(500).send("Error: " + error);
                });
            }
        })
        .catch ((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});


// ----------- UPDATE in Mongoose ------------------

// allow users to update their user info
app.put('/users/:Username',
passport.authenticate("jwt", { session: false }),
[
    check("Username", "Username must be at least 5 characters").isLength({ min: 5 }),
    check("Username", "Username can only contain alphanumeric characters").isAlphanumeric(),
    check("Email", "Invalid email address").isEmail(),
    check("Password", "Password must not be empty").not().isEmpty()
],
async (req, res) => {
    const errors = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    // Condition to check user
    if(req.user.Username !== req.params.Username){
        return res.status(400).send("Permission denied");
    }
    // Condition End
    await Users.findOneAndUpdate (
        { Username: req.params.Username }, 
        { $set:
            {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
        },
        { new: true } // This line makes sure that the updated document is returned
    ) 
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        })
  
});

// Allow user to Deregister
app.delete('/users/:Username', passport.authenticate("jwt", { session: false }), async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username }) 
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
});

// Add movie to username's list
app.post("/users/:Username/movies/:movieName", passport.authenticate("jwt", { session: false }), (req, res) => {
    const { Username, movieName } = req.params;
    Movies.findOne({ Title: movieName })
        .then((movie) => {
            if (!movie) {
                return res.status(404).send("Movie not found");
            }
            Users.findOneAndUpdate(
                { Username: Username },
                { $push: { FavoriteMovies: movie._id } },
                { new: true }
            )
                .then((updatedUser) => {
                    res.json(updatedUser);
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send("Error: " + err);
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

// Remove movie form username's list
app.delete("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate (
        { Username: req.params.Username },
        { $pull: { FavoriteMovies: req.params.MovieID } },
        { new: true }
    )
    .then((updatedUser) => {
        if (!updatedUser) {
            return res.status(404).send("User not found");
        }
        res.json(updatedUser);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
    });
});

// access documentation.html using express.static
app.use("/documentation", express.static("public"));

// error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Error");
});

// listen on port
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});