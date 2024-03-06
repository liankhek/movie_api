const express = require('express'),
      morgan = require('morgan'),
      fs = require('fs'),
      path = require('path');

const app = express();

// setup logging
const logFilePath = path.join(__dirname, 'log.txt');
const accessLogStream = fs.createWriteStream(logFilePath, {flags: 'a'});

app.use(morgan('combined', {stream: accessLogStream}));  // enable morgan logging to 'log.txt'

//Express GET route at the endpoint "/movies"
app.get('/movies', (req, res) => {
    // Top 10 movies simple data
    const topMovies = [
        {title: 'Movie 1', rating: 9},
        {title: 'Movie 2', rating: 8},
        {title: 'Movie 3', rating: 6},
        {title: 'Movie 4', rating: 7},
        {title: 'Movie 5', rating: 9},
        {title: 'Movie 6', rating: 8},
        {title: 'Movie 7', rating: 9},
        {title: 'Movie 8', rating: 5},
        {title: 'Movie 9', rating: 8},
        {title: 'Movie 10', rating: 7}
    ];
    res.json(topMovies);
});

// Use express.static to serve "documentation.html" from the public folder
app.use(express.static('public'));

// Error handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// GET rout at endpoint '/'
app.get('/', (req, res) => {
    res.send('Welcome to movie API!');
});

// Server to listen on a port
app.listen(8080, () => {
    console.log('The app is listening on port 8080.');
});