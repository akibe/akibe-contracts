import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployContractFixture } from './00_before'

describe('Time Sale', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
    await obj.market.setTokenContract(obj.contract.target)
    await obj.contract.grantRole(obj.minterRole, obj.market.target)
  })

  it('過去のSaleを追加できる', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(
          1,
          Math.floor(Date.now() / 1000) - 20,
          Math.floor(Date.now() / 1000) - 10,
          ethers.parseEther('0.1'),
          1,
          ethers.ZeroHash
        )
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(1, 1)
    expect((await obj.market.getCurrentSale()).id).to.equal(1)
  })

  it('時間後でMintできない', async function () {
    await expect(
      obj.market.connect(obj.guest).mint(1, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'SaleHasEnded')
  })

  it('未来のSaleを追加できる', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(
          2,
          Math.floor(Date.now() / 1000) + 10,
          Math.floor(Date.now() / 1000) + 20,
          ethers.parseEther('0.1'),
          2,
          ethers.ZeroHash
        )
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(2, 2)
    expect((await obj.market.getCurrentSale()).id).to.equal(2)
  })

  it('時間前でMintできない', async function () {
    await expect(
      obj.market.connect(obj.guest).mint(2, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'SaleHasNotStarted')
  })

  it('現在のSaleを追加できる', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(
          3,
          Math.floor(Date.now() / 1000) - 10,
          Math.floor(Date.now() / 1000) + 10,
          ethers.parseEther('0.1'),
          3,
          ethers.ZeroHash
        )
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(3, 3)
    expect((await obj.market.getCurrentSale()).id).to.equal(3)
  })

  it('時間内はMintできる', async function () {
    await expect(
      obj.market.connect(obj.guest).mint(3, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.guest.address, 3)
  })
})