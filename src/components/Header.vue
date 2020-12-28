<template>
  <div class="header">
      <button class="button" @click="onClose">
        <img src="../assets/cross-sign.svg"><img>
      </button>
      <p class="p-header"> Send Tokens </p>
      <button class="button">
          ...
      </button>
  </div>
</template>

<script>

export default {
    props: {
        onClose: Function,
    },

    setup() {
        const discordLink = `https://discord.com/channels/454734546869551114`;

        const openDiscordLink = () => {
            window.open(discordLink, "_blank");
        }
        return { discordLink, openDiscordLink };
    }

}
</script>

<style>

.header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 10px;
}

.p-header {
    margin: 0px;
    font-weight: 700;
}

.button {
    width: 24px;
    height: 24px;
    border-radius: 12px;
    border: none;
    display: flex;
    background-color: #fff;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 0px;
    font-weight: 700;
    font-size: 15px;
}

.button:hover {
    background-color: #a1a1a1;
    padding: 0px;
    cursor: pointer;
}
</style>