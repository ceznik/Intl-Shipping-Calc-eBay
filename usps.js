var USPS = require('usps-webtools');

var usps = new USPS({
	server: 'http://production.shippingapis.com/ShippingAPI.dll',
	userId: '018ULTRA5886',
	ttl: 10000
});

usps.verify({
	street1:'120 Central Ave',
	city: 'Farmingdale',
	state: 'NJ',
	zip: '07727'
}, function(err, address) {
	console.log(address);
});

