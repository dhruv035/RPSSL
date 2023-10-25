import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import type { AppProps } from 'next/app';
import { configureChains, createConfig, sepolia, WagmiConfig } from 'wagmi';
import {
  arbitrum,
  goerli,
  mainnet,
  optimism,
  polygon,
  base,
  zora,
  polygonMumbai,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import {alchemyProvider} from 'wagmi/providers/alchemy'
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    goerli,
    sepolia,
    polygonMumbai,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    zora,
  ],
  [
    alchemyProvider({apiKey:process.env.NEXT_PUBLIC_ALCHEMY_KEY?process.env.NEXT_PUBLIC_ALCHEMY_KEY:""}),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'RainbowKit App',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID?process.env.NEXT_PUBLIC_PROJECT_ID:"My Rainbowkit App",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;
