var fs = require('fs');
var path = require('path');

var f = fs.readFileSync('./ratecalc/CountryCodeList.csv', {encoding: 'ascii'}, function(err){console.log(err);});
var a = [];
f = f.split("\r\n");
for (var i = 1; i < f.length; i++){
	a.push(f[i].split(","));
}


console.log("country codes loaded");
//console.log(a);
module.exports = a;
