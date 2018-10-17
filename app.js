var express = require('express');
var path = require('path');
var cors = require('cors');
var cookie=require('cookie')
// var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/database');
var User = require("./models/auth");
var hello=mongoose.model("auth")
var api = require('./routes/api');
 const server = require('http');
var app = express();
app.use(cors());
// const port=3001;
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};
 app.use(function (req, res, next) {
   res.setHeader('Access-Control-Allow-Origin');
  // res.setHeader('Access-Control-Allow-Methods', 'POST');
  // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//   res.setHeader('Access-Control-Allow-Credentials', true);
   next();
 });

mongoose.connect(config.database)
  .then(() =>  console.log('connection succesful'))
  .catch((err) => console.error(err));

app.use(passport.initialize());

// let fullPath = '/dist/ng4social-test/'
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended':'false'}));
// app.use(express.static('dist'));

// app.use('/login',express.static(path.join(__dirname, 'dist')));
// app.use('/books', express.static(path.join(__dirname, 'dist')));
// app.use('/forgot', express.static(path.join(__dirname, 'dist')));
// app.use('/auth',auth); 

app.use('/api', api);

// app.get('/', function(req, res){
//   res.sendFile(path.join(__dirname,fullPath,'index.html'));
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});
// const Server = app.createServer(app);
// Server.listen(process.env.PORT || 5000)

app.listen(process.env.PORT || 5000)
  
module.exports = app;
