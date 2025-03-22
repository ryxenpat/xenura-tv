var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
const { Server } = require("socket.io");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
/*app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');*/

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

var server = http.createServer(app); // Create HTTP server
var io = new Server(server); // Attach Socket.IO to the server

// Socket.IO Chat Feature
io.on('connection', (socket) => {
    //console.log('A user connected');

    // Receive chat messages and broadcast to everyone
    socket.on('chat message', (msg) => {
    	console.log("Someone said: ", msg);
    	if(msg !== ""){
        	io.emit('chat message', msg); // Send to all clients
        }else{
        	console.log("Someone sent an empty message, this was not sent.");
        }
    });

    /*socket.on('disconnect', () => {
        console.log('User disconnected');
    });*/
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  //next(createError(404));
  res.status( 404 ).sendFile( __dirname + '/public/404.html' );
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Start the server (IMPORTANT: Use server, not app)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
