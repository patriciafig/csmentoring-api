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

    //sends successful login state back to the angular
    router.get('/success', function(req, res) {
        if (req.user.userType === 'Student') {
            Student.findOne({'username': req.user.username}, function(err, student) {
                if (err) {
                    console.log('Could not find a Student with the username ' + req.user.username)
                    res.send(err);
                } else {
                    res.send({ state: 'success', id: student._id, user: req.user})
                }
            });
        } else if (req.user.userType === 'Mentor') {
            Mentor.findOne({'username': req.user.username}, function(err, student) {
                if (err) {
                    console.log('Could not find a Mentor with the username ' + req.user.username)
                    res.send(err);
                } else {
                    res.send({ state: 'success', id: student._id, user: req.user})
                }
            });
        } else {
            res.send({state: 'failure', user: null, message: "userType is not Student or Mentor, instead was " + req.user.userType});
        }
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
    var saveTo = '';
    //sign up
    router.post('/signup', function(req, res) {
        User.findOne({ 'username': req.body.username }, function(err, user) {
            // In case of any error, return using the done method
            if (err) {
                console.log('Error in SignUp: ' + err);
                s.unlinkSync(saveTo);
                res.send(err)
            }
            // already exists
            if (user) {
                console.log('User already exists with username: ' + req.body.username);
                fs.unlinkSync(saveTo);
                res.send("User already exists with username:" + req.body.username)
            } else {
                // if there is no user, create the user
                var newUser = new User();

                // set the user's local credentials
                newUser.username = req.body.username;
                newUser.password = createHash(req.body.password);
                newUser.userType = req.body.userType;
                // save the user
                newUser.save(function(err, user) {
                    if (err) {
                        console.log('Error in Saving user: ' + err);
                        res.send(err);
                        fs.unlinkSync(saveTo);
                    }
                    if (req.body.userType === "Student") {
                        var newStudent = new Student();
                        newStudent.username = req.body.username;
                        newStudent.name = req.body.name;
                        newStudent.email = req.body.email;
                        newStudent.contact = req.body.contact;
                        newStudent.profilePicture = req.body.profilePicture;
                        newStudent.about = '';
                        newStudent.grade = '';
                        newStudent.interests = [];
                        newStudent.mentors = [];
                        newStudent.save(function(err, student) {
                            if (err) {
                                console.log("Student not created.");
                                s.unlinkSync(saveTo);
                            } else {
                                console.log("Student created.")
                            }

                        })
                    } else if (req.body.userType === "Mentor") {
                        var newMentor = new Mentor();
                        newMentor.username = req.body.username;
                        newMentor.name = req.body.name;
                        newMentor.email = req.body.email;
                        newMentor.contact = req.body.contact;
                        newMentor.profilePicture = req.body.profilePicture;
                        newMentor.about = '';
                        newMentor.position = '';
                        newMentor.interests = [];
                        newMentor.students = [];
                        newMentor.save(function(err, mentor) {
                            if (err) {
                                console.log(err);
                                console.log("Mentor not created.");
                                s.unlinkSync(saveTo);
                            } else {
                                console.log("Mentor created.")
                            }
                        })
                    }
                    console.log(req.body.username + ' Registration successful');
                    res.send(user);
                });
            }
        });
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