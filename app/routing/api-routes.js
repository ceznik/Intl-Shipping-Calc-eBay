var fs = require('fs');
var path = require('path');
var fedexAPI = require('shipping-fedex');
var cc = require('../ratecalc/countrycodes.js');
var async = require('async');
//FEDEX API config
var creds = {
	sandbox: {
		environment: 'sandbox', //live or sandbox
		debug: false,
		key: 'kW1xOjPyNZVDYxRf',
		password: 'YNwXWDnDZ5XlwTStCCNyU8LOc',
		account_number: '510087100', //dev test account number
		meter_number: '118724066',
		imperial: true // set to false for metric 
	},
	live: {
		environment: 'live',
		debug: false,
		key: '59AxzdOlTRAhFBZl',
		password: 'ro9MrYxzjqqQap8f1WOBIBEos',
		account_number: '407973461',
		meter_number: '109530939',
		imperial: true
	}
}
var selectedEnv = creds.sandbox;

var fedex = new fedexAPI(selectedEnv);



module.exports = function(app){
	app.get('/', function(req, res){
		res.sendFile(path.join(__dirname + '/../public/index.html'));
	});

//This route calculates the shipping cost for given weights, dimensions, and location
	app.post('/ship', function(request, response){
		fedex.rates({
			ReturnTransitAndCommit: true,
			CarrierCodes: ['FDXE','FDXG'],
			RequestedShipment: {
			  DropoffType: 'REGULAR_PICKUP',
			  //ServiceType: 'FEDEX_GROUND',
			  PackagingType: 'YOUR_PACKAGING',
			  Shipper: {
			    Contact: {
			      PersonName: 'Shipping Department',
			      CompanyName: 'Ultrarev, Inc.',
			      PhoneNumber: '73299383999'
			    },
			    Address: {
			      StreetLines: [
			        '120 Central Ave.'
			      ],
			      City: 'Farmingdale',
			      StateOrProvinceCode: 'NJ',
			      PostalCode: '07727',
			      CountryCode: 'US'
			    }
			  },
			  Recipient: {
			    Contact: {
			      PersonName: '',
			      CompanyName: '',
			      PhoneNumber: ''
			    },
			    Address: {
			      StreetLines: [
			        ''
			      ],
			      City: '',
			      StateOrProvinceCode: '',
			      PostalCode: request.body.zip,
			      CountryCode: request.body.country,
			      Residential: true
			    }
			  },

			  ShippingChargesPayment: {
			    PaymentType: 'SENDER',
			    Payor: {
			      ResponsibleParty: {
			        AccountNumber: fedex.options.account_number
			      }
			    }
			  },
			  RateRequestTypes:'LIST',
			  PackageCount: '1',
			  RequestedPackageLineItems: {
			    SequenceNumber: 1,
			    GroupPackageCount: 1,
			    Weight: {
			      Units: 'LB',
			      Value: request.body.weight
			    },
			    Dimensions: {
			      Length: request.body.length,
			      Width: request.body.width,
			      Height: request.body.height,
			      Units: 'IN'
			    }
			  }
			}
		},
		function (err, res) {
		  var resultArray = [];
		  var results = res.RateReplyDetails
		  if(err) throw err;
		  //console.log(res);
			if (results !== undefined){
				for(var i = 0; i < results.length; i++){
					console.log("Sending results to browser...");
					resultArray.push([request.body.weight, 2*(parseInt(request.body.width)+parseInt(request.body.height))+parseInt(request.body.length), results[i].ServiceType, '$' + results[i].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount, '$' + results[i].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount])
				}
			}
			else {
			  console.log("No results to display");
			  console.log(res.HighestSeverity + ': ' + res.Notifications[0].Message);

			}
			response.send(resultArray);
			
		});
	});
//This route calculates the generic shipping rates for a given country using dim = l = w = h
	app.post('/rates', function(request, response){
		fedex.rates({
			ReturnTransitAndCommit: true,
			CarrierCodes: ['FDXE','FDXG'],
			RequestedShipment: {
			  DropoffType: 'REGULAR_PICKUP',
			  //ServiceType: 'FEDEX_GROUND',
			  PackagingType: 'YOUR_PACKAGING',
			  Shipper: {
			    Contact: {
			      PersonName: 'Shipping Department',
			      CompanyName: 'Ultrarev, Inc.',
			      PhoneNumber: '73299383999'
			    },
			    Address: {
			      StreetLines: [
			        '120 Central Ave.'
			      ],
			      City: 'Farmingdale',
			      StateOrProvinceCode: 'NJ',
			      PostalCode: '07727',
			      CountryCode: 'US'
			    }
			  },
			  Recipient: {
			    Contact: {
			      PersonName: '',
			      CompanyName: '',
			      PhoneNumber: ''
			    },
			    Address: {
			      StreetLines: [
			        ''
			      ],
			      City: '',
			      StateOrProvinceCode: '',
			      PostalCode: request.body.zip,
			      CountryCode: request.body.country,
			      Residential: true
			    }
			  },

			  ShippingChargesPayment: {
			    PaymentType: 'SENDER',
			    Payor: {
			      ResponsibleParty: {
			        AccountNumber: fedex.options.account_number
			      }
			    }
			  },
			  RateRequestTypes:'LIST',
			  PackageCount: '1',
			  RequestedPackageLineItems: {
			    SequenceNumber: 1,
			    GroupPackageCount: 1,
			    Weight: {
			      Units: 'LB',
			      Value: request.body.weight
			    },
			    Dimensions: {
			      Length: request.body.dims,
			      Width: request.body.dims,
			      Height: request.body.dims,
			      Units: 'IN'
			    }
			  }
			}
		},
		function (err, res) {
		  var resultArray = [];
		  var results = res.RateReplyDetails
		  if(err) throw err;
		  //console.log(results);
			if (results !== undefined){
				console.log("Sending results to browser...");
				response.send(['$' + results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount, results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount])
			}
			else {
			  console.log("No results to display");
			  console.log(res.HighestSeverity + ': ' + res.Notifications[0].Message);
			}
		});
	});
//This route will be used to calculate the shipping rates across all countries

	app.get('/allrates', function(request, response){
		var dims = [1, 2, 4, 8, 16, 32];
		var weights = [1, 2, 4, 8, 16, 32, 64, 128];
		var countryDataArray = [];
		var countryRate_Ultra, countryRate_List, countryBaseRate_Ultra, countryBaseRate_List;
		//console.log(cc);
		for(i = 0; i < 2; i++){
			console.log('i= ', i);

			for(j = 0; j < 2; j++){
				console.log('j= ', j);
				var ultraRate_arr = [];
				var listRate_arr = [];
				for(k = 0; k < 2; k++){
					console.log('k= ', k);
					console.log("country code: ", cc[i][2]);
					console.log("postal code: ", cc[i][3]);
					console.log("dimension: ", dims[i]);
					console.log("weight: ", weights[k]);
					var rateResult= [];
					async.series([
						function(callback){
							intlRateCalc(cc[i][2], cc[i][3], dims[j], weights[k]);
							setTimeout(function(){
								callback(null, null);
							}, 1000);
						}
					], function(error, results){
							rateResult.push(results);
							console.log(rateResult);
							ultraRate_arr.push(i+1);
							listRate_arr.push(i+1);
						});	

				} //weights
				countryBaseRate_Ultra = Math.min(ultraRate_arr);
				countryBaseRate_List = Math.min(listRate_arr);
				console.log("sending to LR: ", ultraRate_arr, listRate_arr);	
				var lr_ultra = linearRegression(ultraRate_arr, weights);
				var lr_list = linearRegression(listRate_arr, weights);
				console.log("Linear Regression Results======");
				console.log(lr_ultra.slope, lr_list.slope);
				console.log("====================");
				countryRate_Ultra += lr_ultra.slope;
				countryRate_List += lr_list.slope;
			} //dims

			countryRate_Ultra /= 6;
			countryRate_List /= 6;
			countryDataArray.push([cc[i][0], cc[i][1], countryBaseRate_Ultra, countryRate_Ultra, countryBaseRate_List, countryRate_List]);
			console.log(countryDataArray);
		}; //countries





	});
	function intlRateCalc(country, zip, dim, weight) { //returns an array of two numbers = [ultraRate, listRate]
			//use the fedex rates function to calculate the acct and list rates.
			console.log("intlRateCalc");
			fedex.rates({
			ReturnTransitAndCommit: true,
			CarrierCodes: ['FDXE','FDXG'],
			RequestedShipment: {
			  DropoffType: 'REGULAR_PICKUP',
			  //ServiceType: 'FEDEX_GROUND',
			  PackagingType: 'YOUR_PACKAGING',
			  Shipper: {
			    Contact: {
			      PersonName: 'Shipping Department',
			      CompanyName: 'Ultrarev, Inc.',
			      PhoneNumber: '73299383999'
			    },
			    Address: {
			      StreetLines: [
			        '120 Central Ave.'
			      ],
			      City: 'Farmingdale',
			      StateOrProvinceCode: 'NJ',
			      PostalCode: '07727',
			      CountryCode: 'US'
			    }
			  },
			  Recipient: {
			    Contact: {
			      PersonName: '',
			      CompanyName: '',
			      PhoneNumber: ''
			    },
			    Address: {
			      StreetLines: [
			        ''
			      ],
			      City: '',
			      StateOrProvinceCode: '',
			      PostalCode: '',
			      CountryCode: 'AF',
			      Residential: true
			    }
			  },

			  ShippingChargesPayment: {
			    PaymentType: 'SENDER',
			    Payor: {
			      ResponsibleParty: {
			        AccountNumber: fedex.options.account_number
			      }
			    }
			  },
			  RateRequestTypes:'LIST',
			  PackageCount: '1',
			  RequestedPackageLineItems: {
			    SequenceNumber: 1,
			    GroupPackageCount: 1,
			    Weight: {
			      Units: 'LB',
			      Value: weight
			    },
			    Dimensions: {
			      Length: dim,
			      Width: dim,
			      Height: dim,
			      Units: 'IN'
			    }
			  }
			}
		},
			function (err, res) {
			  var resultArray = [];
			  var results = res.RateReplyDetails
			  if(err) throw err;
			  //console.log(results);
				if (results !== undefined){
					console.log("Sending results to browser...");
					console.log([parseInt(results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount), parseInt(results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount)]);
					return([parseInt(results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount), parseInt(results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount)]);
				}
				else {
				  console.log("No results to display");
				  console.log(res.HighestSeverity + ': ' + res.Notifications[0].Message);
				}
			});

		}
		function linearRegression(y, x){
			var lr = {};
	        var n = y.length;
	        var sum_x = 0;
	        var sum_y = 0;
	        var sum_xy = 0;
	        var sum_xx = 0;
	        var sum_yy = 0;

	        for (var i = 0; i < y.length; i++) {

	            sum_x += x[i];
	            sum_y += y[i];
	            sum_xy += (x[i]*y[i]);
	            sum_xx += (x[i]*x[i]);
	            sum_yy += (y[i]*y[i]);
	        } 

	        lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
	        lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
	        lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

	        return lr;
		}
}