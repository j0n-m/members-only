const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const db = process.env.MONGODB;
const User = require('../models/user');
const Message = require('../models/message');
const bcrypt = require('bcryptjs');
const passport = require('passport');
require('dotenv').config();




exports.index = asyncHandler(async (req, res, next) => {
  const posts = await Message.find({}, 'author content dateCreated title').limit(10).populate('author').sort({ dateCreated: -1 }).exec()
  res.render('index', {
    posts,
    isAuthenticated: req.isAuthenticated(),
  });
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
  if (req.isAuthenticated()) {
    res.redirect('/')
  } else {
    res.render('signup_form')
  }

});
exports.signup_post = [
  body('firstname', 'First Name must be at least 2 characters.').trim().isLength({ min: 2, max: 10 }).withMessage('First Name must be between 2 and 10 characters.').escape(),
  body('lastname', 'Last Name must be at least 2 characters.').trim().isLength({ min: 2, max: 10 }).withMessage('Last Name must be between 2 and 10 characters.').escape(),
  body('username', 'Username must be between 3 and 16 characters.').trim().isLength({ min: 3, max: 16 }).toLowerCase().escape().custom(async (value) => {
    await mongoose.connect(db);
    const trimmedStr = value.replaceAll(" ", "");
    if (value !== trimmedStr) {
      throw new Error('Username cannot contain any spaces.')
    }

    const usernameExists = await User.findOne({ username: value }, 'username');
    if (usernameExists) {
      throw new Error('Username is already taken, choose another username.')
    }
    await mongoose.connection.close();
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
        res.render('signup_form', {
          user,
          errors: errors.array(),
        });
      } else {
        await user.save();
        await mongoose.connection.close()
        res.redirect('/login');
      }
    });


  })];

exports.login_get = asyncHandler((req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('login_form', {
    failArray: req.session.messages,
  });
})
exports.login_post = [
  body('username', 'Username must be between 3 and 16 characters.').trim().isLength({ min: 3, max: 16 }).escape(),
  body('password', 'Passwords must be at least 5 characters.').trim().isLength({ min: 5 }).escape(),
  passport.authenticate("local", { failureRedirect: '/login', failureMessage: true }),
  asyncHandler((req, res, next) => {
    res.redirect('/');
  })];

exports.join_get = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.render('unauthenticated', {
      title: 'Join the Members Only Club'
    })
  }
  if (req.user.membershipCode > 0) {
    //already a member
    return res.redirect('/')
  }
  res.render('join_form', {
    isAuthenticated: req.isAuthenticated(),
  })
});
exports.join_post = [
  body('code', 'Code must at least contain a character string.').trim().isLength({ min: 1 }).toLowerCase().custom((val) => {
    const correctCode = (val === process.env.MEMBER_CODE);
    if (correctCode) {
      return true;
    }
    throw new Error('Membership Code is either incorrect or expired.')

  }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('join_form', {
        isAuthenticated: req.isAuthenticated(),
        errors: errors.array()
      })
    }
    const user = await User.findById(req.user._id, 'membershipCode').exec();
    if (user.membershipCode === 0) {
      await User.findByIdAndUpdate(user._id, { membershipCode: 1 }).exec();
    }
    res.redirect('/');
  })];
exports.create_get = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.render('unauthenticated')
  }
  res.render('create_message')
});
exports.create_post = [
  body('title').trim().optional({ values: 'falsy' }).escape(),
  body('content', 'Content must be between 1 and 70 characters.').trim().isLength({ min: 2, max: 70 }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const message = new Message({
      author: req.user.id,
      title: req.body.title,
      content: req.body.content,
      dateCreated: Date.now()
    })
    if (!errors.isEmpty()) {
      return res.render('create_message', {
        post: message,
        errors: errors.array()
      })
    }
    await message.save();
    res.redirect('/');

  })];
exports.deletePost_get = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.redirect('/');
  }
  const message = await Message.findById(req.params.id).populate('author').exec();
  if (message == null) {
    return res.render('error', {
      error: `Cannot find the message with the id: ${req.params.id}`
    })
  }
  res.render('delete_post', {
    post: message
  })
})
exports.deletePost_post = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.redirect('/');
  }
  const messageToDelete = await Message.findById(req.body.post_id)
  if (messageToDelete == null) {
    const error = new Error('Cannot delete a post that doesn\'t exist.');
    return next(error)
  }
  await Message.findByIdAndDelete(messageToDelete._id)
  res.redirect('/');
})