(function() {
  'use strict';

  var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);

  L.Routing = L.Routing || {};

  //L.extend(L.Routing, require('./L.Routing.Localization'));
  L.Routing.Mapzen.Formatter = L.Class.extend({
    options: {
      units: 'metric',
      unitNames: {
        meters: 'm',
        kilometers: 'km',
        yards: 'yd',
        miles: 'mi',
        hours: 'h',
        minutes: 'mín',
        seconds: 's'
      },
      language: 'en',
      roundingSensitivity: 1,
      distanceTemplate: '{value} {unit}'
    },

    initialize: function(options) {
      L.setOptions(this, options);
    },

    formatDistance: function(d /* Number (meters) */) {
      var un = this.options.unitNames,
          v,
        data;
      if (this.options.units === 'imperial') {
        //valhalla returns distance in km
        d  = d * 1000;
        d = d / 1.609344;
        if (d >= 1000) {
          data = {
            value: (this._round(d) / 1000),
            unit: un.miles
          };
        } else {
          data = {
            value: this._round(d / 1.760),
            unit: un.yards
          };
        }
      } else {
        v = d;
        data = {
          value: v >= 1 ? v: v*1000,
          unit: v >= 1 ? un.kilometers : un.meters
        };
      }

       return L.Util.template(this.options.distanceTemplate, data);
    },

    _round: function(d) {
      var pow10 = Math.pow(10, (Math.floor(d / this.options.roundingSensitivity) + '').length - 1),
        r = Math.floor(d / pow10),
        p = (r > 5) ? pow10 : pow10 / 2;

      return Math.round(d / p) * p;
    },

    formatTime: function(t /* Number (seconds) */) {
      if (t > 86400) {
        return Math.round(t / 3600) + ' h';
      } else if (t > 3600) {
        return Math.floor(t / 3600) + ' h ' +
          Math.round((t % 3600) / 60) + ' min';
      } else if (t > 300) {
        return Math.round(t / 60) + ' min';
      } else if (t > 60) {
        return Math.floor(t / 60) + ' min' +
          (t % 60 !== 0 ? ' ' + (t % 60) + ' s' : '');
      } else {
        return t + ' s';
      }
    },

    formatInstruction: function(instr, i) {
      // Valhalla returns instructions itself.
      return instr.instruction;
    },

    getIconName: function(instr, i) {
      // you can find all Valhalla's direction types at https://github.com/valhalla/odin/blob/master/proto/tripdirections.proto
      switch (instr.type) {
        case 0:
          return 'kNone';
        case 1:
          return 'kStart';
        case 2:
          return 'kStartRight';
        case 3:
          return 'kStartLeft';
        case 4:
          return 'kDestination';
        case 5:
          return 'kDestinationRight';
        case 6:
          return 'kDestinationLeft';
        case 7:
          return 'kBecomes';
        case 8:
          return 'kContinue';
        case 9:
          return 'kSlightRight';
        case 10:
          return 'kRight';
        case 11:
          return 'kSharpRight';
        case 12:
          return 'kUturnRight';
        case 13:
          return 'kUturnLeft';
        case 14:
          return 'kSharpLeft';
        case 15:
          return 'kLeft';
        case 16:
          return 'kSlightLeft';
        case 17:
          return 'kRampStraight';
        case 18:
          return 'kRampRight';
        case 19:
          return 'kRampLeft';
        case 20:
          return 'kExitRight';
        case 21:
          return 'kExitLeft';
        case 22:
          return 'kStayStraight';
        case 23:
          return 'kStayRight';
        case 24:
          return 'kStayLeft';
        case 25:
          return 'kMerge';
        case 26:
          return 'kRoundaboutEnter';
        case 27:
          return 'kRoundaboutExit';
        case 28:
          return 'kFerryEnter';
        case 29:
          return 'kFerryExit';
        case 30:
        case 31: //'kTransitTransfer'
        case 32: //'kTransitRemainOn'
        case 33: //'kTransitConnectionStart'
        case 34: //'kTransitConnectionTransfer'
        case 35: //'kTransitConnectionDestination'
        case 36: //'kTransitConnectionDestination'
          if (instr.edited_travel_type) return 'kTransit' + this._getCapitalizedName(instr.edited_travel_type);
          else return 'kTransit';
      }
    },

    _getInstructionTemplate: function(instr, i) {
      return instr.instruction + " " +instr.length;
    },
    _getCapitalizedName: function(name) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  });

 // module.exports = L.Routing;
})();