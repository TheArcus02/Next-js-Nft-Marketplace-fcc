import { NextPage } from 'next'
import { useState } from 'react'
import { useWeb3Contract } from 'react-moralis'
import nftAbi from '../constants/BasicNft.json'

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
    const [imageURI, setImageURI] = useState('')

    const { runContractFunction: getTokenURI } = useWeb3Contract({ abi: nftAbi })

    const udpateUI = async () => {}

    return <div>NFTBox</div>
}

export default NFTBox
