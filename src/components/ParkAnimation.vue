<template>
  <div class="park">
    <div class="sky">
      <div class="sun">🌞</div>
    </div>
    <div class="ground">
      <div class="tree1">🌳</div>
      <div class="dog">🐕</div>
      <div class="bike">🚴</div>
      <div class="basketball">⛹</div>
      <div class="tree2">🌲</div>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style scoped lang="scss">
.park {
  display: flex;
  flex-direction: column;
  // margin-bottom: 1rem;
  overflow: hidden;
}
.ground {
  background-color: #6fc56a;
  height: 2.5rem;
  position: relative;
  // border-radius: 0 0 10px 10px;
}
.ground > div {
  position: absolute;
  top: -1rem;
}
.sky {
  height: 4rem;
  background-color: #b5ebff;
  background: linear-gradient(
    to bottom,
    #feffff 0%,
    #ddf1f9 35%,
    #a0d8ef 100%
  ); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
  position: relative;
  border-radius: 10px 10px 0 0;
}
.sun {
  position: absolute;
  left: 15%;
  font-size: 121%;
  top: -0.5rem;
  animation: slow-bounce 3.2s ease-in-out infinite;
}
@keyframes slow-bounce {
  0% {
    transform: translatey(0.3rem);
  }
  50% {
    transform: translatey(0.65rem);
  }
  100% {
    transform: translatey(0.3rem);
  }
}
.tree1 {
  left: 5%;
  font-size: 111%;
}
.tree2 {
  left: 83%;
  font-size: 108%;
}
.dog {
  left: 25%;
  animation: back-forth 20s ease-in-out infinite;
  top: -0.095rem !important;
  font-size: 85%;
}
.bike {
  left: 45%;
  animation: bike-across 25s ease-in-out infinite;
}
.basketball {
  left: 65%;
  animation: back-forth 16s ease-in-out infinite;
  font-size: 105%;
}
@keyframes bike-across {
  0% {
    transform: translate(80vw, 0px);
  }
  100% {
    transform: translate(-80vw, 0px);
  }
}
@keyframes back-forth {
  0% {
    transform: translate(0px, 0px);
  }
  25% {
    transform: translate(-10rem, 0px);
  }
  26% {
    transform: translate(-10rem, 0px) rotateY(180deg); // transform: translate(10rem, 0px);
  }
  75% {
    transform: translate(6rem, 0px) rotateY(180deg);
  }
  76% {
    transform: translate(6rem, 0px) rotateY(0deg);
  }
  100% {
    transform: translate(0px, 0px) rotateY(0deg);
  }
}
@keyframes back-forth2 {
  0% {
    transform: translate(0px, 0px);
  }
  15% {
    transform: translate(-0.5rem, 0px);
  }
  16% {
    transform: translate(-0.5rem, 0px) rotateY(180deg); // transform: translate(10rem, 0px);
  }
  65% {
    transform: translate(1rem, 0px) rotateY(180deg);
  }
  66% {
    transform: translate(1rem, 0px) rotateY(0deg);
  }
  100% {
    transform: translate(0px, 0px) rotateY(0deg);
  }
}
</style>