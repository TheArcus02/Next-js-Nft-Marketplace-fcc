import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { MoralisProvider } from 'react-moralis'
import Header from '@/components/Header'
import Head from 'next/head'
import { NotificationProvider } from '@web3uikit/core'
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client/'

const client = new ApolloClient({
    cache: new InMemoryCache(),
    uri: 'https://api.studio.thegraph.com/query/45986/nft-marketplace/v0.0.2',
})

export default function App({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <title>NFT Marketplace</title>
                <meta name="description" content="NFT Marketplace" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <MoralisProvider initializeOnMount={false}>
                <ApolloProvider client={client}>
                    <NotificationProvider>
                        <Header />
                        <Component {...pageProps} />
                    </NotificationProvider>
                </ApolloProvider>
            </MoralisProvider>
        </>
    )
}
