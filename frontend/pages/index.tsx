import type { NextPage } from 'next'
import NFTBox from '../components/NFTBox'
import networkConfig from '../constants/networkMapping.json'
import { useMoralis } from 'react-moralis'
import GET_ACTIVE_ITEMS from '../constants/subgraphQueries'
import { useQuery } from '@apollo/client'

interface nftInterface {
    price: number
    nftAddress: string
    tokenId: string
    address: string
    seller: string
}

interface contractAddressesInterface {
    [key: string]: contractAddressesItemInterface
}

interface contractAddressesItemInterface {
    [key: string]: string[]
}

const Home: NextPage = () => {
    const { chainId } = useMoralis()
    const addresses: contractAddressesInterface = networkConfig
    const marketplaceAddress = chainId
        ? addresses[parseInt(chainId!).toString()]['NftMarketplace'][0]
        : null

    const { loading, error: subgraphQueryError, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS)

    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
            <div className="flex flex-wrap">
                {loading || !listedNfts ? (
                    <div>Loading...</div>
                ) : (
                    listedNfts.activeItems.map((nft: nftInterface) => {
                        const { price, nftAddress, tokenId, seller } = nft
                        // console.log(marketplaceAddress)
                        // console.log(nft)

                        return (
                            <NFTBox
                                price={price}
                                nftAddress={nftAddress}
                                tokenId={tokenId}
                                nftMarketplaceAddress={marketplaceAddress!}
                                seller={seller}
                                key={`${nftAddress}${tokenId}`}
                            />
                        )
                    })
                )}
            </div>
        </div>
    )
}
export default Home
