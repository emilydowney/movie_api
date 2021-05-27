// Imports
const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');


const app = express();

let movies = [
    {
       name: 'The Avengers',
       director: 'Joss Whedon' 
    },
    {
        name: 'The Lord of the Rings: Return of the King',
        director: 'Peter Jackson' 
     },
     {
        name: 'Jurassic Park',
        director: 'Steven Spielberg' 
     },
     {
        name: 'Stardust',
        director: 'Matthew Vaughn' 
     },
     {
        name: 'Iron Man',
        director: 'Jon Favreau' 
     },
     {
        name: 'Star Trek',
        director: 'J.J. Abrams' 
     },
     {
        name: 'Harry Potter and the Prisoner of Azkaban',
        director: 'Alfonso Cuarón' 
     },
     {
        name: 'Guardians of the Galaxy',
        director: 'James Gunn' 
     },
     {
        name: 'Spider-Man: Homecoming',
        director: 'Jon Watts' 
     },
     {
        name: 'X-Men: First Class',
        director: 'Matthew Vaughn' 
     }
];

let users = [
   {
      username: 'emdowney'
   }
];

// Middleware
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An error occurred.');
})

// Get list of all movies
app.get('/movies', (req, res) => {
    res.json(movies);
});
// Get a movie by name
app.get('/movies/:name', (req, res) => {
    res.json(movies.find((movie) =>
      { return movie.name === req.params.name }));
});
// Get information about a certain genre
app.get('/genres/:name', (req, res) => {
   res.status(200).send('Successful GET request returning data for the specified genre.');
 });
 // Get information about a certain director 
 app.get('/directors/:name', (req, res) => {
    res.status(200).send('Successful GET request returning data of a director by name.')
 })
 // Register a new user
 app.post('/users', (req, res) => {
    let newUser = req.body;

    if (!newUser.username) {
       const message = 'Missing username in request body.';
       res.status(400).send(message);
    } else {
       newUser.id = uuid.v4();
       users.push(newUser);
       res.status(201).send(newUser);
    }
 });
// Change a user's username
 app.put('/users/:username', (req, res) => {
    let user = users.find((user) => {
       return user.username === req.params.username
    });

    if (user) {
       res.status(200).send('Username was changed.');
    } else {
       res.status(404).send('Student with the username ' + req.params.username + ' was not found.');
    }
 })
// Add a movie to a user's favorites
 app.post('/users/:username/:favorites', (req, res) => {
    res.status(200).send('Movie has been added to favorites.');
   });
 // Delete a movie from a user's favorite
 app.delete('/users/:username/:favorites', (req, res) => {
    res.status(200).send('Movie has been removed from favorites.');
 })

 // Allow users to deregister
 app.delete('/users/:username', (req, res) => {
    res.status(200).send('Email has been removed.');
 });

app.listen(8081, () => {
    console.log('Your app is listening on port 8081.');
});