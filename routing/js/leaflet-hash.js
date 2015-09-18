(function(window) {
	var HAS_HASHCHANGE = (function() {
		var doc_mode = window.documentMode;
		return ('onhashchange' in window) &&
			(doc_mode === undefined || doc_mode > 7);
	})();

	L.Hash = function(map) {
		this.onHashChange = L.Util.bind(this.onHashChange, this);

		if (map) {
			this.init(map);
		}
	};

	L.Hash.triggerEvent = function(center, zoom) {
		var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
		$(document).trigger({
			'type': "new-location",
			'zoom': zoom,
			'lat' : center.lat.toFixed(precision),
			'lon' : center.lng.toFixed(precision)
		});
	};

	L.Hash.parseParams = function(str) {
		if (!str || str == "") {
			return undefined;
		}
		var pieces = str.split("&"), data = {}, i, parts;
	    // process each query pair
	    for (i = 0; i < pieces.length; i++) {
	        parts = pieces[i].split("=");
	        if (parts.length < 2) {
	            parts.push("");
	        }
	        data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
	    }
	    return data;
	}

	L.Hash.parseHash = function(hash) {
		if(hash.indexOf('#') === 0) {
			hash = hash.substr(1);
		}
		var hash_obj  = this.parseParams(hash);
		if (!hash_obj) {
			return false;
		}
		var args = hash_obj.loc.split(",");
		if (args.length == 3) {
			var zoom = parseInt(args[0], 10),
			lat = parseFloat(args[1]),
			lon = parseFloat(args[2]);
			if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
				return false;
			} else {
				var query = hash_obj.q ? hash_obj.q : null;
				var return_obj = {
					center: new L.LatLng(lat, lon),
					zoom: zoom
				};
				if (query) {
					if (this.lastSearchQuery != query) {
						this.lastSearchQuery = query;
					}
					return_obj['q'] = query;
				}
				return return_obj;
			}
		} else {
			return false;
		}
	};

	L.Hash.formatHash = function(map) {
		var center = map.getCenter(),
		    zoom = map.getZoom(),
		    precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

		this.triggerEvent(center, zoom);

		var loc = "#loc=" + [zoom,
			center.lat.toFixed(precision),
			center.lng.toFixed(precision)
		].join(",");

		var query = this.lastSearchQuery ? "&q=" + this.lastSearchQuery : "";
		
		//don't smash any other hash parameters
		var hash = location.hash;
		if(hash.indexOf('#') === 0)
			hash = hash.substr(1);
		pieces = hash.split('&');
		extra = '';
		pieces.forEach(function(e,i,a) {
			if(e.length && e.slice(0, 'loc='.length) != 'loc=' && e.slice(0, 'q='.length) != 'q=')
				extra = extra + '&' + e;
		});
		return loc + query + extra;
	},

	L.Hash.prototype = {
		map: null,
		lastHash: null,
		lastSearchQuery: null,

		parseHash: L.Hash.parseHash,
		formatHash: L.Hash.formatHash,
		triggerEvent: L.Hash.triggerEvent,
		parseParams: L.Hash.parseParams,

		init: function(map) {
			this.map = map;

			// reset the hash
			this.lastHash = null;
			this.lastSearchQuery = null;
			this.onHashChange();

			if (!this.isListening) {
				this.startListening();
			}
		},

		removeFrom: function(map) {
			if (this.changeTimeout) {
				clearTimeout(this.changeTimeout);
			}

			if (this.isListening) {
				this.stopListening();
			}

			this.map = null;
		},

		onMapMove: function() {
			// bail if we're moving the map (updating from a hash),
			// or if the map is not yet loaded

			if (this.movingMap || !this.map._loaded) {
				return false;
			}

			var hash = this.formatHash(this.map);
			if (this.lastHash != hash) {
				location.replace(hash);
				this.lastHash = hash;
			}
		},

		movingMap: false,
		update: function() {
			var hash = location.hash;
			if (hash === this.lastHash) {
				return;
			}
			var parsed = this.parseHash(hash);
			if (parsed) {
				this.movingMap = true;

				this.triggerEvent(parsed.center, parsed.zoom);
				
				this.map.setView(parsed.center, parsed.zoom);

				this.movingMap = false;
			} else {
				this.onMapMove(this.map);
			}
		},

		// defer hash change updates every 100ms
		changeDefer: 100,
		changeTimeout: null,
		onHashChange: function() {
			// throttle calls to update() so that they only happen every
			// `changeDefer` ms
			if (!this.changeTimeout) {
				var that = this;
				this.changeTimeout = setTimeout(function() {
					that.update();
					that.changeTimeout = null;
				}, this.changeDefer);
			}
		},

		isListening: false,
		hashChangeInterval: null,
		startListening: function() {
			this.map.on("moveend", this.onMapMove, this);
			var that = this;
			$(document).on("pelias:fullTextSearch", function(e){
				if (that.lastSearchQuery != e.text) {
					that.lastSearchQuery = e.text;
					that.onMapMove();
				}
			});

			if (HAS_HASHCHANGE) {
				L.DomEvent.addListener(window, "hashchange", this.onHashChange);
			} else {
				clearInterval(this.hashChangeInterval);
				this.hashChangeInterval = setInterval(this.onHashChange, 50);
			}
			this.isListening = true;
		},

		stopListening: function() {
			this.map.off("moveend", this.onMapMove, this);

			if (HAS_HASHCHANGE) {
				L.DomEvent.removeListener(window, "hashchange", this.onHashChange);
			} else {
				clearInterval(this.hashChangeInterval);
			}
			this.isListening = false;
		}
	};
	L.hash = function(map) {
		return new L.Hash(map);
	};
	L.Map.prototype.addHash = function() {
		this._hash = L.hash(this);
	};
	L.Map.prototype.removeHash = function() {
		this._hash.removeFrom();
	};
})(window);