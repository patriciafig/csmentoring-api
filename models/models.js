var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//Creates a User Schema
var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    userType: String
});

//Creates Student Schema
var studentSchema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    contact: Number,
    about: String,
    grade: String,
    profilePicture: String,
    interests: [String],
    mentors: [{
        _id: String,
        contact: Number,
        email: String,
        name: String,
        username: String
    }]
})

//Creates Mentor Schema
var mentorSchema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    contact: Number,
    about: String,
    position: String,
    profilePicture: String,
    interests: [String],
    students: [{
        _id: String,
        contact: Number,
        email: String,
        name: String,
        username: String
    }]
})

var meetingSchema = new mongoose.Schema({
    studentId: String,
    mentorId: String,
    meetingTime: Date
});

var messageSchema = new mongoose.Schema({
    studentId: String,
    mentorId: String,
    attachment: String,
    message: String
});

var postSchema = new mongoose.Schema({
    postedBy: String,
    title: String,
    description: String,
    postTime: Date,
    attachment: String,
    comments: [{
        commentBody: String,
        commentBy: String,
        commentTime: Date
    }]
});


mongoose.model('User', userSchema);
mongoose.model('Student', studentSchema);
mongoose.model('Mentor', mentorSchema);
mongoose.model('Meeting', meetingSchema);
mongoose.model('Post', postSchema);
mongoose.model('Message', messageSchema);