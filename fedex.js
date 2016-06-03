var fedexAPI = require('shipping-fedex');
var Table = require('cli-table');
var firebase = require('firebase');
var fs = require('fs');
var CountryCodes = [];
fs.readFile('./sample_data/CountryCodeList.csv', 'utf8', function(err, data){
  if(err) throw err;
  CountryCodes = data.split("\r\n");
  for (var i = 0; i < CountryCodes.length; i++){
    CountryCodes[i].split(",");
    //console.log(CountryCodes[i][0]+CountryCodes[i][1]);
  }

})
var table = new Table({
    head: ['Weight', 'GPL', 'Service Type', 'Shipping Cost'],
    colWidths: [15, 15, 30, 20]
});

//Firebase declaration for storing International Shipping Rates//
var config = {
apiKey: "AIzaSyB1uQZA1m7__Sf34v6YnWrwPOCpe4n7PT8",
authDomain: "intl-shipping-ebay.firebaseapp.com",
databaseURL: "https://intl-shipping-ebay.firebaseio.com",
storageBucket: "",
};
var app = firebase.initializeApp(config);

var fedex = new fedexAPI({
	environment: 'sandbox', // or live 
    debug: false,
    key: 'kW1xOjPyNZVDYxRf',
    password: 'YNwXWDnDZ5XlwTStCCNyU8LOc',
    account_number: '510087100',
    meter_number: '118724066',
    imperial: true // set to false for metric 
});

var weights = 2; 	//[1, 2, 4, 8, 16, 32, 64, 128];
var lwh = 5; 		//[1, 2, 4, 8, 16, 30, 32];


var getRates = function(cc, wt, lwh){

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
		      Length: lwh,
		      Width: lwh,
		      Height: lwh,
		      Units: 'IN'
		    }
		  }
		}
	},
	function (err, res) {
	  var resultArray = [];
	  var results = res.RateReplyDetails
	  if(err) throw err;
	  //console.log(results[1].RatedShipmentDetails);
	if (results.length !== 0 && results.length !== null){
	  table.push([wt, lwh, results[1].ServiceType, '$' + results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount]);
	  fs.appendFile('intlRates.txt',['\n'+ wt, lwh, results[1].ServiceType, '$' + results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount]+'\n','utf8',function(error){
	    if(error) throw error;
		});
	} 
	else {
	  console.log("No results to display"); 
	}
	console.log(table.toString());
	  //console.log(results[1].ServiceType);
	  //console.log(results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount);

	});
}




