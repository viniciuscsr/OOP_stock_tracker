const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const portifolio = require('./Routes/portifolio');
const user = require('./Routes/user');
const session = require('express-session');
const passport = require('passport');
const initializePassport = require('./passportConfig');
const methodOverride = require('method-override');

class Server {
  constructor() {
    this.initPassport();
    this.initViewEngine();
    this.initExpressMiddleware();
    this.initRoutes();
    this.start();
  }

  start() {
    app.listen(process.env.PORT || 3000, (err, res) => {
      console.log('Server is Running on port 3000');
    });
  }

  initViewEngine() {
    app.set('view engine', 'ejs');
    app.use('/public', express.static('public'));
  }

  initExpressMiddleware() {
    app.use(methodOverride('_method'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
  }

  initPassport() {
    initializePassport(passport);
    app.use(
      session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());
  }

  initRoutes() {
    app.use('/', portifolio);
    app.use('/user', user);
  }
}

new Server();
