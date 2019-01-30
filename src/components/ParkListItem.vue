<template>
  <li @click="$emit('view', park.attributes)">
    <strong>{{park.attributes.NAME}}</strong>
    <small v-if="park.attributes.PARKALIAS">({{park.attributes.PARKALIAS}})</small>
    -
    <span class="address">{{park.attributes.FULLADDR}}</span>
  </li>
</template>

<script>
export default {
  props: {
    park: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped>
.address {
  font-size: 80%;
}
</style>