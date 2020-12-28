<template>
    <div class="modal">
        <!-- Loader component -->
        <div v-if="initing" v-bind:class="initing ? 'Loading' : 'Loading Loading-fadeout'">
            <div
                class="Loading-Circle"
            >
                <img src="../assets/867.gif" alt="loading"><img>
            </div>
            <div className="Loading-Message">Loading...</div>
        </div>
        <!-- Loader component -->

        <!-- Main Connext Modal -->
        <Header :onClose="onClose" />
        <NetworkBar
            v-if="!initing"
            :depositChainName="depositChainName"
            :withdrawChainName="withdrawChainName"
            :crossChainTransfer="crossChainTransfer"
        />
        <AddressInput
            v-if="depositAddress"
            :isDepositAddress="true"
            :address="depositAddress"
            :isQrCodeEnabled="true"
            :isCopyFunctionEnabled="true"
        />
        <div v-if="depositAddress" class="todo">
            TODO STATUS BAR
        </div>
        <AddressInput
            v-if="depositAddress"
            :isDepositAddress="false"
            :address="withdrawalAddress"
            :isCopyFunctionEnabled="false"
            :isQrCodeEnabled="false"
        />
        <!-- Main Connext Modal -->
    </div>
</template>

<script>
import { onMounted, ref, toRefs } from 'vue';
import { BrowserNode } from '@connext/vector-browser-node';
import { 
    // BigNumber, 
    utils 
} from 'ethers';
import { EngineEvents } from '@connext/vector-types';
import { getRandomBytes32 } from '@connext/vector-utils';
import {
  CHAIN_INFO_URL,
  routerPublicIdentifier,
  iframeSrc,
  TRANSFER_STATES,
} from '../constants';
import {
  // getExplorerLinkForTx,
  activePhase,
  getAssetBalance,
  hydrateProviders,
} from '../utils';
import Header from '../components/Header.vue';
import NetworkBar from '../components/NetworkBar.vue';
import AddressInput from '../components/AddressInput.vue';

export default {
    components: {
        Header,
        NetworkBar,
        AddressInput,
    },
    //Props required for the connext modal
    props: {
        showModal: Boolean,
        depositChainId: Number,
        depositAssetId: String,
        withdrawChainId: Number,
        withdrawAssetId: String,
        withdrawalAddress: String,
        onClose: Function,
    },

    // Defining all the reactive references being used.
    setup(props) {
        const { 
            showModal,
            depositChainId,
            depositAssetId,
            withdrawChainId,
            withdrawAssetId,
            withdrawalAddress,
            //onClose,
        } = props;
        console.log("depositChainId", props.depositChainId)
        const initializing = ref(true);
        const depositAddress = ref("");
        const depositChainName = ref("");
        const withdrawChainName = ref("");
        const sentAmount = ref("");
        const withdrawTx = ref("");
        const crossChainTransfers =ref({});
        const initing = ref(true);
        const activeStep = ref(-1);
        const activeCrossChainTransferId = ref("");
        const error = ref();
        const transferState = ref(crossChainTransfers[activeCrossChainTransferId] ?? TRANSFER_STATES.INITIAL);

        // Required Actions After mount.
        onMounted(() => {
            initializing.value = false;
            const init = async () => {
                if (showModal) {
                    await getChainInfo();
                    const _ethProviders = hydrateProviders(depositChainId, withdrawChainId);
                    
                    // Creating a new browser node
                    const browserNode = new BrowserNode({
                        routerPublicIdentifier,
                        iframeSrc,
                        supportedChains: [depositChainId, withdrawChainId],
                    });
                    
                    // Initializing the browser node.
                    try {
                        await browserNode.init();
                    } catch (e) {
                        initing.value = false;
                        error.value = e;
                        return;
                    }

                    registerEngineEventListeners(browserNode);
                    //-----Initialisation of Browser node complete.-----//
                    
                    // Withdraw and Deposit Channels
                    const depositChannelRes = await browserNode.getStateChannelByParticipants({ 
                        chainId: depositChainId, 
                        counterparty: routerPublicIdentifier 
                    });
                    if (depositChannelRes.isError) {
                        initing.value = false;
                        error.value = depositChannelRes.getError();
                        return;
                    }
                    const depositChannel = depositChannelRes.getValue();
                    const _depositAddress = depositChannel.channelAddress;
                    depositAddress.value = _depositAddress;

                    const withdrawChannelRes = await browserNode.getStateChannelByParticipants({
                        chainId: withdrawChainId,
                        counterparty: routerPublicIdentifier,
                    });
                    if (withdrawChannelRes.isError) {
                        initing.value = false;
                        error.value = withdrawChannelRes.getError();
                        return;
                    }

                    //Get Starting Balance
                    let startingBalance;
                    try {
                        startingBalance = await getAssetBalance(
                            _ethProviders,
                            depositChainId,
                            depositAssetId,
                            _depositAddress
                        );
                    } catch (e) {
                        initing.value = false;
                        error.value = e;
                        return;
                    }
                    console.log(
                    `Starting balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${startingBalance.toString()}`
                    );
                    
                    //Get Updated Balance
                    _ethProviders[depositChainId].on('block', async (blockNumber) => {
                        console.log("Block Number", blockNumber);
                        let updatedBalance;
                        try {
                            updatedBalance = await getAssetBalance(
                            _ethProviders,
                            depositChainId,
                            depositAssetId,
                            _depositAddress
                            );
                        } catch (e) {
                            console.warn(`Error fetching balance: ${e.message}`);
                            return;
                        }
                        console.log(
                            `Updated balance on ${depositChainId} for ${_depositAddress} of asset ${depositAssetId}: ${updatedBalance.toString()}`
                        );

                        //Check if updated balance is grater than startingBalance
                        if (updatedBalance.gt(startingBalance)) {
                            const transferAmount = updatedBalance.sub(startingBalance);
                            const crossChainTransferId = getRandomBytes32();
                            activeCrossChainTransferId.value = crossChainTransferId;
                            const updated = { ...crossChainTransfers };
                            updated[crossChainTransferId] = TRANSFER_STATES.DEPOSITING;
                            crossChainTransfers.value = updated;
                            activeStep.value = activePhase(TRANSFER_STATES.DEPOSITING);
                            _ethProviders[depositChainId].off('block');
                            await crossChainTransfer(
                                browserNode,
                                transferAmount,
                                crossChainTransferId
                            );
                        }
                    });
                    initing.value = false;
                }
            }
            init();
        });

        const registerEngineEventListeners = async (node) => {
            node.on(EngineEvents.DEPOSIT_RECONCILED, data => {
                console.log(data);
                // if (data.meta.crossChainTransferId) {
                setCrossChainTransferWithErrorTimeout(
                    activeCrossChainTransferId,
                    TRANSFER_STATES.TRANSFERRING
                );
                // }
            });
            node.on(EngineEvents.CONDITIONAL_TRANSFER_RESOLVED, data => {
                if (
                    data.transfer.meta.crossChainTransferId &&
                    data.transfer.initiator === node.signerAddress
                ) {
                    setCrossChainTransferWithErrorTimeout(
                    data.transfer.meta.crossChainTransferId,
                    TRANSFER_STATES.WITHDRAWING
                    );
                }
            });
            node.on(EngineEvents.WITHDRAWAL_RESOLVED, data => {
                if (
                    data.transfer.meta.crossChainTransferId &&
                    data.transfer.initiator === node.signerAddress
                ) {
                    setCrossChainTransferWithErrorTimeout(
                    data.transfer.meta.crossChainTransferId,
                    TRANSFER_STATES.COMPLETE
                    );
                }
            });
        }

        const setCrossChainTransferWithErrorTimeout = async (crossChainTransferId, phase) => {
            let tracked = { ...crossChainTransfers };
            tracked[crossChainTransferId] = phase;
            crossChainTransfers.value = tracked;
            activeStep.value = phase;
            setTimeout(() => {
                if (crossChainTransfers[crossChainTransferId] !== phase) {
                    return;
                }
                let tracked = { ...crossChainTransfers };
                tracked[crossChainTransferId] = TRANSFER_STATES.ERROR;
                crossChainTransfers.value = tracked;
                activeStep.value = phase;
                error.value = new Error(`No updates within 30s for ${crossChainTransferId}`);
            }, 30_000);
        };

        const getChainInfo = async () => {
            try {
            const chainInfo = await utils.fetchJson(CHAIN_INFO_URL);
            const depositChainInfo = chainInfo.find(
                info => info.chainId === depositChainId
            );
            if (depositChainInfo) {
                depositChainName.value = depositChainInfo.name;
            }

            const withdrawChainInfo = chainInfo.find(
                info => info.chainId === withdrawChainId
            );
            if (withdrawChainInfo) {
                withdrawChainName.value = withdrawChainInfo.name;
            }
            } catch (e) {
                console.warn(`Could not fetch chain info from ${CHAIN_INFO_URL}`);
            }
        };

        const crossChainTransfer = async (node, transferAmount, crossChainTransferId) => {
            let res = {};
            try {
            res = await node.crossChainTransfer({
                amount: transferAmount.toString(),
                fromAssetId: depositAssetId,
                fromChainId: depositChainId,
                toAssetId: withdrawAssetId,
                toChainId: withdrawChainId,
                reconcileDeposit: true,
                withdrawalAddress,
                meta: { crossChainTransferId },
            });
            } catch (e) {
                error.value = e;
                console.error('Error in crossChainTransfer: ', e);
                const updated = { ...crossChainTransfers };
                updated[crossChainTransferId] = TRANSFER_STATES.ERROR;
                activeStep.value = activePhase(TRANSFER_STATES.ERROR);
                crossChainTransfers.value = updated;
            }

            console.log('crossChainTransfer: ', res);
            withdrawTx.value = res.withdrawalTx;
            sentAmount.value = res.withdrawalAmount;
            const updated = { ...crossChainTransfers };
            updated[crossChainTransferId] = TRANSFER_STATES.COMPLETE;
            activeStep.value = activePhase(TRANSFER_STATES.COMPLETE);
            crossChainTransfers.value = updated;
        };

        return { 
            initializing,
            depositChainName,
            depositAddress,
            withdrawChainName,
            sentAmount,
            withdrawTx,
            crossChainTransfers,
            initing,
            activeStep,
            activeCrossChainTransferId,
            error,
            transferState,
            crossChainTransfer,
            getChainInfo,
            setCrossChainTransferWithErrorTimeout,
            registerEngineEventListeners,
        }
    }
}
</script>

<style>

.Loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(244, 245, 247, 0.8);
  z-index: 999;
}

.Loading-fadeout {
  -moz-animation-name: fadeOut;
  -webkit-animation-name: fadeOut;
  -ms-animation-name: fadeOut;
  animation-name: fadeOut;
  -moz-animation-duration: 0.5s;
  -webkit-animation-duration: 0.5s;
  -ms-animation-duration: 0.5s;
  animation-duration: 0.5s;
  -moz-animation-fill-mode: forwards;
  -webkit-animation-fill-mode: forwards;
  -ms-animation-fill-mode: forwards;
  animation-fill-mode: forwards;
}

.Loading-Circle {
  height: 96px;
  width: 96px;
  border-radius: 64px;
  background-color: #fcd116;
  overflow: hidden;
}

.Loading-Circle img {
  width: 100%;
  height: 100%;
}

.Loading-Message {
  margin-top: 24px;
  font-size: 14px;
}

.modal {
    background: #fff;
    border: 1px solid #a1a1a1;
    border-radius: 5px;
    box-shadow: 1px 1px 1px #000;
    min-width: 400px;
    max-width: 400px;
    min-height: 450px;
    z-index: 100;
    margin-top: 20px;
    text-align: left;
}

.todo{
    margin-top: 100px;
    margin-left: 15px;
}
</style>