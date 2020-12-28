<template>
    <div>
        <div v-if="isDepositAddress" class="address-label"> Deposit Address</div>
        <div v-if="!isDepositAddress" class="address-label"> Withdrawal Address</div>
        <div class="address-input-div">
            <input v-model="address" class=input-address type="text">
            <button v-if="isCopyFunctionEnabled" class="copy-qrcode-button" @click="copyAddressToClipBoard">
                <img src="../assets/copy.svg">
            </button>
            <button v-if="isQrCodeEnabled" class="copy-qrcode-button" @click="generateQrCodeForDepositAddress">
                <img src="../assets/qr-code.svg">
            </button>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';
export default {
    props: {
        address: String,
        isDepositAddress: Boolean,
        isQrCodeEnabled: Boolean,
        isCopyFunctionEnabled: Boolean,
    },

    setup(props) {
        const { address } = props;
        const isDepositAddressCopied = ref("");
        const generateQrCodeForDepositAddress = (depositAddress) => {
            console.log("qrcode generated for deposit address", depositAddress);
        }
        const copyAddressToClipBoard = () => {
            console.log("qrcode generated", address);
            navigator.clipboard.writeText(address);
            isDepositAddressCopied.value = true;
        }

        return {
            isDepositAddressCopied, 
            generateQrCodeForDepositAddress,
            copyAddressToClipBoard,
        }
    }
}
</script>

<style>
.address-label {
    font-weight: 600;
    font-size: 20px;
    font-style: italic;
    letter-spacing: 1px;
    color: #111111;
    margin-left: 15px;
    margin-bottom: 5px;
    margin-top: 5px;
}

.address-input-div {
    display: flex;
    flex-direction: row;
    align-items: center;
    text-align: left;
    min-height: 40px;
}

.input-address {
    width: 100%;
    height: 36px;
    margin-left: 15px;
    margin-right: 10px;
}

.copy-qrcode-button {
    min-width: 36px;
    min-height: 36px;
    border-radius: 18px;
    border: none;
    display: flex;
    background-color: #fff;
    justify-content: center;
    align-items: center;
    text-align: center;
    margin-left: 5px;
    margin-right: 10px;
    font-weight: 700;
    font-size: 15px;
    padding: 0px;
}

.copy-qrcode-button:hover {
    background-color: #a1a1a1;
    cursor: pointer;
}
</style>