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

const Movies = Models.Movie,
      Users = Models.User,
      Genres = Models.Genre,
      Directors = Models.Director;


// Allows Mongoose to connect to the database
mongoose.connect("mongodb://localhost:27017/cfDB", { useNewUrlParser: true, useUnifiedTopology: true });

/*
// setup logging
const logFilePath = path.join(__dirname, "log.txt");
const accessLogStream = fs.createWriteStream(logFilePath, {flags: "a"});

app.use(morgan("combined", {stream: accessLogStream}));  // enable morgan logging to 'log.txt'

//Express GET route at the endpoint "/movies"
app.get("/movies", (req, res) => {
    // Top 10 movies simple data
    const topMovies = [
        {title: "Movie 1", rating: 9},
        {title: "Movie 2", rating: 8},
        {title: "Movie 3", rating: 6},
        {title: "Movie 4", rating: 7},
        {title: "Movie 5", rating: 9},
        {title: "Movie 6", rating: 8},
        {title: "Movie 7", rating: 9},
        {title: "Movie 8", rating: 5},
        {title: "Movie 9", rating: 8},
        {title: "Movie 10", rating: 7}
    ];
    res.json(topMovies);
});

// Use express.static to serve "documentation.html" from the public folder
app.use(express.static("public"));

// Error handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

*/

app.use(bodyParser.json());

// Midlware(log requestss to server)
app.use(morgan("common"));

// import auth into index

// default text response when at /
app.get("/", (req, res) => {
    res.send("Welcome to myFlix!");
});

// return JSON object when at /movies
app.get("/movies", (req, res) => {
    Movies.find()
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
app.get("/users", (req, res) => {
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
app.get("/users/:Username", (req, res) => {
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
app.get("/movies/:Title", (req, res) => {
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
app.get("/movies/genre/:genre", (req, res) => {
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
app.get("/movies/director/:directorName", (req, res) => {
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
app.post("/users", (req, res) => {
    Users.findOne({ Username: req.body.Username }) // check if the provided username already exists
        .then((user) => { // Handling Existing User
            if (user) {
                return res.status(400).send(req.body.Username + "already exists");
            } 
            else {
                //If the user doesn’t exist, use Mongoose’s 'create' command & create new user
                Users.create ({ 
                    Username: req.body.Username, // req.body is the request that the user sends
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                .then ((user) => {
                    res.status(201).json(user) // Return newly created user document in JSON format
                })
                .catch ((error) => {
                    console.error(error);
                    res.status(500).send("Error: " + error);
                })
            }
        })
        .catch ((error) => {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});


// ----------- UPDATE in Mongoose ------------------

// allow users to update their user info
app.put('/users/:Username', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true }) // This line makes sure that the updated document is returned
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    })
  
  });

// Allow user to Deregister
app.delete('/users/:Username', async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username }) // Change this line
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
app.post("/users/:Username/movies/:movieName", (req, res) => {
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
app.delete("/users/:Username/movies/:MovieID", (req, res) => {
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

// error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Error");
});

// listen on port
app.listen(8080, () => console.log("The app is listening on port 8080"))