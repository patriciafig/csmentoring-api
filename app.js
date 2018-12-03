// Run packages
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');


var mongoose = require('mongoose');
mongoose.connect('mongodb://root:mainroot1@ds157599.mlab.com:57599/heroku_gl4nd1gd');
//mongoose.connect('mongodb://localhost/27017/csm', { useMongoClient: true });
// mongoose.connect('mongodb://localhost/mongoose_basics', (error) => {
//     if(!error) {
//         console.log("mongoose is connected now");
//     }
// }); // use to run locally


require('./models/models');
var inspect = require('util').inspect;
var Busboy = require('busboy');

var api = require('./routes/api');
var authenticate = require('./routes/authenticate')(passport);
var app = express();
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
global.__basedir = __dirname;

//Set up app
app.use(logger('dev'));
app.use(session({
    secret: 'csm',
    saveUninitialized: true,
    resave: true
}));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', api);
app.use('/auth', authenticate);

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname));
})
//Initialiaze passport
var initPassport = require('./passport-init');
initPassport(passport);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send(err)
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err)
});

http.createServer(app).listen(app.get('port'), app.get('ip'), function() {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
});

module.exports = app;