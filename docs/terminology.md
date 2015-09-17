##Valhalla repositories and terminology

### Repositories and dependencies

The Valhalla organization is comprised of several repositories each responsible for a different function. The layout of the various projects is as follows:

- [Midgard](https://github.com/valhalla/midgard) - Basic geographic and geometric algorithms for use in the various other projects
- [Baldr](https://github.com/valhalla/baldr) - The base data structures for accessing and caching tiled route data. Depends on `midgard`
- [Sif](https://github.com/valhalla/sif) - Library used in costing of graph nodes and edges. This can be used as input to `loki` and `thor`. Depends on `midgard` and `baldr`
- [Mjolnir](https://github.com/valhalla/mjolnir) - Tools for turning open data into graph tiles. Depends on `midgard` and `baldr`
- [Loki](https://github.com/valhalla/loki) - Library used to search graph tiles and correlate input locations to an entity within a tile. This correlated entity (edge or vertex) can be used as input to `thor`. Depends on `midgard`, `baldr`, `sif` and `mjolnir`
- [Thor](https://github.com/valhalla/thor) - Library used to generate a path through the graph tile hierarchy. This path can be used as input to `odin`. Depends on `midgard`, `baldr`, `sif`, `loki` and `odin`
- [Odin](https://github.com/valhalla/odin) - Library used to generate maneuvers and narrative based on a path. This set of directions information can be used as input to `tyr`. Depends on `midgard` and `baldr`
- [Tyr](https://github.com/valhalla/tyr) - Service used to handle http requests for a route communicating with all of the other valhalla APIs. The service will format output from `odin` and support json (and eventually protocol buffer) output. Depends on `midgard`, `baldr`, `sif`, `mjolnir`, `loki`, `thor` and `odin`
- [Skadi](https://github.com/valhalla/skadi) - Library used to access digital elevation model data which is useful in computing steepness of edges in the route graph or generating an elevation profile along a computed route.  Depends on `midgard` and `baldr`.

(definitions are in progress)

###Common Valhalla, Routing & Elevation terms
* break location - the start or end point of a route.
* cost - fixed costs in seconds that are added to both the path cost and the estimated time.
* costing model - set of costs for particular methods of travel, such as automobile or pedestrian.
* edge - a line connected between nodes
* factor - multiply the cost along an edge or road section in a way that influences the path to favor or avoid a particular attribute
* graph - a set of edges connected by nodes used for building a route
* location - a latitude, longitude coordinate pair, specified in decimal degrees that determines the routing and order of navigation.
* maneuver - an operation to be performed during navigation, such as a turn, and the expected duration of the movement.
* narration - textual guidance describing the maneuver to be performed, such as a turn, distance to travel, and expected time.
* path - the sequence of edges forming a route
* penalty - fixed costs in seconds that are only added to the path cost. Penalties can influence the route path determination but do not add to the estimated time along the path.
* route - sequence of edges and maneuvers forming the best travel path between locations given the available road network, costs, influence factors, and other inputs.
* short path - a route that attempts to minimize distance traveled over the constituent edges, but may not be the shortest distance.
* through location - an optional location to influence the route to travel through that location.
* tiled routing - method of building a path on graph data that has been split into square cells.
* time - the number of seconds estimated to complete a maneuver or trip, including any additional costs.
* trip - results of an entire route, including locations, legs, and maneuvers.
* elevation - the height above sea level at a specific location (lat,lng).
* elevation profile - computing the range and height for a series of lat,lng pairs of a line or shape.  This is very useful for charting/graphing.
