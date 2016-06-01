var fedexAPI = require('shipping-fedex');
var Table = require('cli-table');
var fs = require('fs');

fs.readFile('./CountryCodeList.csv', 'utf8', function(err, data){
  if(err) throw err;
  //console.log(data);
})
var table = new Table({
    head: ['Weight', 'GPL', 'Service Type', 'Shipping Cost'],
    colWidths: [15, 15, 30, 20]
});

var fedex = new fedexAPI({
	environment: 'sandbox', // or live 
    debug: true,
    key: 'kW1xOjPyNZVDYxRf',
    password: 'YNwXWDnDZ5XlwTStCCNyU8LOc',
    account_number: '510087100',
    meter_number: '118724066',
    imperial: true // set to false for metric 
});



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
          '2 Tolcher Street Mount Pleasant'
        ],
        City: 'mackay',
        StateOrProvinceCode: '',
        PostalCode: '4740',
        CountryCode: 'AU',
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
    RequestedPackageLineItems: {
      SequenceNumber: 1,
      GroupPackageCount: 1,
      Weight: {
        Units: 'LB',
        Value: process.argv[2]
      },
      Dimensions: {
        Length: 24,
        Width: 10,
        Height: 5,
        Units: 'IN'
      }
    }
  }
},
function (err, res) {
    var resultArray = [];
    var results = res.RateReplyDetails
    if(err) throw err;
    console.log(res);
  if (results.length !== 0 && results.length !== null){
    for (i = 0; i < results.length; i++) {
        table.push([1, 1, results[i].ServiceType, '$' + results[i].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount]);
        fs.appendFile('brazil.txt',[1, 1, results[1].ServiceType, '$' + results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount]+'\n','utf8',function(error){
          if(error) throw error;
        });
        //console.log([j, results[i].ServiceType, '$' + results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount]);
        //console.log(table.toString());
    }
       
  } 
  else {
    console.log("No results to display"); 
  }
  console.log(table.toString());
    //console.log(results[1].ServiceType);
    //console.log(results[1].RatedShipmentDetails[0].ShipmentRateDetail.TotalNetChargeWithDutiesAndTaxes.Amount);
  
});



