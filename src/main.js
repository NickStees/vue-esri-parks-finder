import Vue from "vue";
import App from "./App.vue";

require("./assets/css/styles.min.css");
require("../node_modules/selectize/dist/css/selectize.bootstrap3.css");

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount("#app");
