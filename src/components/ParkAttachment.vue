<template>
  <div class="padded">
    <img
      v-if="attachment.contentType.indexOf('image/') != -1"
      :key="attachment.name"
      :src="getAttachmentUrl(parkId, attachment)"
      :alt="attachment.name"
    >
    <a
      v-else-if="attachment.contentType == 'application/pdf'"
      :href="getAttachmentUrl(parkId, attachment)"
    >{{attachment.name}}</a>
    <a v-else :href="getAttachmentUrl(parkId, attachment)">{{attachment.name}}</a>
  </div>
</template>

<script>
export default {
  props: {
    parkId: String,
    attachment: {
      type: Object,
      required: true
    }
  },
  methods: {
    getAttachmentUrl(id, attachment) {
      return (
        "https://spatial.tampagov.net/arcgis/rest/services/Parks/Parks/MapServer/0/" +
        id +
        "/attachments/" +
        attachment.id
      );
    }
  }
};
</script>

<style scoped>
.padded {
  margin: 1rem 0;
}
</style>