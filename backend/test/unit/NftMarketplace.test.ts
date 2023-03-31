import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { NftMarketplace } from '../../typechain-types/contracts/NftMarketplace'
import { BasicNft } from '../../typechain-types/contracts/test/basicNft'
import { Signer } from 'ethers'
import { assert, expect } from 'chai'

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('Nft Marketplace Unit Tests', () => {
          let nftMarketplace: NftMarketplace
          let basicNft: BasicNft
          let deployer: Signer
          let user: Signer
          const TOKEN_ID = 0
          const PRICE = ethers.utils.parseEther('0.01')

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]

              await deployments.fixture(['all'])

              nftMarketplace = await ethers.getContract(
                  'NftMarketplace',
                  deployer
              )
              basicNft = await ethers.getContract('BasicNft', deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })

          describe('listItem', () => {
              it("should revert if price isn't above zero", async () => {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith('NftMarketplace__PriceMustBeAboveZero')
              })

              it('should revert if token is already listed', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const error = `NftMarketplace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`

                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })

              it("should revert if lister isn't owner of nft", async () => {
                  nftMarketplace = nftMarketplace.connect(user)
                  await basicNft.approve(await user.getAddress(), TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith('NftMarketplace__NotOwner')
              })

              it('should revert if nft is not approved for marketplace', async () => {
                  await basicNft.approve(await user.getAddress(), TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(
                      'NftMarketplace__NotApprovedForMarketplace'
                  )
              })

              it('emits event after listing item', async () => {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  )
                      .to.emit(nftMarketplace, 'ItemListed')
                      .withArgs(
                          await deployer.getAddress(),
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
              })

              it('updates the listings mapping', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  expect(listing.price).to.equal(PRICE)
                  expect(listing.seller).to.equal(await deployer.getAddress())
              })
          })

          describe('buyItem', () => {
              it('should revert if item is not listed', async () => {
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })

              it('should revert if price is too low', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )

                  const listedItem = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )

                  const error = `NftMarketplace__PriceNotMet("${basicNft.address}", ${TOKEN_ID}, ${listedItem.price})`

                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE.sub(1),
                      })
                  ).to.be.revertedWith(error)
              })

              it('updates proceeds, emits event and transfers nft to buyer', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )

                  nftMarketplace = nftMarketplace.connect(user)
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  )
                      .to.emit(nftMarketplace, 'ItemBought')
                      .withArgs(
                          await user.getAddress(),
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )

                  const newOwner = await basicNft.ownerOf(TOKEN_ID)

                  assert.equal(newOwner, await user.getAddress())

                  const finalProceeds = await nftMarketplace.getProceeds(
                      await deployer.getAddress()
                  )

                  assert.equal(finalProceeds.toString(), PRICE.toString())
              })
          })

          describe('cancelListing', () => {
              it('should revert if item is not listed', async () => {
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })

              it('should revert if caller is not seller', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )

                  nftMarketplace = nftMarketplace.connect(user)

                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith('NftMarketplace__NotOwner')
              })

              it('emits event and removes the listing', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )

                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  )
                      .to.emit(nftMarketplace, 'ItemCanceled')
                      .withArgs(
                          await deployer.getAddress(),
                          basicNft.address,
                          TOKEN_ID
                      )

                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )

                  assert.equal(listing.price.toString(), '0')
                  assert.equal(listing.seller, ethers.constants.AddressZero)
              })
          })

          describe('updateListing', () => {
              it('should revert if item is not listed', async () => {
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith(error)
              })

              it('should revert if caller is not seller', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )

                  nftMarketplace = nftMarketplace.connect(user)

                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWith('NftMarketplace__NotOwner')
              })

              it('emits event and updates the listing', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )

                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE.add(1)
                      )
                  )
                      .to.emit(nftMarketplace, 'ItemListed')
                      .withArgs(
                          await deployer.getAddress(),
                          basicNft.address,
                          TOKEN_ID,
                          PRICE.add(1)
                      )

                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )

                  assert.equal(
                      listing.price.toString(),
                      PRICE.add(1).toString()
                  )
                  assert.equal(listing.seller, await deployer.getAddress())
              })
          })

          describe('withdrawProceeds', () => {
              it('should revert if there are no proceeds', async () => {
                  await expect(
                      nftMarketplace.withdrawProceeds()
                  ).to.be.revertedWith('NftMarketplace__NoProceeds')
              })

              it('transfers proceeds to caller and updates proceeds mapping', async () => {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )

                  nftMarketplace = nftMarketplace.connect(user)

                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })

                  nftMarketplace = nftMarketplace.connect(deployer)

                  const initialDeployerBalance = await deployer.getBalance()

                  const tx = await nftMarketplace.withdrawProceeds()
                  const txReceipt = await tx.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const finalDeployerBalance = await deployer.getBalance()

                  assert.equal(
                      finalDeployerBalance.add(gasCost).toString(),
                      initialDeployerBalance.add(PRICE).toString()
                  )

                  const finalProceeds = await nftMarketplace.getProceeds(
                      await deployer.getAddress()
                  )

                  assert.equal(finalProceeds.toString(), '0')
              })
          })
      })
