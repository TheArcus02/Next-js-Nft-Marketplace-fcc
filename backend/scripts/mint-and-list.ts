import { ethers } from 'hardhat'
import { NftMarketplace } from '../typechain-types/contracts/NftMarketplace'
import { BasicNft } from '../typechain-types/contracts/test/basicNft'

const PRICE = ethers.utils.parseEther('0.1')

const mintAndList = async () => {
    const nftMarketplace: NftMarketplace = await ethers.getContract(
        'NftMarketplace'
    )
    const basicNft: BasicNft = await ethers.getContract('BasicNft')
    console.log('Minting token...')
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events![0].args!.tokenId

    console.log('Approving token...')
    const approveTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approveTx.wait(1)
    console.log('Listing token...')
    const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await tx.wait(1)
    console.log('Token listed!')
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
