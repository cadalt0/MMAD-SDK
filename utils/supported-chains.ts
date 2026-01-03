/**
 * Supported chains for ERC-7715 Advanced Permissions
 * Based on MetaMask ERC-7715 official support matrix
 */

import type { Chain } from 'viem';
import {
  arbitrumNova,
  arbitrumOne,
  base,
  bsc,
  ethereum,
  gnosis,
  optimism,
  polygon,
  arbitrumSepolia,
  baseSepolia,
  bscTestnet,
  optimismSepolia,
  polygonAmoy,
  sepolia,
} from 'viem/chains';

type SupportedChainsType = Record<string, Chain>;

export const SUPPORTED_CHAINS: SupportedChainsType = {
  // Mainnet networks
  ARBITRUM_NOVA: arbitrumNova,
  ARBITRUM_ONE: arbitrumOne,
  BASE: base,
  BERACHAIN: {
    id: 80084,
    name: 'Berachain',
    nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.berachain.com'] } },
  } as Chain,
  BSC: bsc,
  CITREA: {
    id: 5115,
    name: 'Citrea',
    nativeCurrency: { name: 'Citrea', symbol: 'XEC', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.citrea.xyz'] } },
  } as Chain,
  ETHEREUM: ethereum,
  GNOSIS: gnosis,
  MONAD: {
    id: 10143,
    name: 'Monad',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } },
  } as Chain,
  OPTIMISM: optimism,
  POLYGON: polygon,
  SONIC: {
    id: 250,
    name: 'Sonic',
    nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.sonic.fantom.network'] } },
  } as Chain,
  UNICHAIN: {
    id: 130,
    name: 'Unichain',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.unichain.org'] } },
  } as Chain,

  // Testnet networks
  ARBITRUM_SEPOLIA: arbitrumSepolia,
  BASE_SEPOLIA: baseSepolia,
  BERACHAIN_BEPOLIA: {
    id: 80085,
    name: 'Berachain Bepolia',
    nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
    rpcUrls: { default: { http: ['https://bepolia-rpc.berachain.com'] } },
  } as Chain,
  BSC_TESTNET: bscTestnet,
  CHIADO: {
    id: 10200,
    name: 'Chiado',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.chiado.gnosis.org'] } },
  } as Chain,
  CITREA_TESTNET: {
    id: 5115,
    name: 'Citrea Testnet',
    nativeCurrency: { name: 'Citrea', symbol: 'XEC', decimals: 18 },
    rpcUrls: { default: { http: ['https://testnet-rpc.citrea.xyz'] } },
  } as Chain,
  HOODI: {
    id: 127127,
    name: 'Hoodi',
    nativeCurrency: { name: 'HOODI', symbol: 'HOODI', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.hoodi.io'] } },
  } as Chain,
  MEGAETH: {
    id: 43111,
    name: 'MegaEth',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.megaeth.io'] } },
  } as Chain,
  OPTIMISM_SEPOLIA: optimismSepolia,
  POLYGON_AMOY: polygonAmoy,
  SEPOLIA: sepolia,
  SONIC_TESTNET: {
    id: 64165,
    name: 'Sonic Testnet',
    nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc-testnet.sonic.fantom.network'] } },
  } as Chain,
  UNICHAIN_SEPOLIA: {
    id: 1301,
    name: 'Unichain Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.unichain.org'] } },
  } as Chain,
};

export const SUPPORTED_CHAIN_IDS: readonly number[] = [
  // Mainnet
  42161, // Arbitrum Nova
  42161, // Arbitrum One
  8453, // Base
  80084, // Berachain
  56, // BSC
  5115, // Citrea
  1, // Ethereum
  100, // Gnosis
  10143, // Monad
  10, // Optimism
  137, // Polygon
  250, // Sonic
  130, // Unichain

  // Testnet
  421614, // Arbitrum Sepolia
  84532, // Base Sepolia
  80085, // Berachain Bepolia
  97, // BSC Testnet
  10200, // Chiado
  5115, // Citrea Testnet
  127127, // Hoodi
  43111, // MegaEth
  11155420, // Optimism Sepolia
  80002, // Polygon Amoy
  11155111, // Sepolia
  64165, // Sonic Testnet
  1301, // Unichain Sepolia
];

export function isSupportedChain(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}

export function getChainById(chainId: number): Chain | undefined {
  return Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === chainId);
}
