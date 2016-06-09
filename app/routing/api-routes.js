var cc = require('../ratecalc/countrycodes.js');
var path = require('path');
var fedex = require('../ratecalc/fedex.js');
//console.log(fedex('BE', '6540', '10', '4', '3', '2'));


module.exports = function(app){
	app.get('/', function(req, res){
		res.sendFile(path.join(__dirname + '/../public/index.html'));
	});

	app.post('/ship', function(req, res){
		var options = fedex(req.body.country, req.body.zip, req.body.weight, req.body.length, req.body.width, req.body.height);
		res.send(options);

	});
}