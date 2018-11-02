var mongoose = require('mongoose');
var User = mongoose.model('User');
var Student = mongoose.model('Student');
var Mentor = mongoose.model('Mentor');
var LocalStrategy = require('passport-local').Strategy;
var async = require('async');
var crypto = require('crypto');
var bCrypt = require('bcrypt-nodejs');

var inspect = require('util').inspect;
var Busboy = require('busboy');

module.exports = function(passport) {

    // Passport needs to be able to serialize and deserialize users to support persistent login sessions
    passport.serializeUser(function(user, done) {
        console.log('serializing user:', user.username);
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            console.log('deserializing user:', user.username);
            done(err, user);
        });
    });

    passport.use('login', new LocalStrategy({
            passReqToCallback: true
        },
        function(req, username, password, done) {
            // check in mongo if a user with username exists or not
            User.findOne({ 'username': username },
                function(err, user) {
                    // In case of any error, return using the done method
                    if (err)
                        return done(err);
                    // Username does not exist, log the error and redirect back
                    if (!user) {
                        console.log('User Not Found with username ' + username);
                        return done(null, false);
                    }
                    // User exists but wrong password, log the error
                    if (!isValidPassword(user, password)) {
                        console.log('Invalid Password');
                        return done(null, false); // redirect back to login page
                    }
                    // User and password both match, return user from done method
                    // which will be treated like success
                    return done(null, user);
                }
            );
        }
    ));

    var isValidPassword = function(user, password) {
        return bCrypt.compareSync(password, user.password);
    };
};