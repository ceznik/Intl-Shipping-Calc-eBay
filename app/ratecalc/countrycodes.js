var fs = require('fs');
var path = require('path');

var f = fs.readFileSync('../app/ratecalc/CountryCodeList.csv', {encoding: 'ascii'}, function(err){console.log(err);});
var a = [];
f = f.split("\r\n");
for (var i = 0; i < f.length; i++){
	a.push(f[i].split(","));
}
//console.log(f[0].split(","));
//console.log(a[5][1]);

console.log("country codes loaded");
module.exports = a;
