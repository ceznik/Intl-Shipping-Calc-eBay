var mysql = require('mysql');

var connection = mysql.createConnection({
	host	:'localhost',
	user	:'root',
	password:'B00tC@mp',
	database:'global_shipping_test'
});

connection.connect(function(err){
	if(err) throw err
	console.log('connected as id' + connection.threadId);
});