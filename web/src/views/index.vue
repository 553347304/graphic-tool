<script setup lang="ts">
import {ref} from "vue";
import KonekoMessage from "@/koneko/vue/feedback/koneko-message.vue";

const  select = ref(0);
</script>

<template>

  <div class="app">
    <koneko-message type="danger">
      111111
    </koneko-message>
  </div>




</template>

<style scoped lang="scss">
.app {
  width: 100%;
  height: 100%;

}
</style>