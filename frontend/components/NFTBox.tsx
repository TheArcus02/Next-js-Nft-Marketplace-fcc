import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useMoralis, useWeb3Contract } from 'react-moralis'
import Image from 'next/image'
import nftAbi from '../constants/BasicNft.json'
import nftMarketplaceAbi from '../constants/NFTMarketplace.json'
import { Card, Illustration, Tooltip, useNotification } from '@web3uikit/core'
import { UpdateListingModal } from './UpdateListingModal'
import { ethers } from 'ethers'
import { SellNFTModal } from './SellNFTModal'
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
    const [showModal, setShowModal] = useState<boolean>(false)

    const { chainId, isWeb3Enabled, account } = useMoralis()
    const dispatch = useNotification()

    const isListed = seller !== undefined

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

    async function updateUI() {
        console.log(`TokenURI is: ${tokenURI}`)
        // We are cheating a bit here...
        if (tokenURI) {
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
        updateUI()
    }, [tokenURI])

    useEffect(() => {
        if (isWeb3Enabled) {
            getTokenURI()
        }
    }, [isWeb3Enabled])

    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser
        ? 'You'
        : seller?.slice(0, 6) + '...' + seller?.slice(-4)

    const tooltipContent = isListed
        ? isOwnedByUser
            ? 'Update listing'
            : 'Buy me'
        : 'Create listing'

    return (
        <div className="p-2">
            <SellNFTModal
                isVisible={showModal && !isListed}
                imageURI={imageURI}
                nftAbi={nftAbi}
                nftMarketplaceAbi={nftMarketplaceAbi}
                nftAddress={nftAddress}
                tokenId={tokenId}
                onClose={() => setShowModal(false)}
                nftMarketplaceAddress={nftMarketplaceAddress}
            />
            <UpdateListingModal
                isVisible={showModal && isListed}
                imageURI={imageURI}
                nftMarketplaceAbi={nftMarketplaceAbi}
                nftAddress={nftAddress}
                tokenId={tokenId}
                onClose={() => setShowModal(false)}
                nftMarketplaceAddress={nftMarketplaceAddress}
                currentPrice={price}
            />
            <Card title={tokenName} description={tokenDescription} onClick={handleCardClick}>
                <Tooltip content={tooltipContent} position="top">
                    <div className="p-2">
                        {imageURI ? (
                            <div className="flex flex-col items-end gap-2">
                                <div>#{tokenId}</div>
                                <div className="italic text-sm">
                                    Owned by {formattedSellerAddress}
                                </div>
                                <Image
                                    loader={() => imageURI}
                                    src={imageURI}
                                    height="200"
                                    width="200"
                                    alt="NFT Image"
                                />
                                {price && (
                                    <div className="font-bold">
                                        {ethers.utils.formatEther(price)} ETH
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <Illustration height="180px" logo="lazyNft" width="100%" />
                                Loading...
                            </div>
                        )}
                    </div>
                </Tooltip>
            </Card>
        </div>
    )
}

export default NFTBox
