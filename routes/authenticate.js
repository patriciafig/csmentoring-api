var mongoose = require('mongoose');
var User = mongoose.model('User');
var Mentor = mongoose.model('Mentor');
var Student = mongoose.model('Student');
var express = require('express');
var router = express.Router();
var inspect = require('util').inspect;
var Busboy = require('busboy');
var os = require('os');
var fs = require('fs');
var path = require('path');
var bCrypt = require('bcrypt-nodejs');
var fileType = require('file-type');
// Generates hash using bCrypt
var createHash = function(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

function getExtension(filename) {
    return filename.split(".").pop();
}

module.exports = function(passport) {

    //sends successful login state back to the angulr
    router.get('/success', function(req, res) {
        res.send({ state: 'success', user: req.user ? req.user : null });
    });

    //sends failure login state back to angular
    router.get('/failure', function(req, res) {
        res.send({ state: 'failure', user: null, message: "invalid username or password" });
    });

    //log in
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/auth/success',
        failureRedirect: '/auth/failure'
    }));
    var saveTo = ''
    //sign up
    router.post('/signup', function(req, res) {
        var busboy = new Busboy({ headers: req.headers });
        var input = new Object();
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            var extension = getExtension(filename);
            saveTo = path.join(__basedir + '/uploads/' + input.username + '-' + filename)
            file.pipe(fs.createWriteStream(saveTo));
            saveTo = __basedir + '/uploads/' + input.username + '-' + new Date().getTime() + '.' + extension
            input["profilePicture"] = '/uploads/' + input.username + '-' + new Date().getTime() + '.' + extension;
            fs.rename(__basedir + '/uploads/' + input.username + '-' + filename, saveTo, function(err) {
                if (err) console.log('ERROR: ' + err);
            });

        });
        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            input[fieldname] = inspect(val).replace(/\'/g, "");;
        });
        busboy.on('finish', function() {
            User.findOne({ 'username': input.username }, function(err, user) {
                // In case of any error, return using the done method
                if (err) {
                    console.log('Error in SignUp: ' + err);
                    s.unlinkSync(saveTo);
                    res.send(err)
                }
                // already exists
                if (user) {
                    console.log('User already exists with username: ' + input.username);
                    fs.unlinkSync(saveTo);
                    res.send("User already exists with username:" + input.username)
                } else {

                    // if there is no user, create the user
                    var newUser = new User();

                    // set the user's local credentials
                    newUser.username = input.username;
                    newUser.password = createHash(input.password);
                    newUser.userType = input.userType;
                    // save the user
                    newUser.save(function(err, user) {
                        if (err) {
                            console.log('Error in Saving user: ' + err);
                            res.send(err);
                            fs.unlinkSync(saveTo);
                        }
                        if (input.userType == "Student") {
                            var newStudent = new Student();
                            newStudent.username = input.username;
                            newStudent.name = input.name;
                            newStudent.email = input.email;
                            newStudent.contact = input.contact;
                            newStudent.profilePicture = input.profilePicture;
                            newStudent.about = '';
                            newStudent.grade = '';
                            newStudent.interests = [];
                            newStudent.mentors = [];
                            newStudent.save(function(err, student) {
                                if (err) {
                                    console.log("Student not created.")
                                    s.unlinkSync(saveTo);
                                } else {
                                    console.log("Student created.")
                                }

                            })
                        } else if (input.userType == "Mentor") {
                            var newMentor = new Mentor();
                            newMentor.username = input.username;
                            newMentor.name = input.name;
                            newMentor.email = input.email;
                            newMentor.contact = input.contact;
                            newMentor.profilePicture = input.profilePicture;
                            newMentor.about = '';
                            newMentor.position = '';
                            newMentor.interests = [];
                            newMentor.students = [];
                            newMentor.save(function(err, mentor) {
                                if (err) {
                                    console.log(err)
                                    console.log("Mentor not created.")
                                    s.unlinkSync(saveTo);
                                } else {
                                    console.log("Mentor created.")
                                }
                            })
                        }
                        console.log(input.username + ' Registration succesful');
                        res.send(user);
                    });
                }
            });
        });
        req.pipe(busboy);
    });

    //log out
    router.get('/signout', function(req, res) {
        req.logout();
        res.send("user logged out.")
    });
    //route to retain user details on client side
    router.get('/confirm-login', function(req, res) {
        res.send(req.user)
    });

    // route to test if the user is logged in or not
    router.get('/isAuthenticated', function(req, res) {
        res.send(req.isAuthenticated() ? req.user : '0');
    });

    return router;
}