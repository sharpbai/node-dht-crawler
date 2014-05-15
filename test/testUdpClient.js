var args = process.argv.slice(2);
var PORT = parseInt(args[2]);
var HOST = args[1];

var dgram = require('dgram');
var message = new Buffer('My KungFu is Good!');

var client = dgram.createSocket('udp4');
client.bind(parseInt(args[0]));
client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
    if (err) throw err;
    	console.log('UDP message sent to ' + HOST + ':' + PORT);
            client.close();
});
