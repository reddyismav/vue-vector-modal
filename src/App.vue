<template>
  <button @click="toggleModal"> ABC </button>
  <ConnextModal v-if="showModal"
    :depositAssetId="depositAssetId"
    :showModal="showModal"
    :depositChainId="depositChainId"
    :withdrawAssetId="withdrawAssetId"
    :withdrawChainId="withdrawChainId"
    :withdrawalAddress="withdrawalAddress"
    :onClose="closeModal"
  />
</template>

<script>
import ConnextModal from './components/ConnextModal.vue'
import { ref } from 'vue' 

export default {
  name: 'App',
  components: {
    ConnextModal,
  },
  setup() {
    const showModal = ref(false);
    const depositAssetId = "0x655F2166b0709cd575202630952D71E2bB0d61Af";
    const depositChainId = 5;
    const withdrawAssetId = "0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1";
    const withdrawChainId = 80001;
    const withdrawalAddress = "0x5A9e792143bf2708b4765C144451dCa54f559a19";
    const toggleModal = () => {
      showModal.value = !showModal.value;
    };

    const closeModal = () => {
      showModal.value = !showModal.value;
    }
    return { toggleModal, showModal, closeModal, depositAssetId, depositChainId, withdrawAssetId, withdrawChainId, withdrawalAddress };
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
