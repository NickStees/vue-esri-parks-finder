<template>
  <li @click="$emit('view', park.attributes)">
    <strong>{{park.attributes.NAME}}</strong>
    <small v-if="park.attributes.PARKALIAS">({{park.attributes.PARKALIAS}})</small>
    - {{park.attributes.FULLADDR}}
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
</style>