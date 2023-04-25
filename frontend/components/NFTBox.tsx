import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useMoralis, useWeb3Contract } from 'react-moralis'
import Image from 'next/image'
import nftAbi from '../constants/BasicNft.json'
import nftMarketplaceAbi from '../constants/NFTMarketplace.json'
import { Card, useNotification } from '@web3uikit/core'
import ethers from 'ethers'
import { UpdateListingModal } from './UpdateListingModal'

interface NFTBoxProps {
    price?: number
    nftAddress: string
    tokenId: string
    nftMarketplaceAddress: string
    seller?: string
}

const NFTBox: NextPage<NFTBoxProps> = ({
    price,
    nftAddress,
    tokenId,
    nftMarketplaceAddress,
    seller,
}) => {
    const [imageURI, setImageURI] = useState<string | undefined>()
    const [tokenName, setTokenName] = useState<string | undefined>()
    const [tokenDescription, setTokenDescription] = useState<string | undefined>()
    const [showModal, setShowModal] = useState<Boolean>(false)

    const { chainId, isWeb3Enabled, account } = useMoralis()
    const dispatch = useNotification()

    // Getting function from basicNFT contract
    const { runContractFunction: getTokenURI, data: tokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: 'tokenURI',
        params: {
            tokenId: tokenId,
        },
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: nftMarketplaceAddress,
        functionName: 'buyItem',
        msgValue: price,
        params: {
            nftAddress,
            tokenId,
        },
    })

    const handleCardClick = () => {
        isOwnedByUser
            ? setShowModal(true)
            : buyItem({
                  onError: (error) => console.log(error),
                  onSuccess: () => handleBuyItemSuccess(),
              })
    }

    const handleBuyItemSuccess = () => {
        dispatch({
            title: 'Item purchased',
            message: 'Item purchased',
            type: 'success',
            position: 'topR',
        })
    }

    const updateUI = async () => {
        console.log(`tokenURI: ${tokenURI}`)

        if (tokenURI) {
            // IPFS Gateway: server that will return IPFS files from a "normal"URL.
            const requestURL = (tokenURI as string).replace('ipfs://', 'https://ipfs.io/ipfs/')
            const tokenURIResponse = await (await fetch(requestURL)).json()
            const imageURI = tokenURIResponse.image
            const imageURIURL = (imageURI as string).replace('ipfs://', 'https://ipfs.io/ipfs/')
            setImageURI(imageURIURL)
            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURIResponse.description)
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            getTokenURI()
        }
    }, [isWeb3Enabled])

    useEffect(() => {
        updateUI()
    }, [tokenURI])

    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser
        ? 'You'
        : seller?.slice(0, 6) + '...' + seller?.slice(-4)

    return (
        <div>
            {imageURI ? (
                <div>
                    <UpdateListingModal
                        isVisible={true}
                        tokenId={tokenId}
                        nftMarketplaceAddress={nftMarketplaceAddress}
                        nftMarketplaceAbi={nftMarketplaceAbi}
                        nftAddress={nftAddress}
                        imageURI={imageURI}
                        currentPrice={price}
                        onClose={() => setShowModal(false)}
                    />
                    <Card
                        title={tokenName}
                        description={tokenDescription}
                        onClick={handleCardClick}
                    >
                        <div className="p-2">
                            <div className="flex flex-col items-end gap-2">
                                <div>#{tokenId}</div>
                                <div className="italic text-sm">Owned by {seller}</div>
                                <Image
                                    loader={() => imageURI}
                                    src={imageURI}
                                    width={200}
                                    height={200}
                                    alt=""
                                />
                                <div className="font-bold">
                                    {ethers.utils.formatUnits(price!, 'ether')}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div>Loading...</div>
            )}
        </div>
    )
}

export default NFTBox
