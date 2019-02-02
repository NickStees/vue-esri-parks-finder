<template>
  <li @click="$emit('view', park)">
    <span class="address">{{park.attributes.FULLADDR}}</span>
    <strong>{{park.attributes.NAME}}</strong>
    <small v-if="park.attributes.PARKALIAS">({{park.attributes.PARKALIAS}})</small>
   <div class="distance" v-if="park.distanceTo">{{park.distanceTo.toLocaleString()}}m away</div>
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
  float: right;
}
small {
  padding-left: 0.3rem;
}
.distance{
  font-size: 60%;
}
</style>