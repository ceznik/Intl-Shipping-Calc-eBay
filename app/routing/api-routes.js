var fs = require('fs');
var path = require('path');
var fedexAPI = require('shipping-fedex');
var cc = require('../ratecalc/countrycodes.js');
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
		for(i = 0; i < cc.length; i++){
			var ultraRate = [];
			var listRate = [];
			for(j = 0; j < dims.length; j++){
				for(k = 0; k < weights.length; k++){
					var rateResult = intlRateCalc(cc[i][1], dims[j], weights[k]);
					ultraRate.push(rateResult[0]);
					listRate.push(rateResult[1]);
				}
				var lr_ultra = linearRegression(ultraRate,weights);
				var lr_list = linearRegression(listRate, weights);
				countryRateArray_Ultra.push(lr_ultra.slope);
				countryRateArray_List.push(lr_list.slope);
			}
			countryBaseRate_Ultra = min(countryRateArray_Ultra);
			countryBaseRate_List = min(countryRateArray_List);
		}
		function intlRateCalc(country, dim, weight){ //returns an array of two numbers = [ultraRate, listRate]

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
	});
}