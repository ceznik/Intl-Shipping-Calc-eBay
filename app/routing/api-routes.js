var debug = require('debug')('shipping-fedex');
var fs = require('fs');
var path = require('path');
var fedexAPI = require('shipping-fedex');
var cc = require('../ratecalc/countrycodes.js');
var packages = require('../data/packages.js');
var async = require('async');
//FEDEX API config

var creds = require('./creds.js');

var selectedEnv = creds.creds.live; //options: creds.sandbox || creds.live

var fedex = new fedexAPI(selectedEnv);

var Country = function(region, name, cc, pc) {
	this.name = name,
	this.cCode = cc,
	this.postalCode = pc,
	this.region = region,

	// this.rateArray_Ultra = function(){
	// 	getRates('ultra');
	// },
	// this.rateArray_List = function(){
	// 	getRates('list');
	// },
	//  // Each rateArray is a 9 x 9 array of shipping costs used to determine the baseShippingCost and pricePerPound
	this.baseShipping_Ultra = 0,
	this.pricePerPound_Ultra = 0,
	this.baseShipping_List = 0,
	this.pricePerPound_List = 0,

	getRates = function(rateType) {
			var a = [];
			//var dims = 8;
			//var weights = [1, 2, 4, 8, 16, 32, 64, 128];
			for(var j = 0; j < 3; j++){
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
					      PostalCode: this.postalCode,
					      CountryCode: "BB",
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
					      Value: packages[j].weight
					    },
					    Dimensions: {
					      Length: packages[j].length,
					      Width: packages[j].width,
					      Height: packages[j].height,
					      Units: 'IN'
					    }
					  }
					}
				},
				function (err, res) {
					if (res !== null){
						var results = res.RateReplyDetails
					  	if(err) throw err;
					  	console.log("Country Code: " + this.cCode);
						if (results !== undefined){
							console.log("Sending results to browser...");
							if (rateType == 'ultra') {
								a[j] = results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount;
								if (j==0){
									console.log("baseShipping Condition true");
									this.baseShipping_Ultra = results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount;
								}
							}
							else if (rateType == 'list'){
								a[j] = results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount;
								if (j==0){
									console.log("baseShipping Condition true");
									this.baseShipping_List = results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount;
								}								
							}
						}
						else {
						  console.log("No results to display");
						  console.log(res.HighestSeverity + ': ' + res.Notifications[0].Message);
						}
					}
					console.log(a);
					return a;
					
				});
			}
			
			
	}
}

//function getRates(weight, dims, countryCode, postalCode)

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
		  //console.log(results);
			if (results !== undefined){
				console.log("Sending results to browser...");
				console.log("request.body.weight: " + request.body.weight + " & height: " + request.body.height);
				//parse the response from FedEx and send back the account rate and the list rate for the subject package
				response.send([results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount, results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount])
			}
			else {
			  console.log("No results to display");
			  console.log(res.HighestSeverity + ': ' + res.Notifications[0].Message);
			}
		});
	});
	app.get('/allrates', function(req, res){
		var countries = [];
		for(var i = 0; i < cc.length; i++){

			//create new Country object
			var country = new Country(cc[i][0], cc[i][1], cc[i][2], cc[i][3]);
			console.log(country);
			//generate the pricing arrays.
			//country.rateArray_Ultra();
			//country.rateArray_List();

			//push country object to array
			countries.push(country);
		}
		res.send(countries);
	});


}