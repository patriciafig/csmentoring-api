var mongoose = require('mongoose');
var User = mongoose.model('User');
var Mentor = mongoose.model('Mentor');
var Student = mongoose.model('Student');
var Meeting = mongoose.model('Meeting');
var Message = mongoose.model('Message');
var Post = mongoose.model('Post');
var express = require('express');
var passport = require('passport');
var fs = require('fs');
var path = require('path');
var router = express.Router();

var inspect = require('util').inspect;
var Busboy = require('busboy');

function getExtension(filename) {
    return filename.split(".").pop();
}

function isAuthenticated(req, res, next) {

    if (req.method === "GET") {
        return next();
    }
    if (req.isAuthenticated()) {
        return next();
    }
    return res.send('User authentication failed!');
}

//utility endpoint to delete all users
router.route('/users')
    .delete(function(req, res) {
        User.remove({}, function(err) {
            if (err)
                return res.send(err);
            Student.remove({}, function(err) {
                if (err)
                    res.send(err);
                Mentor.remove({}, function(err) {
                    if (err)
                        return res.send(err);
                    return res.send("all users deleted");
                });
            });
        });
    })
    .get(function(req, res) {
        User.find(function(err, students) {
            if (err) {
                return res.writeHead(500, err);
            }
            return res.send(students);
        });
    });

//get list of all students
router.route('/students')
    .get(function(req, res) {
        console.log('Here');
        Student.find(function(err, students) {
            if (err) {
                return res.writeHead(500, err);
            }
            return res.send(students);
        });
    })
    .put(function(req, res) {
        Student.findById(req.body._id, function(err, student) {
            if (err)
                return res.send(err);
            student.about = req.body.about;
            student.grade = req.body.grade;
            student.interests = req.body.interests;
            student.save(function(err, student) {
                if (err)
                    return res.send(err);

                return res.json(student);
            });
        });
    });

//get list of all mentors
router.route('/mentors')
    .get(function(req, res) {
        Mentor.find(function(err, mentors) {
            if (err) {
                return res.writeHead(500, err);
            }
            return res.send(mentors);
        });
    })
    .put(function(req, res) {
        Mentor.findById(req.body._id, function(err, mentor) {
            if (err)
                return res.send(err);
            mentor.about = req.body.about;
            mentor.position = req.body.position;
            mentor.interests = req.body.interests;
            mentor.save(function(err, mentor) {
                if (err)
                    return res.send(err);

                return res.json(mentor);
            });
        });
    });

//get details of a particular student
router.route('/student/:studentId')
    .get(function(req, res) {
        Student.findById(req.params.studentId, function(err, student) {
            if (err)
                res.send(err);
            res.json(student);
        });
    });

//get details of a particular student
router.route('/mentor/:mentorId')
    .get(function(req, res) {
        Mentor.findById(req.params.mentorId, function(err, mentor) {
            if (err)
                res.send(err);
            res.json(mentor);
        });
    });

//remove all a mentor allocated to a student
router.route('/removeMentor')
    .put(function(req, res) {
        Mentor.findById(req.body.mentorId, function(err, mentor) {
            if (err)
                return res.send(err);
            for (var i = 0; i < mentor.students.length; i++) {
                if (mentor.students[i]._id == req.body.studentId) {
                    mentor.students.splice(i, 1)
                }
            }
            mentor.save(function(err, mentor) {
                if (err)
                    return res.send(err);
                Student.findById(req.body.studentId, function(err, student) {
                    if (err)
                        return res.send(err);
                    for (var i = 0; i < student.mentors.length; i++) {
                        if (student.mentors[i]._id == req.body.mentorId) {
                            student.mentors.splice(i, 1)
                        }
                    }
                    student.save(function(err, student) {
                        if (err)
                            return res.send(err);
                        return res.json('Remove successful!');
                    });
                });
            });
        });
    });

// allocate a mentor to a student
router.route('/addMentor')
    .put(function(req, res) {
        Mentor.findById(req.body.mentorId, function(err, mentor) {
            if (err)
                return res.send(err);
            var studs = mentor.students;
            Student.findById(req.body.studentId, function(err, student) {
                if (err) {
                    return res.send(err);
                }
                var tempStudent = {
                    _id: student._id,
                    contact: student.contact,
                    email: student.email,
                    name: student.name,
                    username: student.username
                };
                studs.push(tempStudent);
                mentor.students = studs;
                mentor.save(function(err, mentor) {
                    if (err)
                        return res.send(err);

                    Student.findById(req.body.studentId, function(err, student) {
                        if (err)
                            return res.send(err);
                        var ments = student.mentors;
                        Mentor.findById(req.body.mentorId, function(err, mentor) {
                            if (err) {
                                return res.send(err);
                            }
                            var tempMentor = {
                                _id: mentor._id,
                                contact: mentor.contact,
                                email: mentor.email,
                                name: mentor.name,
                                username: mentor.username
                            };
                            ments.push(tempMentor);
                            student.mentors = ments;
                            student.save(function(err, student) {
                                if (err)
                                    return res.send(err);
                                return res.send("Update successfull!")
                            });
                        });
                    });

                });
            });
        });
    });

//create new meeting and get all meetings
router.route('/meeting')
    .post(function(req, res) {
        var newMeeting = new Meeting();
        newMeeting.studentId = req.body.studentId;
        newMeeting.mentorId = req.body.mentorId;
        newMeeting.meetingTime = new Date(req.body.meetingTime);
        newMeeting.save(function(err, meeting) {
            if (err) {
                return res.send(err)
            }
            return res.json(meeting)
        })
    })
    .get(function(req, res) {
        Meeting.find(function(err, meetings) {
            if (err) {
                return res.writeHead(500, err);
            }
            return res.send(meetings);
        });
    });

//get, put and delete by meeting_id
router.route('/meeting/:id')
    .get(function(req, res) {
        Meeting.findById(req.params.id, function(err, meeting) {
            if (err)
                res.send(err);
            res.json(meeting);
        });
    })
    .put(function(req, res) {
        Meeting.findById(req.params.id, function(err, meeting) {
            if (err)
                res.send(err);

            meeting.meetingTime = req.body.meetingTime;

            meeting.save(function(err, meeting) {
                if (err)
                    res.send(err);

                res.json(meeting);
            });
        });
    })
    .delete(function(req, res) {
        Meeting.remove({
            _id: req.params.id
        }, function(err) {
            if (err)
                res.send(err);
            res.json("deleted :(");
        });
    });

//get meetings by student ID
router.route('/studentMeetings/:studentId')
    .get(function(req, res) {
        Meeting.find({ studentId: req.params.studentId }, function(err, meetings) {
            if (err)
                res.send(err);
            res.json(meetings);
        });
    });

//get meetings by mentor ID
router.route('/mentorMeetings/:mentorId')
    .get(function(req, res) {
        Meeting.find({ mentorId: req.params.mentorId }, function(err, meetings) {
            if (err)
                res.send(err);
            res.json(meetings);
        });
    });

var saveTo = '';
//create new post and get all posts
router.route('/posts')
    .post(function(req, res) {
        saveTo = '';
        var busboy = new Busboy({ headers: req.headers });
        var input = new Object();
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            var extension = getExtension(filename);
            saveTo = path.join(__basedir + '/attachments/' + input.postedBy + '-' + filename);
            file.pipe(fs.createWriteStream(saveTo));
            saveTo = __basedir + '/attachments/' + input.postedBy + '-' + new Date().getTime() + '.' + extension;
            input["attachment"] = '/attachments/' + input.postedBy + '-' + new Date().getTime() + '.' + extension;
            fs.rename(__basedir + '/attachments/' + input.postedBy + '-' + filename, saveTo, function(err) {
                if (err) console.log('ERROR: ' + err);
            });

        });
        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            input[fieldname] = inspect(val).replace(/\'/g, "");
        });
        busboy.on('finish', function() {
            var newPost = new Post();
            newPost.postedBy = input.postedBy;
            newPost.title = input.title;
            newPost.description = input.description;
            newPost.attachment = input.attachment;
            newPost.postTime = new Date();
            newPost.comments = [];
            newPost.save(function(err, post) {
                if (err) {
                    return res.send(err);
                    fs.unlinkSync(saveTo);
                }
                return res.json(post)
            })
        });
        req.pipe(busboy);

    })
    .get(function(req, res) {
        Post.find(function(err, posts) {
            if (err) {
                return res.writeHead(500, err);
            }
            return res.send(posts);
        });
    })
    .delete(function(req, res) {
        Post.remove({}, function(err) {
            if (err)
                return res.send(err);
            return res.send("all posts deleted");
        });
    });


//create new post and get all posts
router.route('/messages')
    .post(function(req, res) {
        saveTo = '';
        var busboy = new Busboy({ headers: req.headers });
        var input = new Object();
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            var extension = getExtension(filename);
            saveTo = path.join(__basedir + '/attachments/' + input.studentId + '-' + input.mentorId + '-' + filename);
            file.pipe(fs.createWriteStream(saveTo));
            saveTo = __basedir + '/attachments/' + input.studentId + '-' + input.mentorId + '-' + new Date().getTime() + '.' + extension;
            input["attachment"] = '/attachments/' + input.studentId + '-' + input.mentorId + '-' + new Date().getTime() + '.' + extension;
            fs.rename(__basedir + '/attachments/' + input.studentId + '-' + input.mentorId + '-' + filename, saveTo, function(err) {
                if (err) console.log('ERROR: ' + err);
            });

        });
        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            input[fieldname] = inspect(val).replace(/\'/g, "");
        });
        busboy.on('finish', function() {
            var newMessage = new Message();
            newMessage.studentId = input.studentId;
            newMessage.mentorId = input.mentorId;
            newMessage.message = input.message;
            newMessage.attachment = input.attachment;
            newMessage.save(function(err, message) {
                if (err) {
                    return res.send(err);
                    fs.unlinkSync(saveTo);
                }
                return res.json(message);
            })
        });
        req.pipe(busboy);
    })
    .get(function(req, res) {
        Message.find(function(err, messages) {
            if (err) {
                return res.writeHead(500, err);
            }
            return res.send(messages);
        });
    })
    .delete(function(req, res) {
        Message.remove({}, function(err) {
            if (err)
                return res.send(err);
            return res.send("all messages deleted");
        });
    });


//get details of a particular post
router.route('/posts/:postId')
    .get(function(req, res) {
        Post.findById(req.params.postId, function(err, post) {
            if (err)
                res.send(err);
            res.json(post);
        });
    });

router.route('/addComments/:postId')
    .put(function(req, res) {
        Post.findById(req.params.postId, function(err, post) {
            if (err)
                res.send(err);
            var tdate = new Date();
            var newComment = {
                commentBody: req.body.commentBody,
                commentBy: req.body.commentBy,
                commentTime: tdate
            };
            var cmts = post.comments;
            cmts.push(newComment);
            post.comments = cmts;
            post.save(function(err, post) {
                if (err)
                    res.send(err);

                res.json(post);
            });
        });
    });

router.route('/deleteComment/:postId/:commentId')
    .put(function(req, res) {
        Post.findById(req.params.postId, function(err, post) {
            if (err)
                res.send(err);
            for (var i = 0; i < post.comments.length; i++) {
                if (post.comments[i]._id == req.params.commentId) {
                    post.comments.splice(i, 1)
                }
            }
            post.save(function(err, post) {
                if (err)
                    res.send(err);

                res.json(post);
            });
        });
    });


module.exports = router;