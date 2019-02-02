<template>
  <div class="park-details well" v-if="selectedPark.attributes && selectedPark.attributes.NAME">
    <a :href="esriMapLink">
      <img :src="googleMapImg" class="img-responsive" alt="Park Location">
      {{selectedPark.attributes.FULLADDR}} {{selectedPark.attributes.CITY}}
    </a>
    <a :href="googleDirections" class="btn btn-default btn-xs pull-right">Get Directions</a>
    <h1 style="clear:both;margin-top:44px;">{{selectedPark.attributes.NAME}}</h1>
    <small
      v-if="selectedPark.attributes.PARKALIAS"
    >Also known as: {{selectedPark.attributes.PARKALIAS}}</small>
    <p v-if="selectedPark.attributes.DESCRIPT">{{selectedPark.attributes.DESCRIPT}}</p>
    <p v-if="selectedPark.attributes.DESCRIPT2">{{selectedPark.attributes.DESCRIPT2}}</p>
    <ul class="list-group">
      <li class="list-group-item" v-if="selectedPark.attributes.OPERDAYS">
        Open:
        <strong>{{selectedPark.attributes.OPERDAYS}}</strong>
      </li>
      <li
        class="list-group-item"
        v-if="selectedPark.attributes.OPERHOURS && selectedPark.attributes.OPERHOURS != 'N/A'"
      >
        Hours:
        <strong>{{selectedPark.attributes.OPERHOURS}}</strong>
      </li>
      <li class="list-group-item" v-if="selectedPark.attributes.PHONE">
        Phone:
        <strong>
          <a :href="telHref">{{selectedPark.attributes.PHONE}}</a>
        </strong>
      </li>
      <li class="list-group-item" v-if="selectedPark.attributes.SHELTERURL">
        Shelter:
        <strong>
          <a :href="selectedPark.attributes.SHELTERURL">Online Information</a>
        </strong>
      </li>
    </ul>
    <div v-if="parkAttachments || attachments.length > 0">
      <ParkAttachment
        v-for="attachment in attachments"
        :key="attachment.id"
        :attachment="attachment"
        :parkId="selectedPark.attributes.OBJECTID"
      />
    </div>
    <div v-if="selectedPark.attributes.amenities.length > 0">Amenities:
      <ul>
        <li v-for="item in selectedPark.attributes.amenities" :key="item.name">{{item}}</li>
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
      return this.getParkLinkUrl(this.selectedPark.attributes);
    },
    googleDirections() {
      return this.getParkDirectionsLinkUrl(this.selectedPark.attributes);
    },
    telHref() {
      return this.selectedPark.attributes.PHONE
        ? "tel:" + this.selectedPark.attributes.PHONE
        : "";
    },
    parkAttachments() {
      return this.getParkAttachments(this.selectedPark.attributes);
    }
  },
  methods: {
    getImgUrl(park) {
      return (
        "https://maps.googleapis.com/maps/api/staticmap?center=" +
        encodeURI(park.attributes.FULLADDR) +
        "+" +
        encodeURI(park.attributes.CITY) +
        "+" +
        encodeURI(park.attributes.STATE) +
        "&markers=color:red%7Clabel:P%7C" +
        park.latlong[1] +
        "," +
        park.latlong[0] +
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