exports.genId = function() {
	var meid = new Buffer(20);
  	for(var i = 0; i < 20; i++) {
  		meid.writeUInt8(Math.floor(Math.random() * 256), i);
  	}
  	//console.log('generate id ' + exports.id2str(meid));
  	return meid;
}

exports.id2buf = function(nid) {
	var meid = new Buffer(20);
  	for(var i = 0; i < 20; i++) {
  		var val = parseInt(nid[2 * i], 16) * 16 + parseInt(nid[2 * i + 1], 16);
  		meid.writeUInt8(val, i);
  	}
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

exports.idbuf2array = function(buf) {
	var arr = [];
	for(var i = 0; i < 20; i++) {
		var uint = buf.readUInt8(i);
		var flag = 128;
		for(var j = 0; j < 8; j++) {
			if(flag & uint) {
				arr.push(true);
			} else {
				arr.push(false);
			}
			flag /= 2;
		}
	}
	return arr;
}

exports.printbuks = function(buks, bukCount) {
	var cnode;
	for(var i = 0; i < bukCount; i++) {
		console.log(bukCount);
		var cbuk = buks[i];
		for(var j = 0; cnode = cbuk.nodes[j]; j++) {
			console.log('bukkit ' + i + ' bit ' + cnode.bits[i] + ' has ' + utils.id2str(cnode.nid));
		}
	}
}

exports.compNprefix = function(anid, bnid, prefix_num) {
	if(prefix_num < 0) {
		return 0;
	}
	var max = Math.floor(prefix_num / 8);
	for(var i = 0; i < max; i++) {
		var n1 = anid.readUInt8(i);
		//console.log(n1);
		var n2 = bnid.readUInt8(i);
		//console.log(n2);
		if(n1 !== n2) {
			return n1 - n2;
		}
	}
	var mod = prefix_num % 8;
	var fact = 128;
	var n1 = anid.readUInt8(max);
	//console.log(n1);
	var n2 = bnid.readUInt8(max);
	//console.log(n2);
	for(var i = 0; i < mod; i++) {
		var b1 = n1 & fact;
		var b2 = n2 & fact;
		if(b1 !== b2) {
			return (b1 - b2) * fact;
		}
		fact /= 2;
	}
	return 0;
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

exports.nodes2buf = function(nodes) {
	var offset = 0;
	var count = nodes.length;
	var buf = new Buffer(26 * count);
	for(var i = 0; i < count; i++) {
		nodes[i].nid.copy(buf, offset);
		offset += 20;
		nodes[i].ip.copy(buf, offset);
		offset += 4;
		nodes[i].port.copy(buf, offset);
		offset += 2;
	}
	return buf;
}