console.log(new Date(Date.now()).toString());
var t1 = setTimeout(function() {
	console.log(new Date(Date.now()).toString());
}, 5000);

setTimeout(function() {
	console.log(new Date(Date.now()).toString());
	//clearTimeout(t1);
}, 2000);