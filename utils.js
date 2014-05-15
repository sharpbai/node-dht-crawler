exports.genId = function() {
	var meid = new Buffer(20);
  	for(var i = 0; i < 20; i++) {
  		meid.writeUInt8(Math.floor(Math.random() * 256), i);
  	}
  	//console.log('generate id ' + exports.id2str(meid));
  	return meid;
}

exports.genTid = function() {
	var tid = new Buffer(2);
  	tid.writeUInt16BE(Math.floor(Math.random() * 65536), 0);
  	return tid;
}

exports.id2str = function(id) {
	return id.toString('hex');
}

exports.ip2buf = function(ip) {
	var rows = ip.split('.');
	var buf = new Buffer(4);
	for(var i = 0; i < 4; i++) {
  		buf.writeUInt8(parseInt(rows[i]), i);
  	}
  	return buf;
}

exports.buf2ip = function(buf) {
	var ip = [];
	for(var i = 0; i < 4; i++) {
  		ip.push(buf.readUInt8(i).toString());
  	}
  	return ip.join('.');
}

exports.port2buf = function(port) {
	var buf = new Buffer(2);
	buf.writeUInt16BE(port, 0);
	return buf;
}

exports.buf2port = function(buf) {
	return buf.readUInt16BE(0);
}

exports.getNeighbor = function(meid) {
	var buf = new Buffer(20);
	for(var i = 0; i < 10; i++) {
  		buf.writeUInt8(meid.readUInt8(i), i);
  	}
	for(var i = 10; i < 20; i++) {
  		buf.writeUInt8(Math.floor(Math.random() * 256), i);
  	}
  	return buf;
}