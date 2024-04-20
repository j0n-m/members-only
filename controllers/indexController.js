const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const db = process.env.MONGODB;
const User = require('../models/user');
const Message = require('../models/user');
const bcrypt = require('bcryptjs');
const passport = require('passport');




exports.index = asyncHandler(async (req, res, next) => {
  // await mongoose.connection.close();
  // console.log('connection closed')
  res.render('index');
});
exports.logout_get = asyncHandler((req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    } else {
      res.redirect('/');
    }
  });
})

exports.signup_get = asyncHandler((req, res, next) => {
  res.render('signup_form')
});
exports.signup_post = [
  body('firstname', 'First Name must be at least 2 characters.').trim().isLength({ min: 2, max: 10 }).withMessage('First Name must be between 2 and 10 characters.').escape(),
  body('lastname', 'Last Name must be at least 2 characters.').trim().isLength({ min: 2, max: 10 }).withMessage('Last Name must be between 2 and 10 characters.').escape(),
  body('username', 'Username must be between 3 and 16 characters.').trim().isLength({ min: 3, max: 16 }).escape().custom(async (value) => {
    await mongoose.connect(db);
    const trimmedStr = value.replaceAll(" ", "");
    console.log('value:', value);
    console.log('trimmedVal:', trimmedStr);
    if (value !== trimmedStr) {
      console.log('inside value !== trimmed')
      throw new Error('Username cannot contain any spaces.')
    }

    const usernameExists = await User.findOne({ username: value }, 'username');
    console.log('usernameExists', usernameExists);
    if (usernameExists) {
      throw new Error('Username is already taken, choose another username.')
    }
    mongoose.connection.close();
  }),
  body('password', 'Passwords must be at least 5 characters.').trim().isLength({ min: 5 }).escape(),
  body('c_password', 'Passwords do not match.').trim().escape().custom((value, { req }) => {
    return value === req.body.password;
  }),
  asyncHandler(async (req, res, next) => {
    await mongoose.connect(db);

    bcrypt.hash(req.body.password, 8, async function (err, hash) {
      if (err) {
        throw new Error(err);
      }
      const errors = validationResult(req);
      const user = new User({
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        username: req.body.username,
        password: hash
      });
      if (!errors.isEmpty()) {
        console.log('There are errors!')
        res.render('signup_form', {
          user,
          errors: errors.array(),
        });
      } else {
        console.log('submitted!', user)
        await user.save();
        mongoose.connection.close()
        res.redirect('/');
      }
    });


  })];

exports.login_get = asyncHandler((req, res, next) => {
  res.render('login_form', {
    failArray: req.session.messages,
  });
})
exports.login_post = [
  body('username', 'Username must be between 3 and 16 characters.').trim().isLength({ min: 3, max: 16 }).escape(),
  body('password', 'Passwords must be at least 5 characters.').trim().isLength({ min: 5 }).escape(),
  passport.authenticate("local", { failureRedirect: '/login', failureMessage: true }),
  asyncHandler((req, res, next) => {
    res.locals.currentUser = req.user;
    console.log('req.user', req.user);
    res.redirect('/');
  })];