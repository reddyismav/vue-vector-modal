<template>
    <div class="network-bar">
        <div class="deposit-chain">
            <p class="p-network-bar">{{depositChainName}}</p>
        </div>

        <button class="transfer-button">
            >>>
        </button>

        <div class="withdraw-chain">
            <p class="p-network-bar">{{withdrawChainName}}</p>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        depositChainName: String,
        withdrawChainName: String,
        crossChainTransfer: Function,
    },
}
</script>

<style>
.network-bar {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 15px 15px;
    border-top: 1px solid #a1a1a1;
}
.withdraw-chain {
    justify-content: center;
    display: flex;
    flex-direction: row;
    font-size: 12px;
    background-color: purple;
    border-radius: 5px;
}

.transfer-button {
    width: 36px;
    height: 36px;
    border-radius: 18px;
    border: none;
    display: flex;
    background-color: #fff;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 0px;
    font-weight: 700;
    font-size: 15px;
    border: solid 1px #a1a1a1;
}

.transfer-button:hover {
    background-color: #a1a1a1;
    cursor: pointer;
}

.p-network-bar {
    color: #ffffffff;
    font-weight: 500;
    font-style: italic;
    overflow: hidden;
    padding-left: 10px;
    padding-right: 10px;
    margin-top: 5px;
    margin-bottom: 4px;
}

.deposit-chain {
    justify-content: center;
    font-size: 12px;
    background-color: green;
    border-radius: 5px;
    padding: 2px 2px;
}
</style>