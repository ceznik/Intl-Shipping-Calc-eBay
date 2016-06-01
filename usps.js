var USPS = require('usps-webtools');

var usps = new USPS({
	server: 'http://production.shippingapis.com/ShippingAPI.dll',
	userId: '018ULTRA5886',
	ttl: 10000
});

usps.zipCodeLookup({
	street1:'120 Central Ave',
	city: 'Farmingdale',
	state: 'NJ'
}, function(err, address) {
	console.log(address);
});

