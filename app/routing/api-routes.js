var debug = require('debug')('shipping-fedex');
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

var Country = function(name, region, cc, pc) {
	this.name = name,
	this.cCode = cc,
	this.postalCode = pc,
	this.region = region,
    this.rateArray_Ultra = getRateArray(this.cCode, this.postalCode, 'ultra'),
	this.rateArray_List = getRateArray(this.cCode, this.postalCode, 'list'),
 	this.baseShipping_Ultra = this.rateArray_Ultra[0][0],
	this.pricePerPound_Ultra = 0,
	this.baseShipping_List = this.rateArray_List[0][0],
	this.pricePerPound_List = 0
};

function getRateArray(cc, pc, rateType) { //pass in the country code (cc) and postal(pc)(if it exists) to generate the rateArray
	var dims = [1, 2, 4, 8, 16, 32];
	var weights = [1, 2, 4, 8, 16, 32, 64, 128];
	var rateArray = [];
	for(var d = 0; d < dims.length; d++){
		var rateArray_w = [];
		for(var w = 0; w < weights.length; w++){
			rateArray_w.push(CalcRates(weights[w], dims[d], cc, pc, rateType));
		}
		rateArray.push(rateArray_w);
	}
	return rateArray;
}

function CalcRates(w, d, cc, pc, rType){
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
		      PostalCode: pc,
		      CountryCode: cc,
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
		      Value: w
		    },
		    Dimensions: {
		      Length: d,
		      Width: d,
		      Height: d,
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
			console.log("Sending results to array");
			if(rType == 'ultra'){
				//parse the response from FedEx and send back the account rate and the list rate for the subject package
				return results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount;
			}
			else if (rType == 'list'){
				//parse the response from FedEx and send back the account rate and the list rate for the subject package
				return results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount;
			}
		}
		else {
		  console.log("No results to display");
		  console.log(res.HighestSeverity + ': ' + res.Notifications[0].Message);
		}
	});	
}

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
				//parse the response from FedEx and send back the account rate and the list rate for the subject package
				response.send(['$' + results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount, results[1].RatedShipmentDetails[1].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount])
			}
			else {
			  console.log("No results to display");
			  console.log(res.HighestSeverity + ': ' + res.Notifications[0].Message);
			}
		});
	});

	app.get('/allrates', function(request, response){
		var countries = [];
		for(var i = 1; i < 2; i++){
			countries.push(new Country(cc[i][1], cc[i][0], cc[i][2], cc[i][3]));
			setTimeout({}, 2000);
		}
		response.send(countries);
	});
}