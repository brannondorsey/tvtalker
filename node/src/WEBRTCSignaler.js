// Hacked from https://github.com/muaz-khan/WebRTC-Experiment/tree/master/websocket-over-nodejs
var fs = require('fs');
var _static = require('node-static');
var file = new _static.Server(__dirname + '/../data/SignalerDocumentRoot', {
    cache: false
});

var app = require('http').createServer(function(request, response){

    request.addListener('end', function () {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        file.serve(request, response);
    }).resume();
});

var port = 3002; // default port

function WebRTCSignaler() {

    var io = require('socket.io').listen(app, {
        log: true,
        origins: '*:*'
    });

    io.set('transports', [
        // 'websocket',
        'xhr-polling',
        'jsonp-polling'
    ]);

    var channels = {};

    io.sockets.on('connection', function (socket) {
        var initiatorChannel = '';
        if (!io.isConnected) {
            io.isConnected = true;
        }

        socket.on('new-channel', function (data) {
            if (!channels[data.channel]) {
                initiatorChannel = data.channel;
            }

            channels[data.channel] = data.channel;
            onNewNamespace(data.channel, data.sender);
        });

        socket.on('presence', function (channel) {
            var isChannelPresent = !! channels[channel];
            socket.emit('presence', isChannelPresent);
        });

        socket.on('disconnect', function (channel) {
            if (initiatorChannel) {
                delete channels[initiatorChannel];
            }
        });
    });

    function onNewNamespace(channel, sender) {
        io.of('/' + channel).on('connection', function (socket) {
            var username;
            if (io.isConnected) {
                io.isConnected = false;
                socket.emit('connect', true);
            }

            socket.on('message', function (data) {
                if (data.sender == sender) {
                    if(!username) username = data.data.sender;
                    
                    socket.broadcast.emit('message', data.data);
                }
            });
            
            socket.on('disconnect', function() {
                if(username) {
                    socket.broadcast.emit('user-left', username);
                    username = null;
                }
            });
        });
    }
}

WebRTCSignaler.prototype.start = function(_port) {
    port = _port;
    app.listen(port);
}

WebRTCSignaler.prototype.getPort = function() {
    return port;
}

module.exports = WebRTCSignaler;
