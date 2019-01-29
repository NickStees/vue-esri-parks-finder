<template>
  <div id="app">
    <div class="content container">
      <div class="row">
        <div class="col-sm-6">&nbsp;
          <ParkDetail v-if="selectedPark" :selectedPark="selectedPark"/>
        </div>

        <div class="col-sm-6">
          <h3>City of Tampa Parks</h3>
          <input type="search" placeholder="Type to filter" v-model="filterQuery">
          <ul v-if="messages.length >= 1">
            <li v-for="message in messages" :key="message"> {{message}} </li>
          </ul>
          <h4>Amenities</h4>
          <selectize v-model="selected" :settings="settings" multiple>
            <!-- settings is optional -->
            <option v-for="field in fields" :key="field.name" :value="field.name">{{field.alias}}</option>
          </selectize>
          <small
            class="text-muted text-right"
            v-if="parksList.length !== displayedParks.length"
          >Displaying {{displayedParks.length}} of {{parksList.length}} parks</small>
          <hr>
          <ul v-if="displayedParks.length" class="parklist">
            <ParkListItem
              v-for="park in displayedParks"
              :key="park.attributes.NAME"
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
</template>

<script>
import ParkDetail from "./components/ParkDetail.vue";
import ParkListItem from "./components/ParkListItem.vue";
import Selectize from "vue2-selectize";
import axios from 'axios'

export default {
  name: "app",
  components: {
    ParkDetail,
    ParkListItem,
    Selectize
  },
  data() {
    return {
      parksList: [],
      selectedPark: {},
      filterQuery: "",
      fieldNames: {},
      fields: {},
      selected: null,
      settings: {},
      messages: [],
    };
  },
  mounted() {
    // get parks info from Esri API when the component is ready(mounted)
    var self = this;
    axios.get('https://spatial.tampagov.net/arcgis/rest/services/Parks/Parks/MapServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*').then(response => {
        // Sort parks then set them into vue.js to render the data
        self.parksList = response.data.features.sort(function(a, b) {
          //  sort alphabetical by default
          var nameA = a.attributes.NAME.toLowerCase(),
            nameB = b.attributes.NAME.toLowerCase();
          if (nameA < nameB)
            //sort string ascending
            return -1;
          if (nameA > nameB) return 1;
          return 0; //default return value (no sorting)
        });
        // Store Human Readable Field names
        self.fieldNames = response.data.fieldAliases;
        self.fields = response.data.fields.filter(function(field) {
          // if its a lenght of 3 its likely a yes/no value which is an ammenity
          return field.length === 3;
        });
      }).catch(e => {
        self.messages.push(e)
      })
  },
  computed: {
    displayedParks() {
      // This is a filtered set of results that is returned to the vue to be rendered
      var parks = this.parksList;
      var filteredParks = parks.filter(this.filterItems);
      // filter by amenities
      if (this.selected && this.selected.length > 0) {
        this.selected.forEach(function(term) {
          filteredParks = filteredParks.filter(function(item) {
            return item.attributes[term] == "Yes";
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
      // take the current park and pipe it into the details template
      // pull out park amenities into an array for easier rendering
      park.amenities = [];
      for (var key in park) {
        if (park[key] == "Yes") {
          // Add this object key to the amenities list
          // Use the fieldNames object to translate the keys into human readable format
          park.amenities.push(this.fieldNames[key]);
        }
      }
      this.selectedPark = park;
    }
  }
};
</script>

<style lang="scss">
@import "~selectize/dist/css/selectize.bootstrap3.css";
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
.parklist li {
  list-style: none;
}
.parklist {
  max-height: 60vh;
  overflow: auto;
  padding-left: 0;
}
.parklist li:hover {
  cursor: pointer;
}
input[type=search]::-webkit-search-cancel-button {
  -webkit-appearance: searchfield-cancel-button;
}
input[type=search] {
  color: #000;
  font-size: 18px;
  font-weight: 400;
  padding: 4px 14px;
  background: transparent none repeat scroll 0 0;
  border: 1px solid #ccc;
  height: auto;
  border-radius: 4px;
  display: inline-block;
  width: 100%;

}
</style>
