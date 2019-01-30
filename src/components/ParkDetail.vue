<template>
  <div class="park-details well" v-if="selectedPark.NAME">
    <a :href="esriMapLink">
      <img :src="googleMapImg" class="img-responsive" alt="Park Location">
      {{selectedPark.FULLADDR}} {{selectedPark.CITY}}
    </a>
    <a :href="googleDirections" class="btn btn-default btn-xs pull-right">Get Directions</a>
    <h1>{{selectedPark.NAME}}</h1>
    <small v-if="selectedPark.PARKALIAS">Also known as: {{selectedPark.PARKALIAS}}</small>
    <p>{{selectedPark.DESCRIPT}} {{selectedPark.DESCRIPT2}}</p>
    <hr>
    <ul class="list-group">
      <li class="list-group-item" v-if="selectedPark.OPERDAYS">
        Open:
        <strong>{{selectedPark.OPERDAYS}}</strong>
      </li>
      <li class="list-group-item" v-if="selectedPark.OPERHOURS && selectedPark.OPERHOURS != 'N/A'">
        Hours:
        <strong>{{selectedPark.OPERHOURS}}</strong>
      </li>
      <li class="list-group-item" v-if="selectedPark.PHONE">
        Phone:
        <strong>
          <a :href="telHref">{{selectedPark.PHONE}}</a>
        </strong>
      </li>
    </ul>
    <div v-if="parkAttachments || attachments.length > 0">
      <ParkAttachment
        v-for="attachment in attachments"
        :key="attachment.id"
        :attachment="attachment"
        :parkId="selectedPark.OBJECTID"
      />
    </div>
    <div v-if="selectedPark.amenities.length > 0">Amenities:
      <ul>
        <li v-for="item in selectedPark.amenities" :key="item.name">{{item}}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import ParkAttachment from "./ParkAttachment.vue";

export default {
  props: {
    selectedPark: {
      type: Object,
      required: true
    }
  },
  components: {
    ParkAttachment
  },
  data() {
    return {
      attachments: []
    };
  },
  computed: {
    googleMapImg() {
      return this.getImgUrl(this.selectedPark);
    },
    esriMapLink() {
      return this.getParkLinkUrl(this.selectedPark);
    },
    googleDirections() {
      return this.getParkDirectionsLinkUrl(this.selectedPark);
    },
    telHref() {
      return this.selectedPark.PHONE ? "tel:" + this.selectedPark.PHONE : "";
    },
    parkAttachments() {
      return this.getParkAttachments(this.selectedPark);
    }
  },
  methods: {
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
    getParkAttachments(park) {
      var self = this;
      self.attachments = [];
      var urlForAttachments =
        "https://spatial.tampagov.net/arcgis/rest/services/Parks/Parks/MapServer/0/" +
        park.OBJECTID +
        "/attachments?f=json";
      axios
        .get(urlForAttachments)
        .then(response => {
          // Save attachments to be rendered by vue
          self.attachments = response.data.attachmentInfos;
        })
        .catch(e => {
          self.messages.push(e.message);
        });
    }
  }
};
</script>

<style scoped>
</style>