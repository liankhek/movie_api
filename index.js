const { error } = require("console");
const bodyParser = require('body-parser');
const express = require("express"),
      morgan = require("morgan"),
//      fs = require("fs"),
//      path = require("path"),
      mongoose = require("mongoose"),
      Models = require("./models.js");

const { check, validationResult } = require("express-validator");
check(
  "Username",
  "Username contains non-alphanumeric characters - not allowed."
).isAlphanumeric();

const Movies = Models.Movie,
      Users = Models.User,
      Genres = Models.Genre,
      Directors = Models.Director;

const app = express();

require('dotenv').config();

const uri = process.env.CONNECTION_URI || 'mongodb+srv://liankhek:Themongo24@myflixdb.si0ifdy.mongodb.net/myFlixDB?retryWrites=true&w=majority';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Database connected successfully'))
.catch((err) => console.log('Error connecting to database:', err));

app.use(express.static('public')); // Get documentation file
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require("cors");

app.use(
  cors(
    /*{
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn’t found on the list of allowed origins
        let message =
          "The CORS policy for this application doesn’t allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  }*/
  )
);

// Allows Mongoose to connect to the database
//mongoose.connect("mongodb://localhost:27017/myflixDB", { useNewUrlParser: true, useUnifiedTopology: true });

/*Midlware(log requestss to server)
app.use(morgan("common"));
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());
//Want only certain origins to be given access,replace app.use(cors()); with the following code:

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
// Morgan middleware
app.use(morgan("combined"));

let auth = require('./auth')(app); // ensures that Express is available in “auth.js” file

const passport = require('passport');
require('./passport');

//-- default text response at /
app.get("/", (req, res) => {
  res.send("Welcome to myFlix!");
});

//-- CREATE --
//--Add/Register user --
/* Expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post(
  "/users",
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non-alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  async (req, res) => {
let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

let hashedPassword = Users.hashPassword(req.body.Password);

    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + " already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async(req,res) => {
  await Users.findOne({Username: req.params.Username})
  .then((user) => {
    if (user) {
      res.json(user);
    } else {
      res.status(404).send('user with the username' + req.params.Username + 'was not found.');
    }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });

// Add Movie with Movie ID
app.post( "/users/:Username/movies/:MovieID", /*passport.authenticate("jwt", { session: false }),*/
  async (req, res) => {
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get all users
app.get("/users", passport.authenticate("jwt", { session: false }),
async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
  }
);


// return JSON object at /movies
app.get("/movies", passport.authenticate("jwt", { session: false }),
async (req, res) => {
    Movies.find()
      .then ((movies) => {
          res.status(201).json(movies);
      })
      .catch((err) => {
          console.error(err);
          res.status(500).send("Error: " + err);
      });
  }
);

// READ title
app.get("/movies/:Title", passport.authenticate("jwt", { session: false }),
async (req, res) => {
  await Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      if (movie) {
        res.json(movie);
      } 
      else {
        res.status(404).send(
          'Movie with the title ' +
            req.params.Title +
              ' was not found.'
        );
      }
    })
});

// GET JSON list Genres
app.get('/movies/genres', (req, res) => {
  Movies.distinct('Genre.Name')
    .then((genres) => {
      console.log('Genres found: ', genres); // Log the genres to check the output
      res.status(200).json(genres);
    })
    .catch((err) => {
      console.error('Error retrieving genres:', err);
      res.status(500).send('Error: ' + err);
    });
  }
);

// GET Genre by name
app.get("/movies/genre/:genreName", passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.genreName }) // Updated to match schema
      .then((genre) => {
        if (genre) {
          res.json(genre);
        } else {
          res.status(404).send("Genre not found");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// GET director by name
app.get("/movies/director/:directorName", passport.authenticate("jwt", { session: false }),
(req, res) => {
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


// --- UPDATE in Mongoose --

// Update user info by username
app.put('/users/:Username', passport.authenticate("jwt", { session: false }),
  [
      check("Username", "Username must be at least 5 characters").isLength({ min: 5 }),
      check("Username", "Username can only contain alphanumeric characters").isAlphanumeric(),
      check("Email", "Invalid email address").isEmail(),
      check("Password", "Password must not be empty").not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    // Condition to check user
    if(req.user.Username !== req.params.Username){
        return res.status(400).send("Permission denied");
    }
    // Condition End
    await Users.findOneAndUpdate (
      { Username: req.params.Username }, 
      { 
        $set:
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
      });
  
  }
);

// Delete user by user name
app.delete('/users/:Username', passport.authenticate("jwt", { session: false }),
async (req, res) => {
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
  }
);

// Remove favorite movie form user's list
app.delete("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }),
async (req, res) => {
    await Users.findOneAndUpdate (
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
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});