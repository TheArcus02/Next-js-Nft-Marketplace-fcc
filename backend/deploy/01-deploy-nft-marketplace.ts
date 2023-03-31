import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from '../helper-hardhat-config'
import verify from '../utils/verify'

const deployNFTMarketplace: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deployments, getNamedAccounts, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    log('----------------------------------------------------')

    const args: any[] = []

    const nftMarketplace = await deploy('NftMarketplace', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log('Verifying...')
        await verify(nftMarketplace.address, args)
    }

    log('----------------------------------------------------')
}

export default deployNFTMarketplace
deployNFTMarketplace.tags = ['nftmarketplace', 'all']
