require('dotenv').config();
const express = require('express')
const session = require('express-session');
const mongoStore = require('connect-mongo');
const httpLogger = require('morgan');
const mongoose = require('mongoose');
const dbConnectionTest = require('./config/database').dbConnectionTest;
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const User = require('./models/user');
const bcrypt = require('bcryptjs')
const db = process.env.MONGODB;

//Routers
const indexRouter = require('./routes/index');

const app = express();
app.set("views", path.join(__dirname, 'views'));
app.set('view engine', 'pug')
dbConnectionTest().catch((err) => {
  console.log(err)
  return next(err);
});
app.use(async (req, res, next) => {
  try {
    await mongoose.connect(db);
    next();
  } catch (error) {
    return next(error)
  }
})

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      };
      // if (user.password !== password) {
      //   return done(null, false, { message: "Incorrect password" });
      // };
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password" })
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    };
  })
);
passport.serializeUser((user, done) => {
  console.log('serialize is called', user)
  done(null, user.id); //sets req.session.passport.user == user.id 
});

//id == req.session.passport.user
//after each authenticated request,it grabs from req.session.passport.user that was created from express-sessions
//after deserializing, it attaches user db object to req -> req.user [can be changed by using a different db query below]
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('username membershipCode isAdmin');
    done(null, user); //ataches user to request obj (req.user)
  } catch (err) {
    done(err);
  };
});
app.use(httpLogger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore.create({
    mongoUrl: process.env.MONGO_STORE,
    collectionName: 'sessions',
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
}));
app.use(passport.session());
app.use((req, res, next) => {
  console.log('currentUser is set in middleware');
  res.locals.currentUser = req.user;
  const numConnections = mongoose.connection.base.connections.length;
  console.log('open connections:', numConnections);
  next();
})

app.use('/', indexRouter);




//error handling in middleware
app.use((error, req, res, next) => {
  if (error) {
    console.log(error);
    res.render('error', {
      error: 'An error occured. Failure to complete the request.',
    })
  }
})
//error route handling
app.use((req, res, next) => {
  res.status(404).render('error');
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening at port: ${PORT}`);
})

module.exports = app;