const bodyParser = require("body-parser"); // Body parsing middleware
const express = require("express"); // Express framework
const app = express();
const uuid = require("uuid"); // UUID module generate a unique ID

app.use(bodyParser.json()); // Adding JSON body parsing middleware to Express

//----- Arrays containing user and movie data----
let users = [
    {
        id: 1,
        name: "Lina",
        favoriteMovies: []
    },
    {
        id: 2,
        name: "James",
        favoriteMovies: ["Avatar", "The Moon"]
    },
    {
        id: 3,
        name: "Sophie",
        favoriteMovies: ["Inception", "The Matrix"]
    }
];

let movies = [
    {
        Title: "The Princess Bride",
        Description: "While home sick in bed, a young boy's grandfather reads him the story of a farmboy-turned-pirate who encounters numerous obstacles, enemies, and allies in his quest to be reunited with his true love.",
        Genre: {
            Name: "Action",
            Description: "Action film is a genre in which the protagonist or protagonists are thrust into a series of events that typically include a resourceful hero struggling against incredible odds."
        },
        Director: {
            Name: "Rob Reiner",
            Bio: "When Rob graduated high school, his parents advised him to participate in summer Theatre. Reiner got a job as an apprentice in the Bucks County Playhouse in New Hope, Pennsylvania.",
            Birth: 1947
        },
        ImageURL: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSWcSl0pgMNJmy5MIP1jOrhVarb7GyOeJ8lx_mPMJuXCXuWqrqA"
    },
    {
        Title: "Inception",
        Description: "A thief who enters the dreams of others to steal their secrets faces a new challenge: planting an idea into someone's mind.",
        Genre: {
            Name: "Sci-Fi",
            Description: "Science fiction film is a genre that uses speculative, fictional science-based depictions of phenomena that are not fully accepted by mainstream science, such as extraterrestrial lifeforms, alien worlds, extrasensory perception, and time travel."
        },
        Director: {
            Name: "Christopher Nolan",
            Bio: "Christopher Edward Nolan is a British-American film director, producer, and screenwriter. He is one of the highest-grossing directors in history and among the most acclaimed and influential filmmakers of the 21st century.",
            Birth: 1970
        },
        ImageURL: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQ1wNJi3WBo8wjZ-lxg4xPbg6-X7tQ1w6ZFI5L-RH1rUiOOGxLO"
    }
];

// READ: get the list of movies
app.get("/movies", (req, res) => {
    res.status(200).json(movies);// Send a JSON response with the list of movies
});

// READ: get details of a specific movie by title
app.get("/movies/:title", (req, res) => {
    //const title = req.params.title;
    const { title } = req.params; // object destructuring (create new variable) Extract movie title from request parameters
    const movie = movies.find(movie => movie.Title === title); // Finding the movie in the movies array

    if (movie) {
        res.status(200).json(movie);
    }
    else {
        res.status(404).send("Movie not found");
    }
});

// READ: get the genre details by genre name
app.get("/movies/genre/:genreName", (req, res) => {
    const { genreName } = req.params; 
    const genre = movies.find(movie => movie.Genre.Name === genreName).Genre; // Find the genre with the given name

    if (genre) {
        res.status(200).json(genre);//JSON response with the details of the genre
    }
    else {
        res.status(400).send("No such Genre");
    }
});

// READ: get director details by director name
app.get("/movies/directors/:directorName", (req, res) => {
    const { directorName } = req.params; 
    const director = movies.find(movie => movie.Director.Name === directorName).Director; // Finding the director with the given name

    if (director) {
        res.status(200).json(director);
    }
    else {
        res.status(400).send("No such Director Name");
    }
});

// CREATE: Endpoint to add new user
app.post("/users", (req, res) => {
    const newUser = req.body;
    
    if (newUser.name) {
        newUser.id = uuid.v4();// Generating a unique ID
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        res.status(400).send("Need user Name");
    }
});

/*
// UPDATE: update user information (name and favorite Movies)
app.put("/users/:id", (req, res) => {
    const { id } = req.params; // Extracting user ID(string) from request parameters
    const updatedUser = req.body;// Extracting updated user information from the request body
    
    let user = users.find( user => user.id == id); // equal urser.id(number) and id(string) or cast one the value to get same value

    if(user !== -1){
        if (updatedUser.name) {
        user.name = updatedUser.name;// Updating the user's name
        } 
        if (updatedUser.favoriteMovies && Array.isArray(updatedUser.favoriteMovies)) {
            user.favoriteMovies = updatedUser.favoriteMovies;
        }

        res.status(200).json(user);

    } else {
        res.status(404).send("User not found");
        }
});
*/

// UPDATE: update user information (name)
app.put("/users/:id", (req, res) => {
    const { id } = req.params; // Extracting user ID(string) from request parameters
    const updatedUser = req.body;// Extracting updated user information from the request body
    
    let user = users.find( user => user.id == id); // equal urser.id(number) and id(string) or cast one the value to get same value

    if (user) {
        user.name = updatedUser.name;// Updating the user's name
        res.status(200).json(user);
    } else {
        res.status(400).send("User not found");
    }
});

// CREATE: add a movie to a user's favorite list
app.post("/users/:id/:movieTitle", (req, res) => {
    const { id, movieTitle } = req.params; // id string
    
    let user = users.find( user => user.id == id);// Finding the user in the users array

    if (user) {
        user.favoriteMovies.push(movieTitle);// Add the movie to the user's favorite list
        res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
    } else {
        res.status(404).send("User not found");
    }
});

// DELETE: remove a movie from a user's favorite list
app.delete("/users/:id/:movieTitle", (req, res) => {
    const { id, movieTitle } = req.params; // id string
    
    let user = users.find( user => user.id == id); 

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title != movieTitle);// Remove the movie from the user's fav list
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`);
    } else {
        res.status(404).send("User not found");// Send an error response if user not found
    }
});

// DELETE: delete a user
app.delete("/users/:id", (req, res) => {
    const { id } = req.params; // id string
    
    let user = users.find( user => user.id == id); 

    if (user) {
        users = users.filter(user => user.id != id);// Remove the user from the users array
        res.status(200).send(`User ${id} has been deleted`);
    } else {
        res.status(404).send("User not found");
    }
});


app.listen(8080, () => console.log("The App is listening on port 8080"));

