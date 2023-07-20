const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//SET STATIC FOLDER
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Server Bot'
//RUN WHEN CLIENT CONNECTS
io.on('connection', socket => {
    
    socket.on('joinRoom', ({username, room})=> {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Welcome to Torrens Cord!'));   //INSERT NAME APP. Message received to all the clients

        //Broadcast when a user connects. The message will be receved by all clients, apart the one connected. 
        socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has connected`)); 
        //socket.io would send message to all clients
                
        //Send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

        //Broadcast when user disconnects
        socket.on('disconnect', () =>{
        const user = userLeave(socket.id);
        
        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            //Send user and room info
            io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
        }
    });
    })
    
    //Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log('Server running on port ', PORT));