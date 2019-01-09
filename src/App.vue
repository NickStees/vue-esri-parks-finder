<template>
  <div id="app">
    <park-detail/>
  </div>
</template>

<script>
import ParkDetail from "./components/ParkDetail.vue";

export default {
  name: "app",
  components: {
    ParkDetail
  }
};
</script>

<style>
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
}
.parklist li:hover {
  cursor: pointer;
}
</style>
