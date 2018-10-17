var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/User");
var Book = require("../models/Book");
var Users=require("../models/auth")
// mongoose.model("auth")
// varrequire("../models/")
nodemailer = require('nodemailer');
async = require('async');
crypto = require('crypto');
bcrypt =require('bcrypt')
var waterfall = require('async-waterfall');


// var salt = bcryptNodejs.genSaltSync(10);
//  var hash = bcryptNodejs.hashSync("bacon", salt);
var smtpTransport = nodemailer.createTransport({
  service: process.env.MAILER_SERVICE_PROVIDER || 'Gmail',
  auth: {
    user: "shubhamsethikcm@gmail.com",
    pass:""
  }
});

router.get('/', function(req,res,next){
  res.send("Welcome");
})


router.post('/signup', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Please pass username and password.'});
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

router.post('/signin', function(req, res) {
 console.log(req.body.password)
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          // var token = jwt.sign(user.toJSON(), config.secret);
         
          let token = jwt.sign(user.toJSON(), config.secret, {
            expiresIn: "10000"
          })
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

router.post('/forgotpass' ,function(req, res) {
  console.log(req.body.email);
 waterfall([
    function(done) {
      console.log("------req.body.email------")
      User.findOne({
        username:req.body.email
      }).exec(function(err, user) {
        console.log("---------11",err,user);
        if (user) {
          done(err, user);
        } else {
          done('User not found.');
        }
      });
    },
    function(user, done) {
      console.log("user-------",user)
      // create the random token
      crypto.randomBytes(20, function(err, buffer) {
        var token = buffer.toString('hex');
        done(err, user, token);
      });
    },
    function(user, token, done) {
      console.log("------00----",user, token, done)
      User.findOneAndUpdate({username: user.username }, { Reset_password_Token: token, Reset_password_expires: Date.now() + 60000000 }, { upsert: true, new: true }).exec(function(err, new_user) {
        done(err, token, new_user);
      });
    },
    function(token, user, done) {
      var data = {
        to: user.username,
        from:"shubhamsethikcm@gmail.com",
        template: 'reset',
        subject: 'Password help has arrived!',
        html: `<h2>Password change link<h2>
         http://localhost:4200/reset/${token} `
        // context: {
        //   url: 'http://localhost:4200/reset?token=' + token
        //   // .split(' ')[0]
        //  }
      };

      smtpTransport.sendMail(data, function(err) {
        console.log(data);
        if (!err) {
          return res.json({ message: 'Kindly check your email for further instructions' });
        } else {
          return done(err);
        }
      });
    }
  ], function(err) {
    return res.status(422).json({ message: err });
  });
})

/**
 * Reset password
 */
router.post('/resetpassword' , function(req, res, next) {
  console.log(req.body.user1.confirmPassword);
  User.findOne({
    Reset_password_Token: req.body.token,
    Reset_password_expires: {
      $gt: Date.now()
    }
  }).exec(function(err, user) {
    console.log("jhergvhjv",user)
    
    if (user) {

      if (req.body.user1.confirmPassword) {
        user.password = req.body.user1.confirmPassword;
        user.Reset_password_Token = undefined;
        user.Reset_password_expires = undefined;
        user.save(function(err) {
          if (err) {
            return res.status(422).send({
              message: err
            });
          } else {
            var data = {
              to: user.username,
              from: "shubhamsethikcm@gmail.com",
              template: 'reset-password-email',
              subject: 'Password Reset Confirmation',
              html: `<h3>Greetings!!<h3>

              <p> Your password is now reset<p>
              <p>Redirect to login page <p>  http://localhost:4200`
            };

            smtpTransport.sendMail(data, function(err) {
              if (!err) {
                return res.json({ message: 'Password reset' });
              } else {
                return done(err);
              }
            });
          }
        });
      } else {
        return res.status(422).send({
          message: 'Passwords do not match'
        });
      }
    } else {
      return res.status(400).send({
        message: 'Password reset token is invalid or has expired.'
      });
    }
  });
})







router.post('/book', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    console.log(req.body);
    var newBook = new Book({
      isbn: req.body.isbn,
      title: req.body.title,
      author: req.body.author,
      publisher: req.body.publisher
    });

    newBook.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Save book failed.'});
      }
      res.json({success: true, msg: 'Successful created new book.'});
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});

router.get('/book', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    Book.find(function (err, books) {
      if (err) return next(err);
      res.json(books);
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});
router.post('/sociallogin',function(req,res){
//   console.log("djf",req.body);

//   Users.findOrCreate({ email:req.body.email },{name:req.body.name,email:req.body.email})
// }) 
Users.findOne({
    name: req.body.name
  }, function(err, user) {
    if (user) {
      return res.json({success:true})
    }
else{


  var newUser = new Users({
    name: req.body.name,
    email: req.body.email
  });

  // save the user
  newUser.save(function(err) {
    if(err){
      res.json({success: false,msg:'nahi hopaya'});
    }
    else
    res.json({success: true, msg: 'Successful created new user.'});
  });
}
});
})


getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = router;
