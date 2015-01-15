/*
Copyright (c) 2014 Harish Krishna

This plugin adds a bunch of custom locations to your leaflet map as a drop down menu L.Control
(Useful, if you want to jump from one location to another to lets say test a geocoder within map bounds)

This code was originally used for the "ghost busters" OSRM routing demo.  Modified as needed 
--Greg Knisely
*/
L.Control.Modes = L.Control.extend({
    options: {
        position: 'topleft',
        icon: 'glyphicon-th-list glyphicon',
        strings: {
            title: "Modes"
        }
    },

    initialize: function (options) {
        for (var i in options) {
            if (typeof this.options[i] === 'object') {
                L.extend(this.options[i], options[i]);
            } else {
                this.options[i] = options[i];
            }
        }
    },

    trigger_mode: function(mode) {
        $(document).trigger('mode-alert', [mode]);
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div',
            'leaflet-control-modes leaflet-bar leaflet-control');

        var self = this;
        
        this._layer = new L.LayerGroup();
        this._layer.addTo(map);

        this._container = container;

        for (key in this.options.mode_icons) {
            var icon = this.options.mode_icons[key];
            this._transit_link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
            this._transit_link.href = '#';
            this._transit_link.title = this.options.strings.title + (key === 'foot' ? ' on ' : ' on a ') + key;
            this._transit_link.setAttribute('class', key === 'foot' ? 'routing' : '');
            this._transit_link.setAttribute('data-mode', key)
            this._transit_icon = L.DomUtil.create('img', 'modes', this._transit_link);
            this._transit_icon.src = icon;
            L.DomEvent
            .on(this._transit_link, 'click', L.DomEvent.stopPropagation)
            .on(this._transit_link, 'click', L.DomEvent.preventDefault)
            .on(this._transit_link, 'click', function() {
                var is_routing = this.getAttribute('class') === 'routing';
                if (!is_routing) {
                    $('.routing').removeClass('routing');
                    this.setAttribute('class', 'routing');
                    self.trigger_mode(this.getAttribute('data-mode'));
                }
                
            })
            .on(this._transit_link, 'dblclick', L.DomEvent.stopPropagation);
        }
        // default on foot
        self.trigger_mode('foot');

        return container;
    }
});

L.control.modes = function (options) {
    return new L.Control.Modes(options);
};

(function(){
  // code borrowed from https://github.com/domoritz/leaflet-locatecontrol (thank you Dominik Moritz)
  // leaflet.js raises bug when trying to addClass / removeClass multiple classes at once
  // Let's create a wrapper on it which fixes it.
  var LDomUtilApplyClassesMethod = function(method, element, classNames) {
    classNames = classNames.split(' ');
    classNames.forEach(function(className) {
        L.DomUtil[method].call(this, element, className);
    });
  };

  L.DomUtil.addClasses = function(el, names) { LDomUtilApplyClassesMethod('addClass', el, names); };
  L.DomUtil.removeClasses = function(el, names) { LDomUtilApplyClassesMethod('removeClass', el, names); };
})();
