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
var selectedEnv = creds.live;

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

	app.get('/allrates', function(request, response){
		//console.log(cc);

		var Country = function(name, region, cc, pc) {
			this.name = name,
			this.cCode = cc,
			this.postalCode = pc,
			this.region = region,
			this.rateArray_Ultra = this.getRates('ultra'),
			this.rateArray_List = this.getRates('list')
			getRates = function(resultType) {
				var a = [];
				var dims = [1, 2, 4, 8, 16, 32];
				var weights = [1, 2, 4, 8, 16, 32, 64, 128];
				for(var i = 0; i < dims.length; i++){
					for(var j = 0; j < weights.length; j++){
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
							      CountryCode: this.cCode,
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
							      Value: weights[j]
							    },
							    Dimensions: {
							      Length: dims[i],
							      Width: dims[i],
							      Height: dims[i],
							      Units: 'IN'
							    }
							  }
							}
						},
						function (err, res) {
						  var results = res.RateReplyDetails
						  if(err) throw err;
						  //console.log(results);
							if (results !== undefined){
								console.log("Sending results to browser...");
								if (resultType == 'ultra') {
									a[i][j] = results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount;
								}
								else if (resultType == 'list'){
									a[i][j] = results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount;
								}
							}
							else {
							  console.log("No results to display");
							  console.log(res.HighestSeverity + ': ' + res.Notifications[0].Message);
							}
							
						});
					}
				}
			}, // a 6 x 8 array of shipping costs used to determine the baseShippingCost and pricePerPound
			baseShipping_Ultra = 0,
			pricePerPound_Ultra = 0,
			baseShipping_List = 0,
			pricePerPound_List = 0,

		}

	});
}