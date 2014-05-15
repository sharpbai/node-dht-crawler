var utils = require("../utils");
var node = require("../dht_node");
var bukkit = require("../bukkit");
var lineReader = require('line-reader');

var me;			// 自我节点

var buks = [];	// Kad桶
var bukCount = 0;	// Kad桶个数

function init() {
	me = node.createNode(utils.genId(), utils.ip2buf('127.0.0.1'), utils.port2buf(23333));
	console.log(utils.id2str(me.nid));
	buks.push(bukkit.createBukkit(me, 0));
	bukCount++;
	lineReader.eachLine('test/nodes.txt', function(line, last) {
		var params = line.split(' ');
		push(node.createNode(utils.id2buf(params[0]), utils.ip2buf(params[1]), utils.port2buf(parseInt(params[2]))));
		if (last) {
			console.log(bukCount);
			var cnode;
			for(var i = 0; i < bukCount; i++) {
				var cbuk = buks[i];
				for(var j = 0; cnode = cbuk.nodes[j]; j++) {
					console.log('bukkit ' + i + ' bit ' + cnode.bits[i] + ' has ' + utils.id2str(cnode.nid));
				}
			}
			return false; // stop reading
		}
	});
}

// 插入节点到表
function push(node) {
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
			console.log('insert into ' + current + ' ' + utils.id2str(node.nid));
			return current;
		} else {
			buks[current].push(node);
			buks.push(buks[current].split(bukkit.createBukkit(me, bukCount)));
			//console.log('bukkit ' + current + ' splited');
			//console.log('bukkit ' + current + ' has ' + buks[current].length() + ' nodes');
			//console.log('bukkit ' + bukCount + ' has ' + buks[bukCount].length() + ' nodes');
			bukCount++;
			if(node.bits[current] !== me.bits[current]) {
				return current;
			} else {
				return current + 1;
			}
		}
	} else {
		if(buks[current].length() < 8) {
			buks[current].push(node);
			console.log('insert into ' + current + ' ' + utils.id2str(node.nid));
			return current;
		} else {
			return -1;
		}
	}
}

init();