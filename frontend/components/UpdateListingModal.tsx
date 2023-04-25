import { NextPage } from 'next'
import { Input, Modal, useNotification } from '@web3uikit/core'
import { useState } from 'react'
import { useWeb3Contract } from 'react-moralis'
import { ethers } from 'ethers'

export interface UpdateListingModalProps {
    isVisible: boolean
    onClose: () => void
    nftMarketplaceAbi: object
    nftMarketplaceAddress: string
    nftAddress: string
    tokenId: string
    imageURI: string | undefined
    currentPrice: number | undefined
}

export const UpdateListingModal: NextPage<UpdateListingModalProps> = ({
    isVisible,
    onClose,
    nftMarketplaceAbi,
    nftMarketplaceAddress,
    nftAddress,
    tokenId,
    imageURI,
    currentPrice,
}) => {
    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState<string | undefined>()

    const dispatch = useNotification()

    const handleUpdateListingSuccess = () => {
        dispatch({
            title: 'Listing updated - please refresh (and move blocks)',
            message: 'Listing updated',
            type: 'success',
            position: 'topR',
        })
        onClose()
    }

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: nftMarketplaceAddress,
        functionName: 'updateListing',
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || '0'),
        },
    })

    return (
        <Modal
            isVisible={isVisible}
            id="regular"
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={() => {
                updateListing({
                    onError: (error) => console.log(error),
                    onSuccess: () => handleUpdateListingSuccess(),
                })
            }}
            title="NFT Details"
            okText="Save New Listing Price"
            cancelText="Leave it"
            isOkDisabled={!priceToUpdateListingWith}
        >
            <Input
                label="Update listing price in L1 Currency (ETH)"
                name="New listing price"
                type="number"
                onChange={(e) => {
                    setPriceToUpdateListingWith(e.target.value)
                }}
            ></Input>
        </Modal>
    )
}
