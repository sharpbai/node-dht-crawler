var http = require('http');
var lineReader = require('line-reader');

var valid = 0;
var list = [];

lineReader.eachLine('ready.log', function(line, last) {
	list.push(line.trim());
	if (last) {
		check(0);
		return false; // stop reading
	}
});

function check(index) {
	var infohash = list[index];
	if(infohash == null) {
		console.log(valid + ' validated in ' + list.length + ' hashinfos');
		process.exit(0);
	}
	var req = http.request({
		hostname: 'www.haocili.com',
		port: 80,
		path: '/info/' + infohash,
		method: 'GET'
	}, function(res) {
		var total = 0;
		res.on('data', function(data) {
			total += data.length;
		});
		res.on('end', function() {
			if(total < 50) {
				console.log(infohash + ' is invalid');
			} else {
				console.log(infohash + ' is valid');
				valid++;
			}
			check(index + 1);
		});
	}).on('error', function(e) {
		console.log(e);
	});
	req.end();
}