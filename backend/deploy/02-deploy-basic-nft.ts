import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from '../helper-hardhat-config'
import verify from '../utils/verify'

const deployBasicNft: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { network, getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    log('----------------------------------------------------')

    const args: any[] = []

    const basicNft = await deploy('BasicNft', {
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
        await verify(basicNft.address, args)
    }
    log('----------------------------------------------------')
}

export default deployBasicNft
deployBasicNft.tags = ['basicnft', 'all']
