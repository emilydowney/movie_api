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
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

// Middleware
/**
 * Defines CORS information
 */
let allowedOrigins = ['http://localhost:8081', 'http://localhost:1234', 'https://faveflix.netlify.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));
app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

// Authentication import
let auth = require('./auth')(app);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('An error occurred.');
})

app.get('/', (req, res) => {
  res.status(200).send('Enjoy the movies!')
})

/** 
 * GET request to retrieve a list of all movies 
 * @method GET
 * @param {string} endpoint
 * @returns {object} containing all movies
 * @requires jwt
 */
app.get('/movies', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

/** 
 * GET request to retrieve a single movie by name 
 * @method GET
 * @param {string} (:Title) endpoint
 * @returns {object} containing individual movie
 * @requires jwt
 */
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
/** 
 * GET request to retrieve information about a certain genre 
 * @method GET
 * @param {string} (:Name) endpoint
 * @returns {object} containing genre information
 * @requires jwt
 */
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
/** 
 * GET request to retrieve information about a certain director
 * @method GET
 * @param {string} (:Name) endpoint
 * @returns {object} containing director information
 * @requires jwt 
 */
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
/** 
 * Post request to register a new user 
 * @method POST
 * @param {object} object with user details
 * @returns {object} containing user information plus ID
 * @requires public
 */
app.post('/users',
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
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
            .then((user) => {
              res.status(201).json(user)
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

/** 
 * GET request to get information about a certain user
 * @method GET
 * @param {string} (:Username) endpoint
 * @returns {object} containing user information
 * @requires jwt 
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error ' + err);
    });
})

/** 
 * PUT request to change a user's information 
 * @method PUT
 * @param {string} object with user information
 * @returns {object} with updated user info
 * @requires jwt
 */
app.put('/users/:Username',
  [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ],
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.Username },
      {
        $set:
        {
          Username: req.body.Username,
          Password: hashedPassword,
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

/** 
 * POST request to add a movie to a user's favorites 
 * @method POST
 * @param {string} (:Username, :MovieID) endpoint
 * @returns {object} updated favorites list
 * @requires jwt
 */
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
/** 
 * DELETE request to remove a movie from a user's favorites 
 * @method DELETE
 * @param {string} (:Username, :MovieID) endpoint
 * @returns {object} updated favorites list
 * @requires jwt
 */
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

/** 
 * DELETE request to allow a user to remove their account 
 * @method DELETE
 * @param {string} (:Username) endpoint
 * @returns {message} message indicating successful deregistration
 * @requires jwt
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
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

// Information about port
const port = process.env.PORT || 8081;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
