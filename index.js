// Imports
const express = require('express'),
    morgan = require('morgan');

const app = express();

let favoriteMovies = [
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

// Middleware
app.use(morgan('common'));

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An error occurred.');
})

// Get requests
app.get('/movies', (req, res) => {
    res.json(favoriteMovies);
});

app.get('/', (req, res) => {
    res.send('Let\'s enjoy some movies!');
});

app.listen(8081, () => {
    console.log('Your app is listening on port 8081.');
});