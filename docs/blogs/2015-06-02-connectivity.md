## OSM Routing Connectivity Map

In our work on open source routing, the Valhalla team at Mapzen have found an interesting byproduct of producing routing tiles - they provide a rough, first order approximation of connectivity. The notion is any tile navigable ways will be added to a Valhalla graph tile.

Since the Valhalla tiles are uniform sized latitude, longitude squares the tiling structure creates a 2-D array which can be used to create an image where each color indicates regions (tiles) that are possibly connected by OSM ways.

![](images/connectivity2.png)

####Steps to Produce the Connectivity Map

Using just the files that contain the Valhalla graph data we can create the connectivity image using the following steps:

* Iterate through the tile directory and mark identify existing tiles. This produces a boolean array with any existing tiles marked as true and empty tiles marked as false.
* Iterate through the tile map produced in stage 1 to find any connected tiles and mark them with a unique identifier. This can be done by iterating until an existing tile that has not been marked has been encountered. The existing neightbors of this tile are iteratively added until no more non-empty neighbiring tiles are present. The color identifier is incremented and the iteration through the tile map continues until the next populated and not-colored tile is encountered.
* Change the unique color identifiers into RGB colors and output an image in PPM (Portable Pixel Map) format.
* Convert the PPM image into png using ImageMagik:
* Flip the image vertically (Valhalla tiles are row ordered from South to North).

####GeoJSON

####Using the Connectivity Map

The connectivity map has one very important use within Valhalla - we are instantaneuosly able to reject routes that have no possible connection. Any 2 locations that lie in tiles that have different "colors" in the connectivity map have no possible path between them over navigable ways. A quick image lookup can quickly determine this and allow us to filter these impossible paths. Note that just because 2 locations have the same color does not mean they are guaranteed to have a valid, connecting path.

The connectivity map may also be useful to the OSM community to identify regions where no connectivity exists but perhaps should exist. This may allow focused efforts to map regions to improve connectivity.

####Dealing with Ferries and Long Ways

Valhalla stores routing data in tiles where there are nodes that intersect more than one OSM way or are endpoints of an OSM way. Some OSM ways may be long and have no intersecting ways along the path (e.g. ferries). These result in empty Valhalla tiles.  Without special processing these long ways would create a connectivity map that falsely shows no connectivity between the endpoints of the way. To get around this, we create tiles that have no graph nodes or edges but create a small file that indicates there is connectivity through the tile.

