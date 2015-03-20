# Demos #

The demos project is essentially a set of various applications and tests showcasing the various bits of software within the valhalla organization.

## Components ##

What follows are some notable components of the demos project.

### Routing ###

This demo allows the testing of point and click routing through a web interface overlayed on a map tiles for easy visualization. The test requires that you are running a `tyr` server and communicates with it via [OSRM](http://project-osrm.org) compatibility mode. You will need to do a few things to get a working system up and running to test with:

1. Install all of the valhalla software by following these [README instructions](https://github.com/valhalla/chef-valhalla/blob/master/README.md#building-and-running).

2. Configure your json file to something similar to [this sample](https://github.com/valhalla/mjolnir/blob/master/conf/valhalla.json). Note the locations of the various files and output directory.

3. Cut some graph tiles so that you can route on them:

        wget http://download.geofabrik.de/europe/liechtenstein-latest.osm.pbf
        pbfgraphbuilder -c valhalla.json liechtenstein-latest.osm.pbf

4. And start up a default `tyr` server, the requests will be logged to stdout:

        python -m tyr_simple_server valhalla.json

5. Fire up the webpage:

        firefox demos/routing/index.html

6. Have fun!
