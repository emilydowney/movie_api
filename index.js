// Imports
const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    Models = require('./models.js'),
    passport = require('passport'),
    cors = require('cors'); 

const { check, validationResult } = require('express-validator');

require('./passport');

const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect('mongodb://localhost:27017/[movieDB]', {
   //useNewUrlParser: true, useUnifiedTopology: true });

   mongoose.connect('process.env.CONNECTION_URI', {
      useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

// Authentication import
let auth = require('./auth')(app);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('An error occurred.');
})

// Get list of all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
   Movies.find()
      .then((movies) => {
         res.status(201).json(movies);
      })
      .catch((err) => {
         console.error(err);
         res.status(500).send('Error: ' + err);
      });
});

// Get a movie by name
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
   Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
         res.json(movie);
      })
      .catch((err) => {
         console.error(err);
         res.status(500).send('Error ' + err);
      });
});
// Get information about a certain genre
app.get('/genres/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
   Movies.findOne({ 'Genre.Name': req.params.Name })
      .then((movie) => {
         res.json(movie.Genre)
      })
      .catch((err) => {
         console.error(err);
         res.status(500).send('Error ' + err);
      });
});
 // Get information about a certain director 
 app.get('/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
   Movies.findOne({ 'Director.Name': req.params.Name })
   .then((movie) => {
      res.json(movie.Director);
   })
   .catch((err) => {
      console.error(err);
      res.status(500).send('Error ' + err);
   });
 })
 // Register a new user
 app.post('/users', 
   [
   check('Username', 'Username is required').isLength({min: 5}),
   check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
   check('Password', 'Password is required').not().isEmpty(),
   check('Email', 'Email does not appear to be valid').isEmail()
   ], (req, res) => {
    let errors = validationResult(req);
    
    if (!errors.isEmpty()) {
       return res.status(422).json({ errors: errors.array() });
    }

    let hashPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
    .then((user) => {
       if (user) {
          return res.status(400).send(req.body.Username + ' already exists.');
       } else {
          Users
            .create({
               Username: req.body.Username,
               Password: hashedPassword,
               Email: req.body.Email,
               Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user)
            })
            .catch((error) => {
               console.error(error);
               res.status(500).send('Error: ' + error);
            });
         }  
      })
      .catch((error) => {
         console.error(error);
         res.status(500).send('Error: ' + error);
      });
   });

// Change a user's information
 app.put('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },
      { $set: 
         {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
         }
      },
      { new: true },
      (err, updatedUser) => {
         if (err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
         } else {
            res.json(updatedUser);
         }
      }); 
 });
// Add a movie to a user's favorites
 app.post('/users/:Username/favorites/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },
      {
         $push: { Favorites: req.params.MovieID }
      },
      { new: true },
      (err, updatedUser) => {
         if (err) {
            console.error(err);
            res.status(500).send('Error ' + err);
         } else {
            res.json(updatedUser);
         }
      });    
   });
 // Delete a movie from a user's favorite
 app.delete('/users/:Username/favorites/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
   Users.findOneAndUpdate({ Username: req.params.Username },
      {
         $pull: { Favorites: req.params.MovieID }
      },
      { new: true },
      (err, updatedUser) => {
         if (err) {
            console.error(err);
            res.status(500).send('Error ' + err);
         } else {
            res.json(updatedUser);
         }
      });    
   });

 // Allow users to deregister
 app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
         if(!user) {
            res.status(400).send(req.params.Username + ' was not found.');
         } else {
            res.status(200).send(req.params.Username + ' was deleted.');
         }
      })
      .catch((err) => {
         console.error(err);
         res.status(500).send('Error: ' + err);
      });
 });

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
   console.log('Listening on Port ' + port);
});
