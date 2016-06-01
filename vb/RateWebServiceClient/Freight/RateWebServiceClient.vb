Option Strict On

Imports System
Imports System.Web.Services.Protocols
Imports RateWebServiceClient.RateWebReference
Imports System.IO
Imports System.Xml
Imports System.Xml.Serialization

' Sample code to call the FedEx Rate Web Service for Freight
' Tested with Microsoft Visual Studio 2005 Professional Edition

Module RateWebServiceClient

    Sub Main()
        Dim request As RateRequest = CreateRateRequest()
        '
        ' Log the xml request
        ' Uncomment this piece of code to log the web service request. The request will be logged in 'access.log' file under bin folder
        'Dim tm As System.DateTime
        'Dim requestSerializer As New Serialization.XmlSerializer(GetType(RateRequest))
        'Dim file1 As FileInfo = New FileInfo("..\\access.log")
        'Dim sWriter As StreamWriter = file1.AppendText()
        'tm = Now
        'sWriter.WriteLine("{0} - Request:", tm)
        'requestSerializer.Serialize(sWriter, request)
        'sWriter.WriteLine()
        'sWriter.Close()
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
            Else
                ShowNotifications(reply)
            End If
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
        request.ClientDetail.AccountNumber = "XXX" ' Replace "XXX" with client's account number
        request.ClientDetail.MeterNumber = "XXX" ' Replace "XXX" with client's meter number
        If (usePropertyFile()) Then 'Set values from a file for testing purposes
            request.ClientDetail.AccountNumber = getProperty("accountnumber")
            request.ClientDetail.MeterNumber = getProperty("meternumber")
        End If
        '
        request.TransactionDetail = New TransactionDetail()
        request.TransactionDetail.CustomerTransactionId = "***Freight Rate Request using VB.NET ***" ' This is a reference field for the customer.  Any value can be used and will be provided in the response.
        '
        request.Version = New VersionId() ' WSDL version information, value is automatically set from wsdl
        '
        request.ReturnTransitAndCommit = True
        request.ReturnTransitAndCommitSpecified = True
        request.CarrierCodes = New CarrierCodeType(0) {}
        request.CarrierCodes(0) = CarrierCodeType.FXFR
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
        ' If ServiceType is omitted, all applicable ServiceTypes are returned.
        'request.RequestedShipment.ServiceType = ServiceType.FEDEX_FREIGHT_PRIORITY  ' Service types are STANDARD_OVERNIGHT, PRIORITY_OVERNIGHT, FEDEX_GROUND ...
        'request.RequestedShipment.ServiceTypeSpecified = True
        request.RequestedShipment.PackagingType = PackagingType.YOUR_PACKAGING ' Packaging type FEDEX_BOK, FEDEX_PAK, FEDEX_TUBE, YOUR_PACKAGING, ...
        request.RequestedShipment.PackagingTypeSpecified = True
        '
        SetSender(request)
        '
        SetRecipient(request)
        '
        SetPayment(request)
        '
        SetFreightShipmentDetail(request)
        '
        request.RequestedShipment.PackageCount = "1"
    End Sub

    Sub SetSender(ByRef request As RateRequest)
        request.RequestedShipment.Shipper = New Party()
        request.RequestedShipment.Shipper.Address = New Address()
        request.RequestedShipment.Shipper.Address.StreetLines = New String(0) {"SHIPPER ADDRESS LINE 1"}
        request.RequestedShipment.Shipper.Address.City = "Harrison"
        request.RequestedShipment.Shipper.Address.StateOrProvinceCode = "AR"
        request.RequestedShipment.Shipper.Address.PostalCode = "72601"
        request.RequestedShipment.Shipper.Address.CountryCode = "US"
    End Sub

    Sub SetRecipient(ByRef request As RateRequest)
        request.RequestedShipment.Recipient = New Party()
        request.RequestedShipment.Recipient.Address = New Address()
        request.RequestedShipment.Recipient.Address.StreetLines = New String(0) {"RECIPIENT ADDRESS LINE 1"}
        request.RequestedShipment.Recipient.Address.City = "COLORADO SPRINGS"
        request.RequestedShipment.Recipient.Address.StateOrProvinceCode = "CO"
        request.RequestedShipment.Recipient.Address.PostalCode = "80915"
        request.RequestedShipment.Recipient.Address.CountryCode = "US"
    End Sub

    Sub SetPayment(ByRef request As RateRequest)
        request.RequestedShipment.ShippingChargesPayment = New Payment()
        request.RequestedShipment.ShippingChargesPayment.PaymentType = PaymentType.SENDER
        request.RequestedShipment.ShippingChargesPayment.Payor = New Payor()
        request.RequestedShipment.ShippingChargesPayment.Payor.ResponsibleParty = New Party()
        request.RequestedShipment.ShippingChargesPayment.Payor.ResponsibleParty.AccountNumber = "XXX" ' Replace "XXX" with payor's account number
        If (usePropertyFile()) Then 'Set values from a file for testing purposes
            request.RequestedShipment.ShippingChargesPayment.Payor.ResponsibleParty.AccountNumber = getProperty("payoraccount")
        End If
        request.RequestedShipment.ShippingChargesPayment.Payor.ResponsibleParty.Contact = New Contact()
        request.RequestedShipment.ShippingChargesPayment.Payor.ResponsibleParty.Address = New Address()
        request.RequestedShipment.ShippingChargesPayment.Payor.ResponsibleParty.Address.CountryCode = "US"
    End Sub

    Sub SetFreightShipmentDetail(ByRef request As RateRequest)
        request.RequestedShipment.FreightShipmentDetail = New FreightShipmentDetail()
        request.RequestedShipment.FreightShipmentDetail.FedExFreightAccountNumber = "XXX" ' Replace "XXX" with the client's account number
        If (usePropertyFile()) Then 'Set values from a file for testing purposes
            request.RequestedShipment.FreightShipmentDetail.FedExFreightAccountNumber = getProperty("freightaccount")
        End If
        SetFreightBillingContactAddress(request)
        request.RequestedShipment.FreightShipmentDetail.Role = FreightShipmentRoleType.SHIPPER
        request.RequestedShipment.FreightShipmentDetail.RoleSpecified = True
        SetFreightDeclaredValue(request)
        SetFreightLiabilityCoverageDetail(request)
        request.RequestedShipment.FreightShipmentDetail.TotalHandlingUnits = "15"
        SetFreightShipmentDimensions(request)
        SetFreightShipmentLineItems(request)
    End Sub

    Sub SetFreightBillingContactAddress(ByRef request As RateRequest)
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress = New ContactAndAddress()
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Contact = New Contact()
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Contact.PersonName = "Freight Billing Contact"
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Contact.CompanyName = "Freight Billing Company"
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Contact.PhoneNumber = "1234567890"
        '
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Address = New Address()
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Address.StreetLines = New String(0) {"FREIGHT BILLING ADDRESS LINE 1"}
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Address.City = "Harrison"
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Address.StateOrProvinceCode = "AR"
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Address.PostalCode = "72601"
        request.RequestedShipment.FreightShipmentDetail.FedExFreightBillingContactAndAddress.Address.CountryCode = "US"
    End Sub

    Sub SetFreightDeclaredValue(ByRef request As RateRequest)
        request.RequestedShipment.FreightShipmentDetail.DeclaredValuePerUnit = New Money()
        request.RequestedShipment.FreightShipmentDetail.DeclaredValuePerUnit.Currency = "USD"
        request.RequestedShipment.FreightShipmentDetail.DeclaredValuePerUnit.Amount = 50D
    End Sub

    Sub SetFreightLiabilityCoverageDetail(ByRef request As RateRequest)
        request.RequestedShipment.FreightShipmentDetail.LiabilityCoverageDetail = New LiabilityCoverageDetail()
        request.RequestedShipment.FreightShipmentDetail.LiabilityCoverageDetail.CoverageType = LiabilityCoverageType.NEW
        request.RequestedShipment.FreightShipmentDetail.LiabilityCoverageDetail.CoverageTypeSpecified = True
        request.RequestedShipment.FreightShipmentDetail.LiabilityCoverageDetail.CoverageAmount = New Money()
        request.RequestedShipment.FreightShipmentDetail.LiabilityCoverageDetail.CoverageAmount.Currency = "USD"
        request.RequestedShipment.FreightShipmentDetail.LiabilityCoverageDetail.CoverageAmount.Amount = 50D
    End Sub

    Sub SetFreightShipmentDimensions(ByRef request As RateRequest)
        request.RequestedShipment.FreightShipmentDetail.ShipmentDimensions = New Dimensions()
        request.RequestedShipment.FreightShipmentDetail.ShipmentDimensions.Length = "90"
        request.RequestedShipment.FreightShipmentDetail.ShipmentDimensions.Width = "60"
        request.RequestedShipment.FreightShipmentDetail.ShipmentDimensions.Height = "50"
        request.RequestedShipment.FreightShipmentDetail.ShipmentDimensions.Units = LinearUnits.IN
        request.RequestedShipment.FreightShipmentDetail.ShipmentDimensions.UnitsSpecified = True
    End Sub

    Sub SetFreightShipmentLineItems(ByRef request As RateRequest)
        request.RequestedShipment.FreightShipmentDetail.LineItems = New FreightShipmentLineItem(0) {New FreightShipmentLineItem()}
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).FreightClass = FreightClassType.CLASS_050
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).FreightClassSpecified = True
        '
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Packaging = PhysicalPackagingType.BOX
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).PackagingSpecified = True
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Description = "Freight line item description"
        '
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Weight = New Weight()
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Weight.Units = WeightUnits.LB
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Weight.UnitsSpecified = True
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Weight.Value = 1000D
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Weight.ValueSpecified = True
        '
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Dimensions = New Dimensions()
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Dimensions.Length = "90"
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Dimensions.Width = "50"
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Dimensions.Height = "60"
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Dimensions.Units = LinearUnits.IN
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Dimensions.UnitsSpecified = True
        '
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Volume = New Volume()
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Volume.Units = VolumeUnits.CUBIC_FT
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Volume.UnitsSpecified = True
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Volume.Value = 30D
        request.RequestedShipment.FreightShipmentDetail.LineItems(0).Volume.ValueSpecified = True
    End Sub

    Sub ShowRateReply(ByRef reply As RateReply)
        Console.WriteLine("RateReply details:")
        For Each rateDetail As RateReplyDetail In reply.RateReplyDetails
            Console.WriteLine("ServiceType: {0}", rateDetail.ServiceType)
            Console.WriteLine()
            For Each shipmentDetail As RatedShipmentDetail In rateDetail.RatedShipmentDetails
                ShowShipmentRateDetails(shipmentDetail)
            Next shipmentDetail
            ShowDeliveryDetails(rateDetail)
            Console.WriteLine("**********************************************************")
        Next rateDetail
        ShowNotifications(reply)
    End Sub

    Sub ShowShipmentRateDetails(ByRef shipmentDetail As RatedShipmentDetail)
        If (shipmentDetail Is Nothing) Then Return
        If (shipmentDetail.ShipmentRateDetail Is Nothing) Then Return
        Dim rateDetail As ShipmentRateDetail = shipmentDetail.ShipmentRateDetail
        '
        Console.WriteLine("RateType: {0}", rateDetail.RateType)
        If (rateDetail.TotalBillingWeight IsNot Nothing) Then
            Console.WriteLine("Total Billing weight: {0} {1}", rateDetail.TotalBillingWeight.Value, rateDetail.TotalBillingWeight.Units)
        End If
        If (rateDetail.TotalBaseCharge IsNot Nothing) Then
            Console.WriteLine("Total Base charge: {0} {1}", rateDetail.TotalBaseCharge.Amount, rateDetail.TotalBaseCharge.Currency)
        End If
        If (rateDetail.TotalFreightDiscounts IsNot Nothing) Then
            Console.WriteLine("Total Freight Discounts: {0} {1}", rateDetail.TotalFreightDiscounts.Amount, rateDetail.TotalFreightDiscounts.Currency)
        End If
        If (rateDetail.TotalSurcharges IsNot Nothing) Then
            Console.WriteLine("Total surcharges: {0} {1}", rateDetail.TotalSurcharges.Amount, rateDetail.TotalSurcharges.Currency)
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
        ShowFreightRateDetail(rateDetail.FreightRateDetail)
    End Sub

    Sub ShowFreightRateDetail(ByRef freightRateDetail As FreightRateDetail)
        If (freightRateDetail Is Nothing) Then Return
        Console.WriteLine()
        Console.WriteLine("Freight Rate details")
        If (freightRateDetail.QuoteNumber IsNot Nothing) Then
            Console.WriteLine("Quote number {0} ", freightRateDetail.QuoteNumber)
        End If
        ' Individual FreightBaseCharge for each shipment
        For Each freightBaseCharge As FreightBaseCharge In freightRateDetail.BaseCharges
            If (freightBaseCharge.Description IsNot Nothing) Then
                Console.WriteLine("Description " + freightBaseCharge.Description)
            End If
            If (freightBaseCharge.Weight IsNot Nothing) Then
                Console.WriteLine("Weight {0} {1} ", freightBaseCharge.Weight.Value, freightBaseCharge.Weight.Units)
            End If
            If (freightBaseCharge.ChargeRate IsNot Nothing) Then
                Console.WriteLine("Charge rate {0} {1} ", freightBaseCharge.ChargeRate.Amount, freightBaseCharge.ChargeRate.Currency)
            End If
            If (freightBaseCharge.ExtendedAmount IsNot Nothing) Then
                Console.WriteLine("Extended amount {0} {1} ", freightBaseCharge.ExtendedAmount.Amount, freightBaseCharge.ExtendedAmount.Currency)
            End If
            Console.WriteLine()
        Next freightBaseCharge
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
            If (notification.SeveritySpecified) Then
                Console.WriteLine(" Severity: {0}", notification.Severity)
            End If
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