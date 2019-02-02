<template>
  <div id="app">
    <div class="content container">
      <div class="row text-center">
        <h1>Find a Tampa Park</h1>
        <div class="park">
          <div class="sky">
            <div class="sun">🌞</div>
          </div>
          <div class="ground">
            <div class="tree1">🌳</div>
            <div class="dog">🐕</div>
            <div class="bike">🚴</div>
            <div class="basketball">⛹</div>
            <div class="tree2">🌲</div>
          </div>
        </div>
      </div>
      <div class="row">
        <div id="park-details" class="col-sm-6">&nbsp;
          <ParkDetail v-if="selectedPark" :selectedPark="selectedPark"/>
        </div>

        <div class="col-sm-6">
          <ul v-if="messages.length >= 1">
            <li v-for="message in messages" :key="message">{{message}}</li>
          </ul>
          <h4>Park Amenities</h4>
          <v-select multiple v-model="selected" :options="options"></v-select>
          <hr>
          <input
            type="search"
            placeholder="Type to filter"
            v-model="filterQuery"
            class="park-search"
          >
          <div class="checkbox sort-dist text-right">
            <label>
              <input type="checkbox" v-model="sortByDist" @click="getCurrentPos"> Sort by Distance</span>
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
          <div class="lds-ring" v-if="showLoader">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
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
import vSelect from "vue-select";
import axios from "axios";

import sphericalmercator from "@mapbox/sphericalmercator";
var merc = new sphericalmercator({
  size: 256
});
export default {
  name: "app",
  components: {
    ParkDetail,
    ParkListItem,
    vSelect
  },
  data() {
    return {
      parksList: [],
      selectedPark: {},
      filterQuery: "",
      fieldNames: {},
      fields: {},
      options: [],
      selected: null,
      messages: [],
      showLoader: true,
      currentPos: {},
      sortByDist: false,
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
        // Sort parks then set them into vue.js to render the data
        var allParks = response.data.features
          .sort(function(a, b) {
          //  sort alphabetical by default
          var nameA = a.attributes.NAME.toLowerCase(),
            nameB = b.attributes.NAME.toLowerCase();
          if (nameA < nameB)
            //sort string ascending
            return -1;

          if (nameA > nameB) return 1;
          return 0; //default return value (no sorting)
        });
        // figure out lat/long for each park
        var processedParks = allParks
        .map(function(item) {
          var newitem = item;
          newitem.location = newitem.geometry ? self.webMercatorToGeographic(newitem.geometry) : []
          return newitem
        });
          self.parksList = processedParks
        // Store Human Readable Field names
        self.fieldNames = response.data.fieldAliases;
        self.fields = response.data.fields
          .filter(function(field) {
            // if its a lenght of 3 its likely a yes/no value which is an ammenity
            return field.length === 3;
          })
          .sort(function(a, b) {
            //  sort alphabetical by default
            var nameA = a.alias.toLowerCase(),
              nameB = b.alias.toLowerCase();
            if (nameA < nameB)
              //sort string ascending
              return -1;

            if (nameA > nameB) return 1;
            return 0; //default return value (no sorting)
          })
          .forEach(item => {
            self.options.push({
              value: item.name,
              label: item.alias
            });
          });
      })
      .catch(e => {
        this.showLoader = false;
        self.messages.push(e.message);
      });
  },
  computed: {
    displayedParks() {
      var self = this
      // This is a filtered set of results that is returned to the vue to be rendered
      var parks = this.parksList; //take all the parks
      if(this.sortByDist){
        // sort by distance
        parks.sort(function(a, b) {
          //  sort alphabetical by default
          var nameA = a.distanceTo,
            nameB = b.distanceTo;
          if (nameA < nameB)
            //sort string ascending
            return -1;

          if (nameA > nameB) return 1;
          return 0; //default return value (no sorting)
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
      const latlong =  merc.inverse([geometry.x, geometry.y]);
      return {
        "lat": latlong[1],
        "long": latlong[0]
      }
    },
    distance(lat1, lon1, unit) {
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//:::                                                                         :::
//:::  This routine calculates the distance between two points (given the     :::
//:::  latitude/longitude of those points). It is being used to calculate     :::
//:::  the distance between two locations using GeoDataSource (TM) prodducts  :::
//:::                                                                         :::
//:::  Definitions:                                                           :::
//:::    South latitudes are negative, east longitudes are positive           :::
//:::                                                                         :::
//:::  Passed to function:                                                    :::
//:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
//:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
//:::    unit = the unit you desire for results                               :::
//:::           where: 'M' is statute miles (default)                         :::
//:::                  'K' is kilometers                                      :::
//:::                  'N' is nautical miles                                  :::
//:::                                                                         :::
//:::  Worldwide cities and other features databases with latitude longitude  :::
//:::  are available at https://www.geodatasource.com                         :::
//:::                                                                         :::
//:::  For enquiries, please contact sales@geodatasource.com                  :::
//:::                                                                         :::
//:::  Official Web site: https://www.geodatasource.com                       :::
//:::                                                                         :::
//:::               GeoDataSource.com (C) All Rights Reserved 2018            :::
//:::                                                                         :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      var lat2 = this.currentPos.coords.latitude
      var lon2 = this.currentPos.coords.latitude
      if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
      }
      else {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
          dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        // dist = Math.round(dist*0.000621371192); //convet to miles
        return Math.round(dist * 3.2808);
      }
    },
    getCurrentPos(){
      var self = this;
      navigator.geolocation.getCurrentPosition(function(position) {
        self.currentPos = position;
        self.addDistanceToParks()
      });
    },
    addDistanceToParks(){
      var self = this;
      this.parksList = this.parksList.map(function(item) {
          var newitem = item;
          newitem.distanceTo = self.distance(item.location.lat, item.location.long)
          // updating key to force re-render of component
          newitem.attributes.GlobalID = newitem.attributes.GlobalID+"1"
          return newitem
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
.sort-dist{
  font-size: 80%;
}
// ajax loader
.lds-ring {
  display: inline-block;
  position: relative;
  width: 64px;
  height: 64px;
  margin-left: 38%;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 51px;
  height: 51px;
  margin: 6px;
  border: 6px solid rgb(41, 41, 41);
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: rgb(41, 41, 41) transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.park {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  overflow: hidden;
}
.ground {
  background-color: #6fc56a;
  height: 1.5rem;
  position: relative;
  border-radius: 0 0 50% 50%;
}
.ground > div {
  position: absolute;
  top: -1rem;
}
.sky {
  height: 3rem;
  background-color: #b5ebff;
  background: linear-gradient(
    to bottom,
    #feffff 0%,
    #ddf1f9 35%,
    #a0d8ef 100%
  ); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
  position: relative;
  border-radius: 50% 50% 0 0;
}
.sun {
  position: absolute;
  left: 15%;
  font-size: 121%;
  top: -0.5rem;
  animation: slow-bounce 3.2s ease-in-out infinite;
}
@keyframes slow-bounce {
  0% {
    transform: translatey(0.3rem);
  }
  50% {
    transform: translatey(0.65rem);
  }
  100% {
    transform: translatey(0.3rem);
  }
}
.tree1 {
  left: 5%;
  font-size: 111%;
}
.tree2 {
  left: 83%;
  font-size: 108%;
}
.dog {
  left: 25%;
  animation: back-forth 20s ease-in-out infinite;
  top: -0.095rem !important;
  font-size: 85%;
}
.bike {
  left: 45%;
  animation: bike-across 25s ease-in-out infinite;
}
.basketball {
  left: 65%;
  animation: back-forth 16s ease-in-out infinite;
  font-size: 105%;
}
@keyframes bike-across {
  0% {
    transform: translate(80vw, 0px);
  }
  100% {
    transform: translate(-80vw, 0px);
  }
}
@keyframes back-forth {
  0% {
    transform: translate(0px, 0px);
  }
  25% {
    transform: translate(-10rem, 0px);
  }
  26% {
    transform: translate(-10rem, 0px) rotateY(180deg);
    // transform: translate(10rem, 0px);
  }
  75% {
    transform: translate(6rem, 0px) rotateY(180deg);
  }
  76% {
    transform: translate(6rem, 0px) rotateY(0deg);
  }
  100% {
    transform: translate(0px, 0px) rotateY(0deg);
  }
}
@keyframes back-forth2 {
  0% {
    transform: translate(0px, 0px);
  }
  15% {
    transform: translate(-0.5rem, 0px);
  }
  16% {
    transform: translate(-0.5rem, 0px) rotateY(180deg);
    // transform: translate(10rem, 0px);
  }
  65% {
    transform: translate(1rem, 0px) rotateY(180deg);
  }
  66% {
    transform: translate(1rem, 0px) rotateY(0deg);
  }
  100% {
    transform: translate(0px, 0px) rotateY(0deg);
  }
}
</style>
