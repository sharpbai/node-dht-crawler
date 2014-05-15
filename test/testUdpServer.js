var dgram = require("dgram");
var server = dgram.createSocket("udp4");

server.on("message", function (msg, rinfo) {
	client.send(msg, 0, message.length, rinfo.address, rinfo.port);
});

server.bind(1337);