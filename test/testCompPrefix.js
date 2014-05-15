var utils = require("../utils");
var node = require("../dht_node");
var n1 = utils.id2buf('05822b6478eb227308ecc979978b27f06cb742a0');
n2 = utils.id2buf('05922b6478eb227308ecc979978b27f06cb742a0');
console.log(utils.compNprefix(n1, n2, 10)); // true
console.log(utils.compNprefix(n1, n2, 11)); // true
console.log(utils.compNprefix(n1, n2, 12)); // false