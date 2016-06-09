var fedexAPI = require('shipping-fedex');
var Table = require('cli-table');
var fs = require('fs');
var cc = require('./countrycodes.js'); //an array of country codes generated from CountryCodes.csv located in the same folder.

var CountryCodes = [];
// fs.readFile('./sample_data/CountryCodeList.csv', 'utf8', function(err, data){
//   if(err) throw err;
//   CountryCodes = data.split("\r\n");
//   for (var i = 0; i < CountryCodes.length; i++){
//     CountryCodes[i].split(",");
//     //console.log(CountryCodes[i][0]+CountryCodes[i][1]);
//   }

// })
var table = new Table({
    head: ['Weight', 'GPL', 'Service Type', 'Shipping Cost'],
    colWidths: [15, 15, 30, 20]
});

//FEDEX API config
var fedex = new fedexAPI({
	environment: 'sandbox', // or live or sandbox
    debug: false,
    key: 'kW1xOjPyNZVDYxRf',
    password: 'YNwXWDnDZ5XlwTStCCNyU8LOc',
    account_number: '510087100', //510087100
    meter_number: '118724066',
    imperial: true // set to false for metric 
});


var getRatesAndOptions = function(cc, zip, wt, l, w, h){

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
		      PostalCode: zip,
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
		  PackageCount: '1',
		  //RateRequestType:'LIST',
		  RequestedPackageLineItems: {
		    SequenceNumber: 1,
		    GroupPackageCount: 1,
		    Weight: {
		      Units: 'LB',
		      Value: wt
		    },
		    Dimensions: {
		      Length: l,
		      Width: w,
		      Height: h,
		      Units: 'IN'
		    }
		  }
		}
	},
	function (err, res) {
	  var resultArray = [['Weight', 'G+L', 'Delivery Option', 'Cost']];
	  var results = res.RateReplyDetails
	  if(err) throw err;
	  //console.log(res);
	if (results.length !== 0 || results.length !== null){
		for(var i = 0; i < results.length; i++){
			resultArray.push([wt, 2*(w+h)+l, results[i].ServiceType, '$' + results[i].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount])
		}
	  //table.push([wt, lwh, results[1].ServiceType, '$' + results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount]);
	 //  fs.appendFile('intlRates.txt',[cc, wt, lwh, results[1].ServiceType, '$' + results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount] + '\r\n','utf8',function(error){
	 //    if(error) throw error;
		// });
	} 
	else {
	  console.log("No results to display"); 
	}
	console.log(resultArray);
	  //console.log(results[1].ServiceType);
	  //console.log(results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount);

	});
}
module.exports = getRatesAndOptions;
//console.log(cc.length);