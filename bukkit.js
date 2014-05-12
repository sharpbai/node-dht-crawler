var utils = require('./utils');

exports.createBukkit = function(me, prefix_num) {
	var bukkit = {
		me: null,
		nodes: null,
		prefix_num: null
	};

	// 插入node到桶中
	bukkit.push = function(node) {
		var meid = bukkit.me.nid;
		for(var i = 0; i < 20; i++) {
			node.dist.writeUInt8(node.nid.readUInt8(i) ^ meid.readUInt8(i), i);
		}
		bukkit.nodes.push(node);
		//bukkit.nodes.sort(node.compare);
		//console.log('bukkit ' + bukkit.prefix_num + ' length is ' + bukkit.nodes.length);
	}

	

	bukkit.length = function() {
		return bukkit.nodes.length;
	}

	// 分拆桶，返回新桶
	bukkit.split = function(newbuk) {
		var flagNum = bukkit.prefix_num;
		var flag = bukkit.me.bits[flagNum];
		var arr = [];
		//console.log('bukkit ' + bukkit.prefix_num + ' has ' + bukkit.nodes.length + ' nodes');
		for(var i = 0; bukkit.nodes[i]; i++) {
			var old = bukkit.nodes[i];
			if(old.bits[flagNum] === flag) {
				if(newbuk.nodes.length < 8) {
					newbuk.nodes.push(old);
					//console.log('insert into new');
				}
			} else {
				if(newbuk.nodes.length < 8) {
					arr.push(old);
					//console.log('insert into old');
				}
			}
		}
		bukkit.nodes = arr;
		return newbuk;
	}

	bukkit.me = me;
	bukkit.prefix_num = prefix_num;
	bukkit.nodes = [];
	return bukkit;
}