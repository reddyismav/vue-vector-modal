import {
    providers,
    getDefaultProvider,
    constants,
    Contract,
  } from 'ethers';
  import { ERC20Abi } from '@connext/vector-types';
  
  import { ethProvidersOverrides } from '../constants';
  
  export const getExplorerLinkForTx = (
    chainId,
    txHash
  ) => {
    switch (chainId) {
      case 1: {
        return `https://etherscan.io/tx/${txHash}`;
      }
      case 4: {
        return `https://rinkeby.etherscan.io/tx/${txHash}`;
      }
      case 5: {
        return `https://goerli.etherscan.io/tx/${txHash}`;
      }
      case 42: {
        return `https://kovan.etherscan.io/tx/${txHash}`;
      }
      case 80001: {
        return `https://explorer-mumbai.maticvigil.com/tx/${txHash}`;
      }
      case 152709604825713: {
        return `https://explorer.offchainlabs.com/#/tx/${txHash}`;
      }
    }
    return '#';
  };
  
  export const getProviderUrlForChain = (chainId) => {
    switch (chainId) {
      case 5: {
        return `https://goerli.prylabs.net`;
      }
      case 80001: {
        return `https://rpc-mumbai.matic.today`;
      }
      case 152709604825713: {
        return `https://kovan2.arbitrum.io/rpc`;
      }
    }
    return undefined;
  };
  
  export const activePhase = (phase) => {
    switch (phase) {
      case 'INITIAL': {
        return -1;
      }
      case 'DEPOSITING': {
        return 0;
      }
      case 'TRANSFERRING': {
        return 1;
      }
      case 'WITHDRAWING': {
        return 2;
      }
      case 'COMPLETE': {
        return 3;
      }
      case 'ERROR': {
        return 4;
      }
    }
  };
  
  export const hydrateProviders = (
    depositChainId,
    withdrawChainId
  ) => {
    console.log(depositChainId, withdrawChainId);
    const _ethProviders = {};
    for (const chainId of [depositChainId, withdrawChainId]) {
      if (ethProvidersOverrides[chainId]) {
        _ethProviders[chainId] = new providers.JsonRpcProvider(
          ethProvidersOverrides[chainId]
        );
      } else {
        const providerUrl = getProviderUrlForChain(chainId);
        if (providerUrl) {
          _ethProviders[chainId] = new providers.JsonRpcProvider(providerUrl);
        } else {
          _ethProviders[chainId] = getDefaultProvider(chainId);
        }
      }
    }
    return _ethProviders;
  };
  
  export const getAssetBalance = async (
    ethProviders,
    chainId,
    assetId,
    balanceOfAddress
  ) => {
    const balance =
      assetId === constants.AddressZero
        ? await ethProviders[chainId].getBalance(balanceOfAddress)
        : await new Contract(assetId, ERC20Abi, ethProviders[chainId]).balanceOf(
            balanceOfAddress
          );
    return balance;
  };
  