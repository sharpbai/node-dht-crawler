var utils = require("./utils");
var node = require("./dht_node");
var bukkit = require("./bukkit");
var bencode = require('node-bencode');
var dns = require('dns');
var args = process.argv.slice(2);

var sock;			// socket
var me;			// 自我节点
var port = parseInt(process.argv[2]);	// 监听端口

var buks = [];	// Kad桶
var bukCount = 0;	// Kad桶个数
var handlers = [];	// 定时器与请求方法处理句柄

var MAXUDP = 300;
var concurency = 0;
var MAX_LIVE_TIME = 5 * 60 * 1000;	// 节点保存时间

var nodes = [];

function init() {
	var dgram = require("dgram");
	sock = dgram.createSocket("udp4");
	sock.on("message", onRecv);
	sock.on("listening", onSockCreated);
	sock.bind(port);
}

function onSockCreated() {
	// 监听成功，开始构建node
  	var address = sock.address();
  	//console.log("server listening " + address.address + ":" + address.port);
	me = node.createNode(utils.genId(), utils.ip2buf(address.address), utils.port2buf(address.port));
	nodes[utils.id2str(me.nid)] = true;
	//console.log(utils.buf2ip(me.ip));
	//console.log(utils.buf2port(share.me.port));
	//console.log(me.bits);
	buks.push(bukkit.createBukkit(me, 0));
	bukCount++;
	//send(new Buffer("This is first message"), port, '127.0.0.1');
	find_first_node(me.nid);
}

// 插入节点到表, 返回插入到的桶编号
function push(node) {
	var key = utils.id2str(node.nid);
	if(nodes[key] !== undefined &&
		nodes[key] !== null) {
		//console.log('node existed in ' + nodes[key]);
		return nodes[key];
	}
	var current = 0;
	while(current < bukCount - 1) {
		if(node.bits[current] !== me.bits[current]) {
			break;
		} else {
			current++;
		}
	}
	if(current === (bukCount - 1)) {
		if(buks[current].length() < 8) {
			buks[current].push(node);
			//console.log('insert into ' + current + ' ' + utils.id2str(node.nid));
			nodes[key] = current;
			return current;
		} else {
			buks[current].push(node);
			buks.push(buks[current].split(bukkit.createBukkit(me, bukCount)));
			//console.log('bukkit ' + current + ' splited');
			//console.log('bukkit ' + current + ' has ' + buks[current].length() + ' nodes');
			//console.log('bukkit ' + bukCount + ' has ' + buks[bukCount].length() + ' nodes');
			bukCount++;
			if(node.bits[current] !== me.bits[current]) {
				nodes[key] = current;
				return current;
			} else {
				nodes[key] = current + 1;
				return current + 1;
			}
		}
	} else {
		if(buks[current].length() < 8) {
			buks[current].push(node);
			//console.log('insert into ' + current + ' ' + utils.id2str(node.nid));
			nodes[utils.id2str(node.nid)] = current;
			return current;
		} else {
			var removed = buks[current].nodes.shift();
			delete nodes[utils.id2str(removed.nid)];
			//console.log('remove from ' + current + ' ' + utils.id2str(removed.nid))
			buks[current].push(node);
			//console.log('insert into ' + current + ' ' + utils.id2str(node.nid));
			nodes[utils.id2str(node.nid)] = current;
			return current;
		}
	}
}

// 获取离目标最近的节点
function get_nodes(targetId) {
	var current = 0;
	var min = Math.min(bukCount, 160);
	var targetbits = utils.idbuf2array(targetId);
	for(var i = 0; i < min; i++) {
		if(targetbits[i] !== me.bits[i]) {
			current = i;
			break;
		}
	}
	var count = 0;
	while(count < 8 && current >= 0) {
		var arr = [].concat(buks[current].nodes);
		count += buks[current].length();
	}
	arr = arr.slice(0, 8);
	return arr;
}

// 生成查找目标
function genTargetId() {
	var targetid = utils.genId();
	if(bukCount > 128) {
		var max = Math.floor(bukCount / 8);
		for(var i = 0; i < max; i++) {
			targetid.writeUInt8(me.nid.readUInt8(i), i);
		}
		var mod = bukCount % 8;
		var fact = 128;
		var sum = 0;
		for(var i = 0; i < mod; i++) {
			if(me.bits[8 * max + i]) {
				sum += fact;
			}
			fact /= 2;
		}
	} else {
		for(var i = 0; i < 19; i++) {
			targetid.writeUInt8(me.nid.readUInt8(i), i);
		}
	}
	return targetid;
}

function find_first_node(targetId) {
	var tid = utils.genTid();
	var msg = {
        "t": tid,
        "y": "q",
        "q": "find_node",
        "a": {"id": me.nid, "target": targetId}
    };
    var encoded = bencode.encode(msg);
    dns.resolve4('router.bittorrent.com', function(err, addresses) {
    	if(err == null) {
			send(encoded, 6881, addresses[0]);
			var tick = setTimeout(function() {
				find_first_node(targetId);
			}, 5 * 1000);
			//handlers[addresses[0] + ':' + 6881 + ':' + tid.toString('hex')] = {
			//	timer: tick,
			//	method: 'find_node'
			//};
		} else {
			console.log('DHT init node domain resolve failed');
		}
	});
}

// 延时发送find_node
function send_find_node(nip, nport, targetid) {
	if(port < 1 || port > 65535) {
		return;
	}
	//if(buks[bukCount - 1].length() > 8) {
	//	return;
	//}
	setTimeout(function() {
		find_node(nip, nport, targetid); 
	}, 2 * 1000);
}

function find_node(ip, port, targetId) {
	var tid = utils.genTid();
	var msg = {
        "t": tid,
        "y": "q",
        "q": "find_node",
        "a": {"id": utils.getNeighbor(targetId), "target": targetId}
    };
    var encoded = bencode.encode(msg);
	send(encoded, port, ip);
}

function onRecv(msg, rinfo) {
	var data = bencode.decode(msg);
	if(data == null || data.t == null || data.y == null) {
		//console.log('Invalid data packet');
		return;
	}
	var k = rinfo.address + ':' + rinfo.port + ':' + data.t.toString('hex');
    var y = data.y.toString();
    if(y === 'q') {
		//console.log(JSON.stringify(data));
		}
    // TODO: 收到错误
    if(y === 'e') {
    	//console.log('error got: ' + data.e[0].readUInt8(), data.e[1].toString());
    	return;
    }
	// TODO: 收到find_node回复
	// 插入路由表
	// 并发起查询，成功查询到的，设置超时10分钟
	if(y === 'r') {
		//console.log("server got find_node resp from " +
    	//	rinfo.address + ":" + rinfo.port);
		var buf = data.r.nodes;
		if(buf == null) {
			return;
		}
		// 返回nodes的节点为活跃节点，加入桶中
		var inserted_index = push(node.createNode(data.r.id,
			utils.ip2buf(rinfo.address), utils.port2buf(rinfo.port)));
		// 生成目标nid
		var targetid = genTargetId();
		var count = buf.length / 26;
		//console.log('found ' + count + ' nodes:');
		var offset = 0;
		for(var i = 0; i < count; i++) {
			var nnid = buf.slice(offset, offset + 20);
			offset += 20;
			//if(bukCount < 160 && 
			//	(utils.compNprefix(me.nid, nnid, inserted_index - 1) !== 0)) {
			//	continue;
			//}
			var nip = buf.slice(offset, offset + 4);
			offset += 4;
			var nport = buf.slice(offset, offset + 2);
			offset += 2;
			//console.log('[' + i + ']' + utils.id2str(nnid), utils.buf2ip(nip)
			//	+ ':' + utils.buf2port(nport));
			send_find_node(utils.buf2ip(nip), utils.buf2port(nport), targetid);
		}
		// 加速桶增长使用
		/*target = genTargetId();
		if(bukCount > 8 && bukCount < 160) {
			var bukks = [].concat(buks[inserted_index].nodes);
			var count = bukks.length;
			for(var i = 0; i < count; i++) {
				var nnid = bukks[i].nid;
				var nip = bukks[i].ip;
				var nport = bukks[i].port;
				if(bukCount < 160 && 
					(utils.compNprefix(me.nid, nnid, inserted_index - 1) !== 0)) {
					continue;
				}
				//console.log('[' + i + ']' + utils.id2str(nnid), utils.buf2ip(nip)
				//	+ ':' + utils.buf2port(nport));
				send_find_node(utils.buf2ip(nip), utils.buf2port(nport), me.nid);
			}
		}*/
		
	}

	// TODO: 收到ping
	// 回复ping
	if(y === 'q' && data.q.toString() === 'ping') {
		//console.log("server got ping request from " +
    	//	rinfo.address + ":" + rinfo.port);

		var msg = {
			't': data.t,
			'y':'r',
			'r':{'id': utils.getNeighbor(me.nid)}
		};
		send(bencode.encode(msg), rinfo.port, rinfo.address);
		send_find_node(rinfo.address, rinfo.port, me.nid);
	}

	//TODO: 收到find_node请求
	// 返回最近的8个nodes
	if(y === 'q' && data.q.toString() === 'find_node') {
		//console.log("server got find_node request from " +
    	//	rinfo.address + ":" + rinfo.port);
		var msg = {
            't': data.t,
            'y':'r',
            "r": {
                'id': utils.getNeighbor(me.nid), 
                'nodes': utils.nodes2buf(get_nodes(data.a.target))
            }
        };
		send(bencode.encode(msg), rinfo.port, rinfo.address);
		send_find_node(rinfo.address, rinfo.port, me.nid);
	}

	//TODO: 收到get_peers请求
	// 返回最近的8个nodes
	// 打印出hashinfo
	if(y === 'q' && data.q.toString() === 'get_peers') {
		//console.log("server got get_peers request from " +
    	//	rinfo.address + ":" + rinfo.port);
		var msg = {
            't': data.t,
            'y':'r',
            "r": {
                'id': utils.getNeighbor(me.nid), 
                'nodes': utils.nodes2buf(get_nodes(data.a.info_hash))
            }
        };
        // infohash
        console.log(utils.id2str(data.a.info_hash));
		send(bencode.encode(msg), rinfo.port, rinfo.address);
		send_find_node(rinfo.address, rinfo.port, me.nid);
	}

	// TODO: 收到announce_peer
	// 打印出hashinfo
	if(y === 'q' && data.q.toString() === 'announce_peer') {
		//console.log("server got announce_peer request from " +
    	//	rinfo.address + ":" + rinfo.port);
		var msg = {
            't': data.t,
            'y':'r',
            "r": {'id': utils.getNeighbor(me.nid) }
        };
        // infohash
        console.log(utils.id2str(data.a.info_hash));
		send(bencode.encode(msg), rinfo.port, rinfo.address);
		send_find_node(rinfo.address, rinfo.port, genTargetId());
	}
}

function send(message, dstPort, dstHost, delay) {
		if(dstPort < 1 || dstPort > 65535) {
			return;
		}
		try {
			sock.send(message, 0, message.length, dstPort, dstHost, function(err, bytes) {
			    if (err) {
			    	console.log(err);
			    }
			    //console.log('UDP message sent to ' + dstHost + ':' + dstPort);
			});
		} catch(e) {}
}

init();