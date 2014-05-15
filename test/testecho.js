var dgram = require("dgram");
var sock = dgram.createSocket("udp4");
sock.on("message", function (msg, rinfo) {
	sock.send(msg, 0, msg.length, rinfo.address, rinfo.port);
});
sock.bind(1337);