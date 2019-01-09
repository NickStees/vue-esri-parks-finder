<template>
  <div class="row">
    <div class="col-sm-6">&nbsp;
      <div class="park-details well" v-if="selectedPark.NAME">
        <a :href="getParkLinkUrl(selectedPark)">
          <img :src="getImgUrl(selectedPark)" class="img-responsive" alt="Park Location">
          {{selectedPark.FULLADDR}} {{selectedPark.CITY}}
        </a>
        <a
          :href="getParkDirectionsLinkUrl(selectedPark)"
          class="btn btn-default btn-xs pull-right"
        >Get Directions</a>
        <h1>{{selectedPark.NAME}}</h1>
        <small v-if="selectedPark.PARKALIAS">Also known as: {{selectedPark.PARKALIAS}}</small>
        <p>{{selectedPark.DESCRIPT}} {{selectedPark.DESCRIPT2}}</p>
        <hr>
        <ul class="list-group">
          <li class="list-group-item" v-if="selectedPark.OPERDAYS">
            Open:
            <strong>{{selectedPark.OPERDAYS}}</strong>
          </li>
          <li
            class="list-group-item"
            v-if="selectedPark.OPERHOURS && selectedPark.OPERHOURS != 'N/A'"
          >
            Hours:
            <strong>{{selectedPark.OPERHOURS}}</strong>
          </li>
          <li class="list-group-item" v-if="selectedPark.PHONE">
            Phone:
            <strong>
              <a :href="getTelUrl(selectedPark.PHONE)">{{selectedPark.PHONE}}</a>
            </strong>
          </li>
        </ul>
        <div v-if="selectedParkAttachments.length > 0">
          <img
            v-for="item in selectedParkAttachments"
            :key="item.name"
            :src="getAttachmentImgSrc(selectedPark.OBJECTID, item)"
            :alt="item.name"
          >
        </div>
        <div v-if="selectedPark.amenities.length > 0">Amenities:
          <ul>
            <li v-for="item in selectedPark.amenities" :key="item.name">{{item}}</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="col-sm-6">
      <!-- This Column show the list of parks -->
      <h3>City of Tampa Parks</h3>
      <input type="text" placeholder="Type to filter" v-model="filterQuery">
      <hr>
      <ul v-if="parksList.length" class="parklist">
        <ParkListItem
          v-for="park in displayedParks"
          :key="park.attributes.NAME"
          :park="park"
          @view="viewParkDetails"
        />
      </ul>
    </div>
  </div>
</template>

<script>
import ParkListItem from "./ParkListItem.vue";
export default {
  components: {
    ParkListItem
  },
  data() {
    return {
      parksList: [],
      selectedPark: {},
      selectedParkAttachments: [],
      filterQuery: "",
      fieldNames: {}
    };
  },
  mounted() {
    // get parks info from Esri API when the component is ready(mounted)
    var self = this;
    jQuery.getJSON(
      "https://spatial.tampagov.net/arcgis/rest/services/Parks/Parks/MapServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*",
      function(data) {
        // Sort parks then set them into vue.js to render the data
        self.parksList = data.features.sort(function(a, b) {
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
        self.fieldNames = data.fieldAliases;
      }
    );
  },
  computed: {
    displayedParks() {
      // This is a filtered set of results that is returned to the vue to be rendered
      var parks = this.parksList;
      var filteredParks = parks.filter(this.filterItems);
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
      this.selectedParkAttachments = []; //clear out previous attachments
      for (var key in park) {
        if (park[key] == "Yes") {
          // Add this object key to the amenities list
          // Use the fieldNames object to translate the keys into human readable format
          park.amenities.push(this.fieldNames[key]);
        }
      }
      this.selectedPark = park;
      this.getParkAttachments(park);
    },
    getImgUrl(park) {
      return (
        "https://maps.googleapis.com/maps/api/staticmap?center=" +
        encodeURI(park.FULLADDR) +
        "+" +
        encodeURI(park.CITY) +
        "+" +
        encodeURI(park.STATE) +
        "&zoom=16&size=555x350&key=" +
        "AIzaSyC-ANZln2BZrn95EVc3IiQUVF-xmAZW2uU"
      );
    },
    getParkLinkUrl(park) {
      return (
        "https://apps.tampagov.net/park_finder_webapp/default.htm?selectedFeatureID=" +
        park.FACILITYID
      );
    },
    getParkDirectionsLinkUrl(park) {
      return (
        "https://www.google.com/maps/dir//" +
        park.FULLADDR +
        "+" +
        park.CITY +
        "+" +
        park.STATE +
        "+" +
        park.ZIPCODE
      );
    },
    getAttachmentImgSrc(id, attachment) {
      return (
        "https://spatial.tampagov.net/arcgis/rest/services/Parks/Parks/MapServer/0/" +
        id +
        "/attachments/" +
        attachment.id
      );
    },
    getTelUrl(tel) {
      return "tel:" + tel;
    },
    getParkAttachments(park) {
      var self = this;
      var urlForAttachments =
        "https://spatial.tampagov.net/arcgis/rest/services/Parks/Parks/MapServer/0/" +
        park.OBJECTID +
        "/attachments?f=json";
      jQuery.getJSON(urlForAttachments, function(data) {
        // Save attachments to be rendered by vue
        data.attachmentInfos.forEach(function(item) {
          self.selectedParkAttachments.push(item);
        });
      });
      return (
        "https://www.google.com/maps/dir//" +
        park.FULLADDR +
        "+" +
        park.CITY +
        "+" +
        park.STATE +
        "+" +
        park.ZIPCODE
      );
    }
  }
};
</script>

<style scoped>
</style>