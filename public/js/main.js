// websockets
var socket = io.connect('http://localhost');

socket.on('mail', function (data) {
    processMail(data);
});

// message processing
function processMail (data) {
    console.log(data);
    if (data.subject.length > 0) document.getElementById('subject').innerText = data.subject;
    if (data.msg.length > 0) document.getElementById('message').innerText = data.msg;
};