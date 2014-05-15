var dns = require('dns');
dns.resolve4('router.bittorrent.com', function(err, addresses) {
	console.log(addresses[0]);
});