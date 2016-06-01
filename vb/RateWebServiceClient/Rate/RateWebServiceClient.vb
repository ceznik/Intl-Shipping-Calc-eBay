Option Strict On

Imports System
Imports System.Web.Services.Protocols
Imports RateWebServiceClient.RateWebReference
Imports System.IO
Imports System.Xml
Imports System.Xml.Serialization

' Sample code to call the FedEx Rate Web Service
' Tested with Microsoft Visual Studio 2005 Professional Edition

Module RateWebServiceClient

    Sub Main()
        Dim request As RateRequest = CreateRateRequest()
        '
        ' Log the xml request
        ' Uncomment this piece of code to log the web service request. The request will be logged in 'access.log' file under bin folder
        ' Dim tm As System.DateTime
        ' Dim requestSerializer As New Serialization.XmlSerializer(GetType(RateRequest))
        ' Dim file1 As FileInfo = New FileInfo("..\\access.log")
        ' Dim sWriter As StreamWriter = file1.AppendText()
        ' tm = Now
        ' sWriter.WriteLine("{0} - Request:", tm)
        ' requestSerializer.Serialize(sWriter, request)
        ' sWriter.WriteLine()
        ' sWriter.Close()
        '
        Dim service As RateService = New RateService() ' Initialize the service
		If usePropertyFile() Then 'Set values from a file for testing purposes
            service.Url = getProperty("endpoint")
        End If
        '
        Try
            ' Call the web service passing in a RateRequest and returning a RateReply
            Dim reply As RateReply = service.getRates(request)
            '
            ' Log the xml reply
            ' Uncomment this piece of code to log the web service reply. The reply will be logged in 'access.log' file under bin folder
            ' Dim replySerializer As New Serialization.XmlSerializer(GetType(RateReply))
            ' Dim rWriter As StreamWriter = file1.AppendText()
            ' tm = Now
            ' rWriter.WriteLine()
            ' rWriter.WriteLine("{0} Reply:", tm)
            ' replySerializer.Serialize(rWriter, reply)
            ' rWriter.WriteLine()
            ' rWriter.Close()
            '
            '
            If ((Not reply.HighestSeverity = NotificationSeverityType.ERROR) And (Not reply.HighestSeverity = NotificationSeverityType.FAILURE)) Then ' check if the call was successful
                ShowRateReply(reply)
            End If
            ShowNotifications(reply)
        Catch e As SoapException
            Console.WriteLine(e.Detail.InnerText)
        Catch e As Exception
            Console.WriteLine(e.Message)
        End Try
        Console.WriteLine("Press any key to quit !")
        Console.ReadKey()
    End Sub

    Function CreateRateRequest() As RateRequest
        ' Build a RateRequest
        Dim request As RateRequest = New RateRequest()
        '
        request.WebAuthenticationDetail = SetWebAuthenticationDetail()
        '
        request.ClientDetail = New ClientDetail()
        request.ClientDetail.AccountNumber = "510087100" ' Replace "XXX" with client's account number
        request.ClientDetail.MeterNumber = "118724066" ' Replace "XXX" with client's meter number
        If (usePropertyFile()) Then 'Set values from a file for testing purposes
            request.ClientDetail.AccountNumber = getProperty("accountnumber")
            request.ClientDetail.MeterNumber = getProperty("meternumber")
        End If
        '
        request.TransactionDetail = New TransactionDetail()
        request.TransactionDetail.CustomerTransactionId = "*** Rate Request using VB.NET ***" ' This is a reference field for the customer.  Any value can be used and will be provided in the response.
        '
        request.Version = New VersionId() ' WSDL version information, value is automatically set from wsdl
        '
        request.ReturnTransitAndCommit = True
        request.ReturnTransitAndCommitSpecified = True
        '
        SetShipmentDetails(request)
        '
        Return request
    End Function

    Function SetWebAuthenticationDetail() As WebAuthenticationDetail
        Dim wad As WebAuthenticationDetail = New WebAuthenticationDetail()
        wad.UserCredential = New WebAuthenticationCredential()
        wad.ParentCredential = New WebAuthenticationCredential()
        wad.UserCredential.Key = "XXX" ' Replace "XXX" with the Key
        wad.UserCredential.Password = "XXX" ' Replace "XXX" with the Password
        wad.ParentCredential.Key = "XXX" ' Replace "XXX" with the parent Key
        wad.ParentCredential.Password = "XXX" ' Replace "XXX" with the parent Password
        If (usePropertyFile()) Then 'Set values from a file for testing purposes
            wad.UserCredential.Key = getProperty("key")
            wad.UserCredential.Password = getProperty("password")
            wad.ParentCredential.Key = getProperty("parentkey")
            wad.ParentCredential.Password = getProperty("parentpassword")
        End If
        Return wad
    End Function

    Sub SetShipmentDetails(ByRef request As RateRequest)
        request.RequestedShipment = New RequestedShipment()
        request.RequestedShipment.ShipTimestamp = DateTime.Now ' Ship date and time
        request.RequestedShipment.ShipTimestampSpecified = True
        request.RequestedShipment.DropoffType = DropoffType.REGULAR_PICKUP 'Drop off types are BUSINESS_SERVICE_CENTER, DROP_BOX, REGULAR_PICKUP, REQUEST_COURIER, STATION
        request.RequestedShipment.ServiceType = ServiceType.INTERNATIONAL_PRIORITY  ' Service types are STANDARD_OVERNIGHT, PRIORITY_OVERNIGHT, FEDEX_GROUND ...
        request.RequestedShipment.ServiceTypeSpecified = True
        request.RequestedShipment.PackagingType = PackagingType.YOUR_PACKAGING ' Packaging type FEDEX_BOK, FEDEX_PAK, FEDEX_TUBE, YOUR_PACKAGING, ...
        request.RequestedShipment.PackagingTypeSpecified = True
        '
        SetOrigin(request)
        '
        SetDestination(request)
        '
        SetPackageLineItems(request)      
        '
        request.RequestedShipment.TotalInsuredValue = New Money()
        request.RequestedShipment.TotalInsuredValue.Amount = 100
        request.RequestedShipment.TotalInsuredValue.Currency = "USD"
        '
        request.RequestedShipment.PackageCount = "2"
        '
    End Sub

    Sub SetOrigin(ByRef request As RateRequest)
        request.RequestedShipment.Shipper = New Party()
        request.RequestedShipment.Shipper.Address = New Address()
        request.RequestedShipment.Shipper.Address.StreetLines = New String(0) {"SHIPPER ADDRESS LINE 1"}
        request.RequestedShipment.Shipper.Address.City = "COLLIERVILLE"
        request.RequestedShipment.Shipper.Address.StateOrProvinceCode = "TN"
        request.RequestedShipment.Shipper.Address.PostalCode = "38017"
        request.RequestedShipment.Shipper.Address.CountryCode = "US"
    End Sub

    Sub SetDestination(ByRef request As RateRequest)
        request.RequestedShipment.Recipient = New Party()
        request.RequestedShipment.Recipient.Address = New Address()
        request.RequestedShipment.Recipient.Address.StreetLines = New String(0) {"RECIPIENT ADDRESS LINE 1"}
        request.RequestedShipment.Recipient.Address.City = "Montreal"
        request.RequestedShipment.Recipient.Address.StateOrProvinceCode = "PQ"
        request.RequestedShipment.Recipient.Address.PostalCode = "H1E1A1"
        request.RequestedShipment.Recipient.Address.CountryCode = "CA"
    End Sub

    Sub SetPackageLineItems(ByRef request As RateRequest)
        request.RequestedShipment.RequestedPackageLineItems = New RequestedPackageLineItem(1) {}
        request.RequestedShipment.RequestedPackageLineItems(0) = New RequestedPackageLineItem()
        request.RequestedShipment.RequestedPackageLineItems(0).SequenceNumber = "1" ' package sequence number
        request.RequestedShipment.RequestedPackageLineItems(0).GroupPackageCount = "1"
        ' Package weight information
        request.RequestedShipment.RequestedPackageLineItems(0).Weight = New Weight()
        request.RequestedShipment.RequestedPackageLineItems(0).Weight.Units = WeightUnits.LB
        request.RequestedShipment.RequestedPackageLineItems(0).Weight.UnitsSpecified = True
        request.RequestedShipment.RequestedPackageLineItems(0).Weight.Value = 15D
        request.RequestedShipment.RequestedPackageLineItems(0).Weight.ValueSpecified = True
        ' package dimensions
        request.RequestedShipment.RequestedPackageLineItems(0).Dimensions = New Dimensions()
        request.RequestedShipment.RequestedPackageLineItems(0).Dimensions.Length = "10"
        request.RequestedShipment.RequestedPackageLineItems(0).Dimensions.Width = "13"
        request.RequestedShipment.RequestedPackageLineItems(0).Dimensions.Height = "4"
        request.RequestedShipment.RequestedPackageLineItems(0).Dimensions.Units = LinearUnits.IN
        request.RequestedShipment.RequestedPackageLineItems(0).Dimensions.UnitsSpecified = True
        ' insured value
        request.RequestedShipment.RequestedPackageLineItems(0).InsuredValue = New Money()
        request.RequestedShipment.RequestedPackageLineItems(0).InsuredValue.Amount = 100
        request.RequestedShipment.RequestedPackageLineItems(0).InsuredValue.Currency = "USD"
        '
        request.RequestedShipment.RequestedPackageLineItems(1) = New RequestedPackageLineItem()
        request.RequestedShipment.RequestedPackageLineItems(1).SequenceNumber = "2"
        request.RequestedShipment.RequestedPackageLineItems(1).GroupPackageCount = "1"
        ' package weight
        request.RequestedShipment.RequestedPackageLineItems(1).Weight = New Weight()
        request.RequestedShipment.RequestedPackageLineItems(1).Weight.Units = WeightUnits.LB
        request.RequestedShipment.RequestedPackageLineItems(1).Weight.UnitsSpecified = True
        request.RequestedShipment.RequestedPackageLineItems(1).Weight.Value = 25D
        request.RequestedShipment.RequestedPackageLineItems(1).Weight.ValueSpecified = True
        ' package dimensions
        request.RequestedShipment.RequestedPackageLineItems(1).Dimensions = New Dimensions()
        request.RequestedShipment.RequestedPackageLineItems(1).Dimensions.Length = "20"
        request.RequestedShipment.RequestedPackageLineItems(1).Dimensions.Width = "13"
        request.RequestedShipment.RequestedPackageLineItems(1).Dimensions.Height = "4"
        request.RequestedShipment.RequestedPackageLineItems(1).Dimensions.Units = LinearUnits.IN
        request.RequestedShipment.RequestedPackageLineItems(1).Dimensions.UnitsSpecified = True
        ' insured value
        request.RequestedShipment.RequestedPackageLineItems(1).InsuredValue = New Money()
        request.RequestedShipment.RequestedPackageLineItems(1).InsuredValue.Amount = 500
        request.RequestedShipment.RequestedPackageLineItems(1).InsuredValue.AmountSpecified = True
        request.RequestedShipment.RequestedPackageLineItems(1).InsuredValue.Currency = "USD"
    End Sub

    Sub ShowRateReply(ByRef reply As RateReply)
        If (reply.RateReplyDetails Is Nothing) Then Return
        Console.WriteLine("RateReply details:")

        For i As Integer = 0 To reply.RateReplyDetails.Length - 1
            Dim rateReplyDetail As RateReplyDetail = reply.RateReplyDetails(i)
            Console.WriteLine("Rate Reply Detail for Service {0} ", i + 1)

            If (rateReplyDetail.ServiceTypeSpecified) Then
                Console.WriteLine("Service Type: {0}", rateReplyDetail.ServiceType)
            End If
            If (rateReplyDetail.PackagingTypeSpecified) Then
                Console.WriteLine("Packaging Type: {0}", rateReplyDetail.PackagingType)
            End If

            If (rateReplyDetail.RatedShipmentDetails IsNot Nothing) Then
                For j As Integer = 0 To rateReplyDetail.RatedShipmentDetails.Length - 1
                    Dim shipmentDetail As RatedShipmentDetail = rateReplyDetail.RatedShipmentDetails(j)
                    Console.WriteLine("---Rated Shipment Detail for Rate Type {0}---", j + 1)
                    ShowShipmentRateDetails(shipmentDetail)
                Next j
            End If
            ShowDeliveryDetails(rateReplyDetail)
            Console.WriteLine("**********************************************************")
        Next i
    End Sub

    Sub ShowShipmentRateDetails(ByRef shipmentDetail As RatedShipmentDetail)
        If (shipmentDetail Is Nothing) Then Return
        If (shipmentDetail.ShipmentRateDetail Is Nothing) Then Return
        Dim rateDetail As ShipmentRateDetail = shipmentDetail.ShipmentRateDetail
        Console.WriteLine("--- Shipment Rate Detail ---")
        '
        Console.WriteLine("RateType: {0}", rateDetail.RateType)
        If (rateDetail.TotalBillingWeight IsNot Nothing) Then
            Console.WriteLine("Total Billing Weight: {0} {1}", rateDetail.TotalBillingWeight.Value, rateDetail.TotalBillingWeight.Units)
        End If
        If (rateDetail.TotalBaseCharge IsNot Nothing) Then
            Console.WriteLine("Total Base Charge: {0} {1}", rateDetail.TotalBaseCharge.Amount, rateDetail.TotalBaseCharge.Currency)
        End If
        If (rateDetail.TotalFreightDiscounts IsNot Nothing) Then
            Console.WriteLine("Total Freight Discounts: {0} {1}", rateDetail.TotalFreightDiscounts.Amount, rateDetail.TotalFreightDiscounts.Currency)
        End If
        If (rateDetail.TotalSurcharges IsNot Nothing) Then
            Console.WriteLine("Total Surcharges: {0} {1}", rateDetail.TotalSurcharges.Amount, rateDetail.TotalSurcharges.Currency)
        End If
        If (rateDetail.Surcharges IsNot Nothing) Then
            ' Individual surcharge for each package
            For Each surcharge As Surcharge In rateDetail.Surcharges
                Console.WriteLine(" {0} surcharge {1} {2}", surcharge.SurchargeType, surcharge.Amount.Amount, surcharge.Amount.Currency)
            Next surcharge
        End If
        If (rateDetail.TotalNetCharge IsNot Nothing) Then
            Console.WriteLine("Total Net Charge: {0} {1}", rateDetail.TotalNetCharge.Amount, rateDetail.TotalNetCharge.Currency)
        End If
    End Sub

    Sub ShowDeliveryDetails(ByRef rateReplyDetail As RateReplyDetail)
        If (rateReplyDetail.DeliveryTimestampSpecified) Then
            Console.WriteLine("Delivery timestamp: " + rateReplyDetail.DeliveryTimestamp.ToString)
        End If
        If (rateReplyDetail.TransitTimeSpecified) Then
            Console.WriteLine("Transit time: " + rateReplyDetail.TransitTime.ToString)
        End If
    End Sub

    Sub ShowNotifications(ByRef reply As RateReply)
        Console.WriteLine("Notifications")
        For i As Integer = 0 To reply.Notifications.Length - 1
            Dim notification As Notification = reply.Notifications(i)
            Console.WriteLine("Notification no. {0}", i)
            Console.WriteLine(" Severity: {0}", notification.Severity)
            Console.WriteLine(" Code: {0}", notification.Code)
            Console.WriteLine(" Message: {0}", notification.Message)
            Console.WriteLine(" Source: {0}", notification.Source)
        Next
    End Sub
    Function usePropertyFile() As Boolean 'Set to true for common properties to be set with getProperty function.
        Return getProperty("usefile").Equals("True")
    End Function
    Function getProperty(ByRef propertyname As String) As String 'This function sets common properties for testing purposes.
        Try
            Dim filename As String = "C:\filepath\filename.txt"
            If System.IO.File.Exists(filename) Then
                Dim sr As New System.IO.StreamReader(filename)
                Do While Not sr.EndOfStream
                    Dim parts As String() = sr.ReadLine.Split(New Char() {","c})
                    If (parts(0).Equals(propertyname) And parts.Length = 2) Then
                        Return parts(1)
                    End If
                Loop
            End If
            Console.WriteLine("Property {0} set to default 'XXX'", propertyname)
            Return "XXX"
        Catch ex As System.Exception
            Console.WriteLine("Property {0} set to default 'XXX'", propertyname)
            Return "XXX"
        End Try
    End Function
End Module