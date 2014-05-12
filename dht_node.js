var utils = require('./utils');

exports.createNode = function(nid, ip, port) {
	var node = {};
	// node id buffer
	node.nid = nid;
	// node id bits array
	node.bits = utils.idbuf2array(nid);
	// node id hex string
	node.hex = utils.id2str(nid);
	// 添加到桶内时，赋值
	node.dist = new Buffer(20);
	// node auth
	node.tid = utils.genTid();
	node.ip = ip;
	node.port = port;

	// 与另一个node比较
	node.compare = function(anode, bnode) {
		var div;
		for(var i = 0; i < 20; i++) {
			div = anode.dist.readUInt8(i) - bnode.dist.readUInt8(i);
			if(div !== 0) {
				return div;
			}
		}
		return div;
	};

	return node;
}