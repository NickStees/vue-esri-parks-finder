<template>
  <div id="app">
    <div class="content container">
      <div class="row text-center">
        <h1>Find a Tampa Park</h1>
        <park-animation/>
      </div>
      <div class="row main-app">
        <div id="park-details" class="col-sm-6">&nbsp;
          <ParkDetail v-if="selectedPark" :selectedPark="selectedPark"/>
        </div>

        <div class="col-sm-6">
          <ul v-if="messages.length >= 1">
            <li v-for="message in messages" :key="message">{{message}}</li>
          </ul>
          <h4>Find by Amenity</h4>
          <v-select multiple v-model="selected" :options="options"></v-select>
          <hr>
          <input
            type="search"
            placeholder="Type to filter"
            v-model="filterQuery"
            class="park-search"
          >
          <div class="checkbox sort-dist text-right" v-if="gpsAvailable">
            <label>
              <input type="checkbox" v-model="sortByDist" @click="getCurrentPos"> Sort by Distance from me
            </label>
          </div>
          <div class="meta-info">
            <small class="text-muted text-right" v-if="parksList.length !== displayedParks.length">
              Displaying
              <strong>{{displayedParks.length}}</strong>
              of
              <strong>{{parksList.length}}</strong> parks
            </small>
          </div>
          <ajax-loader v-if="showLoader"/>
          <div v-else>
            <ul v-if="displayedParks.length" class="parklist">
              <ParkListItem
                v-for="park in displayedParks"
                :key="park.attributes.GlobalID"
                :park="park"
                @view="viewParkDetails"
              />
            </ul>
            <div v-else>
              <h3>No parks found based on your selections</h3>
              <p>Try adjusting your filters above.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ParkDetail from "./components/ParkDetail.vue";
import ParkListItem from "./components/ParkListItem.vue";
import ParkAnimation from "./components/ParkAnimation.vue";
import AjaxLoader from "./components/AjaxLoader.vue";
import vSelect from "vue-select";
import axios from "axios";
import sortBy from "lodash/sortBy";

import sphericalmercator from "@mapbox/sphericalmercator";
var merc = new sphericalmercator({
  size: 256
});
Number.prototype.toRad = function() {
  return (this * Math.PI) / 180;
};

export default {
  name: "app",
  components: {
    ParkDetail,
    ParkListItem,
    vSelect,
    ParkAnimation,
    AjaxLoader
  },
  data() {
    return {
      parksList: [],
      selectedPark: {},
      filterQuery: "",
      fieldNames: {},
      // fields: {},
      options: [],
      selected: null,
      messages: [],
      showLoader: true,
      currentPos: {},
      sortByDist: false
    };
  },
  mounted() {
    // get parks info from Esri API when the component is ready(mounted)
    var self = this;
    axios
      .get(
        "https://spatial.tampagov.net/arcgis/rest/services/Parks/Parks/MapServer/0/query?f=json&where=1%3D1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&outFields=*"
      )
      .then(response => {
        this.showLoader = false;
        var processedParks = response.data.features.map(function(item) {
          // figure out lat/long for each park based of ESRI Geometry
          var newitem = item;
          newitem.location = newitem.geometry
            ? self.webMercatorToGeographic(newitem.geometry)
            : [];
          return newitem;
        });
        self.parksList = processedParks;
        // Store Human Readable Field names
        self.fieldNames = response.data.fieldAliases;
        var dropDownOptions = [];
        response.data.fields
          .filter(function(field) {
            // if its a lenght of 3 its likely a yes/no value which is an ammenity
            return field.length === 3;
          })
          .forEach(item => {
            dropDownOptions.push({
              value: item.name,
              label: item.alias
            });
          });
        self.options = sortBy(dropDownOptions, o => {
          return o.label;
        });
      })
      .catch(e => {
        this.showLoader = false;
        self.messages.push(e.message);
      });
  },
  computed: {
    gpsAvailable() {
      return navigator.geolocation ? true : false;
    },
    displayedParks() {
      // This is a filtered set of results that is returned to the vue to be rendered
      var parks = this.parksList; //take all the parks
      if (this.sortByDist) {
        // sort by distance
        parks = sortBy(parks, o => {
          return o.distanceTo;
        });
      } else {
        //  sort alphabetical by default
        parks = sortBy(parks, o => {
          return o.attributes.NAME.toLowerCase();
        });
      }
      var filteredParks = parks.filter(this.filterItems); //filter them against the input
      // then fitler the input against the amenities
      if (this.parksList.length && this.selected && this.selected.length > 0) {
        this.selected.forEach(function(option) {
          filteredParks = filteredParks.filter(function(item) {
            return item.attributes[option.value] == "Yes";
          });
        });
      }
      return filteredParks;
    }
  },
  methods: {
    filterItems(item) {
      // Our custom filter to filter the parks
      var lowercaseName = item.attributes.NAME.toLowerCase();
      // Some don't have descriptions so if they don't just use an empty sting
      var lowercaseDec = item.attributes.DESCRIPT
        ? item.attributes.DESCRIPT.toLowerCase()
        : "";
      var lowercaseAlias = item.attributes.PARKALIAS
        ? item.attributes.PARKALIAS.toLowerCase()
        : "";
      var lowercaseQuery = this.filterQuery.toLowerCase();
      var selection = lowercaseName + lowercaseDec + lowercaseAlias;
      if (selection.indexOf(lowercaseQuery) > -1) {
        return true;
      } else {
        return false;
      }
    },
    viewParkDetails(park) {
      document.getElementById("park-details").scrollIntoView();
      // take the current park and pipe it into the details template
      // pull out park amenities into an array for easier rendering
      park.attributes.amenities = [];
      park.location = this.webMercatorToGeographic(park.geometry);
      for (var key in park.attributes) {
        if (park.attributes[key] == "Yes") {
          // Add this object key to the amenities list
          // Use the fieldNames object to translate the keys into human readable format
          park.attributes.amenities.push(this.fieldNames[key]);
        }
      }
      this.selectedPark = park;
    },
    webMercatorToGeographic(geometry) {
      // converts ESRI geometry from Web Mercator units to geographic units.
      // uses a mapbox convert because I don't wan to mess with Esri's bloated API
      // https://github.com/mapbox/sphericalmercator/blob/master/sphericalmercator.js
      const latlong = merc.inverse([geometry.x, geometry.y]);
      return {
        lat: latlong[1],
        long: latlong[0]
      };
    },
    distance(lat1, lon1) {
      // find distance from current location
      var lat2 = this.currentPos.coords.latitude;
      var lon2 = this.currentPos.coords.longitude;
      var R = 6371; // km
      //has a problem with the .toRad() method below.
      var x1 = lat2 - lat1;
      var dLat = x1.toRad();
      var x2 = lon2 - lon1;
      var dLon = x2.toRad();
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1.toRad()) *
          Math.cos(lat2.toRad()) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return Math.round((d /= 1.60934) * 10) / 10; //return miles not km
    },
    getCurrentPos() {
      var self = this;
      navigator.geolocation.getCurrentPosition(function(position) {
        self.currentPos = position;
        self.addDistanceToParks();
      });
    },
    addDistanceToParks() {
      var self = this;
      this.parksList = this.parksList.map(function(item) {
        var newitem = item;
        newitem.distanceTo = self.distance(
          item.location.lat,
          item.location.long
        );
        // updating key to force re-render of component
        newitem.attributes.GlobalID = newitem.attributes.GlobalID + "1";
        return newitem;
      });
    }
  }
};
</script>

<style lang="scss">
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-bottom: 3rem;
}
.park-search {
  color: #000;
  font-size: 18px;
  font-weight: 400;
  padding: 4px 14px;
  background: transparent none repeat scroll 0 0;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  height: auto;
  border-radius: 4px;
  display: inline-block;
  width: 100%;
}
.parklist li {
  list-style: none;
  background-color: #f5f5f5;
  padding: 0.25rem 0.65rem;
  margin: 0.65rem 0.33rem;
}
li {
  line-height: 1.8;
}
.main-app {
  background-color: #6fc56a;
  h4 {
    color: white;
  }
}
.parklist {
  max-height: 60vh;
  overflow: auto;
  padding-left: 0;
}
.parklist li:hover {
  cursor: pointer;
}
.dropdown-toggle {
  background-color: #f5f5f5 !important;
}
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: searchfield-cancel-button;
}
input[type="search"] {
  color: #000;
  font-size: 18px;
  font-weight: 400;
  padding: 4px 14px;
  background: transparent none repeat scroll 0 0;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  height: auto;
  border-radius: 4px;
  display: inline-block;
  width: 100%;
}
.meta-info {
  min-height: 2.5rem;
}
.sort-dist {
  font-size: 80%;
}
</style>
