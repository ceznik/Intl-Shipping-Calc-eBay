var debug = require('debug')('shipping-fedex');
var fs = require('fs');
var path = require('path');
var fedexAPI = require('shipping-fedex');
var cc = require('../ratecalc/countrycodes.js');
var packages = require('../data/packages.js');
var async = require('async');
var Promise = require('promise');
//FEDEX API config

var creds = require('./creds.js');

var selectedEnv = creds.creds.live; //options: creds.sandbox || creds.live

var fedex = new fedexAPI(selectedEnv);




module.exports = function(app){
	var Country = function(region, name, cc, pc) {
		this.name = name,
		this.cCode = cc,
		this.postalCode = pc,
		this.region = region,
		this.baseShipping_Ultra = 0,
		this.pricePerPound_Ultra = 0,
		this.baseShipping_List = 0,
		this.pricePerPound_List = 0
	}

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
	app.get('/countries', function(req, res){
		// return new Promise(function( fullfill, reject){
			
		// })
		var countries = [];
		for(var i = 0; i < cc.length; i++){

			//create new Country object
			var country = new Country(cc[i][0], cc[i][1], cc[i][2], cc[i][3]);
			countries.push(country);		
		}
		res.send(countries);		
	});

	app.get('/track', function(req, res){
		res.sendFile(path.join(__dirname + '/../public/track.html'));
	});

	app.get('/track/:trackingnum', function(request, response){
		//return req.params.trackingnum;
		fedex.track({
		  SelectionDetails: {
		    PackageIdentifier: {
		      Type: 'TRACKING_NUMBER_OR_DOORTAG', //SHIPPER_REFERENCE,PURCHASE_ORDER,TRACKING_NUMBER_OR_DOORTAG,
		      Value: request.params.trackingnum
		    }
		  }
		}, function(err, res) {
		  if(err) {
		    return console.log(err);
		  }

		  response.send(res);
		});
	});
//SHIPPER_REFERENCE,PURCHASE_ORDER,TRACKING_NUMBER_OR_DOORTAG,
	app.get('/trackbyref/:ref', function(request, response){
		//return req.params.trackingnum;
		fedex.track({
		  SelectionDetails: {
		    PackageIdentifier: {
		      Type: "PURCHASE_ORDER",
		      Value: request.params.ref.toString()
		    },
		    ShipmentAccountNumber: "407973461",
		  	SecureSpodAccount: "407973461",
		  	//ShipDateRangeBegin: '07/01/2017',
		  	//ShipDateRangeEnd: '07/26/2017',
		  	CustomerSpecifiedTimeOutValueInMilliseconds: 3000,
		    //ResponseFormat: {}
		  }
		}, function(err, res) {
		  if(err) {
		    return console.log(err);
		  }
		  var trackingRef = {};
		  trackingRef.tracking = res.CompletedTrackDetails[0].TrackDetails[0].TrackingNumber;
		  trackingRef.shipdate = res.CompletedTrackDetails[0].TrackDetails[0].StatusDetail.CreationTime;
		  trackingRef.id = res.CompletedTrackDetails[0].TrackDetails[0].OtherIdentifiers[2].PackageIdentifier;
		  trackingRef.shipper = res.CompletedTrackDetails[0].TrackDetails[0].Shipper;
		  trackingRef.recipient = res.CompletedTrackDetails[0].TrackDetails[0].Recipient;
		  trackingRef.estdlvdate = res.CompletedTrackDetails[0].TrackDetails[0].EstimatedDeliveryTimestamp;
		  response.send(trackingRef);  // 
		});
	});

	// app.get('/trackbyrefs/multrefs', function(request, response){
	// 	//return req.params.trackingnum;
	// 	fedex.track({
	// 	  SelectionDetails: [{
	// 	    PackageIdentifier: {
	// 	      Type: "PURCHASE_ORDER",
	// 	      Value: "340158"
	// 	    },
	// 	    ShipmentAccountNumber: "407973461",
	// 	  	SecureSpodAccount: "407973461",
	// 	  	// ShipDateRangeBegin: "2017-07-01",
	// 	  	// ShipDateRangeEnd: "2017-07-31",
	// 	  	CustomerSpecifiedTimeOutValueInMilliseconds: 3000,
	// 	    //ResponseFormat: {}
	// 	  },
	// 	  {
	// 	    PackageIdentifier: {
	// 	      Type: "PURCHASE_ORDER",
	// 	      Value: "340144"
	// 	    },
	// 	    ShipmentAccountNumber: "407973461",
	// 	  	SecureSpodAccount: "407973461",
	// 	  	// ShipDateRangeBegin: "2017-07-01",
	// 	  	// ShipDateRangeEnd: "2017-07-31",
	// 	  	CustomerSpecifiedTimeOutValueInMilliseconds: 3000,
	// 	    //ResponseFormat: {}
	// 	  }]
	// 	}, function(err, res) {
	// 	  if(err) {
	// 	    return console.log(err);
	// 	  }
	// 	  response.send(res);
	// 	});
	// });
}
