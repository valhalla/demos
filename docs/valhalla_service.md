
## Valhalla Service Level Interface Description

Welcome to Valhalla open source routing. By now you have perhaps seen our demo page and meybe even checked out our open source software at https://github.com/valhalla. If you are here you are likely interested in accessing the Valhalla routing service at Mapzen to integrate routing and navigation into a Web or mobile application. This page documents the inputs and ouptuts to our service.

Your first step is to get a developer key from Mapzen. This does great things for you! Baldur/Mike please elaborate and provide instructions!

Valhalla will accept json input for routes:

valhalla.mapzen.com/route?json=

### Basic Parts of a Route Request

The route service request supports the following inputs: location information, name and options for the costing model name, and output options. The form of each is JSON.

#### Locations

Valhalla can be considered a **Bring Your Own Search** service. Valhalla does not search for locations given a name or address and does not do any geocoding or reverse geocoding. External services like Pelias or Nominatum must be used to find places and geocode addresses. A location must include a latitude, longitude. This can be from a GPS or other locator, point and click on a map, a geocode service, etc. The Valhalla routing service will not perform any external service calls to generate a latitude,longitude (i.e., geocoding). The routing service will not perform any external service calls to fill in other location information given a latitude,longitude (i.e. reverse geocoding).

Locations are provided as an ordered list of two or more locations within a JSON array. Locations are visited in the route in the provided order. A maximum of **TBD** locations is supported. Each location includes the following information:

The location information shall consist of two or more stop locations. Also, 0 to n via locations may be supplied to influence the route path.
* latitude = Latitude of the location in degrees.
* longitude = Longitude of the location in degrees.
* type = Type of location. There are two location types: **break** and **through**. Break forms a stop - the first and last locations must be type = break. Through locations form a location that the route path goes through - the path is not allowed to reverse direction at the through locations. Through locations are useful to force a route to go through locations. If no type is provided, the type is assumed to be a break.
* heading = A preferred direction of travel (heading) for the start from the location. This can be useful for mobile routing where a vehicle is traveling in a specific direction along a road and the route should start out in that direction. hdg is indicated in degrees from north in a clockwise direction. North is 0°, east is 90°, south is 180°, and west is 270°.
* street = Street name. The street name may be used to assist finding the correct routing location at the specified latitude,longitude.

The following location information may be provided but does not impact routing. This information is simply carried through the request and returned as a convenience.
* name = Location name (e.g. Chipotle). May be used in the guidance/textual directions.
* city = City.
* state = State.
* postalCode = Postal Code.
* country = Country.
* phone = Phone.
* url = URL for the place/location.

FUTURE: look for additional location options and information related to time at each location. This will allow routes to specify a start time or an arrive by time at each location.

#### Costing Model

Valhalla uses dynamic, run-time costing to form the route path. The route request must include the name of the costing model and can include optional parameters accepted by the costing mode.

Costing models currently supported include:

* costing = auto. Standard costing for driving routes (using car, motorcycle, truck, etc.) that obeys automobile driving rules (access, turn restrictions, etc.) that provides a short time path (not guaranteed to be shortest time) that also uses intersection costing to help minimize turns and maneuvers or road name changes. Routes also tend to favor highways (higher classification roads: motorways, trunk).
* costing = auto-shorter. Alternate costing for driving that is intended to provide a short distance path (though not guaranteed to be shortest distance) that obeys driving rules (access, turn restr)
* costing = pedestrian. Standard walking route that does not allow roads with no pedestrian access. In general, pedestrian routes are shortest distance with the following exceptions: walkways/foot-paths are slightly favored and steps/stairs and alleys are slightly avoided. Pedestrian routes are not allowed for locations that are more than **TBD** kilometers apart due to performance limitations. 

Bicycle costing will soon be available.

#### Output Options

* narrtype = Narrative type. 
* units = Distance units. Allowable unit types are miles and km. If no unit type is specified, km is selected.
* outformat = Output Format. Allowable output formats are json and pbf (protocol buffer). If no outformat is specified, JSON is selected.
* 
TODO - add example that shows a simple request and response.

### JSON Output

#### Trip

The route results are returned as a **trip**. This is a JSON object that contains details about the trip, including locations, a summary, and a list of **legs**.

##### Locations
Location information is returned in the same form as it is entered with additional fields:

* sos = Side of street. Possible values are: **right**, **left**, or **ind** (indeterminant).

##### Summary

The trip summary includes basic details about the entire trip including:

* time = Estimated elapsed time to complete the trip.
* distance = Distance traveled for the entire trip. Units are either miles or kilometers based on the input units specified.

##### Legs

A trip may include multiple legs. For n break locations there are n-1 legs. Through locations do not create a separate legs.

Each leg of the trip includes a summary (comprised of the same information as a trip summary but applied to the single leg of the trip). It also includes the following:

* shape = Encoded shape (using Google polyline encoding - ADD LINK) of the route path. 
* maneuvers = A list (JSON array) of manuevers

###### Manuever

Each maneuver includes the following:

* type = Type (TBD)
* writtenInstruction = 
* streetNames = 
* time = Estimated time along the  maneuver in seconds.
* distance = Maneuver distance in the units specified.
* beginShapeIndex = Index into the list of shape points for the start of the maneuver.
* endShapeIndex = Index into the list of shape points for the end of the maneuver.
* toll = True if the maneuver has any toll or portions of the maneuver are subject to a toll.
* rough = True if the maneuver is unpaved/rough pavement or has any portions that have rought pavement.
* gate = True if a gate is encountered on this maneuver.
* ferry = True if a ferry is encountered on this maneuver.

#### OSRM Compatibility Mode

Note that OSRM compatibility mode uses:
valhalla.mapzen.com/viaroute?

Example:



