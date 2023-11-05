import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
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
    const now = await time.latest()
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(
          1,
          1,
          1,
          now - 200,
          now - 100,
          ethers.parseEther('0.1'),
          ethers.ZeroHash
        )
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(1)
    expect((await obj.market.getCurrentSale()).id).to.equal(1)
  })

  it('時間後でMintできない', async function () {
    await expect(
      obj.market.connect(obj.guest).mint(obj.guest.address, 1, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'SaleHasEnded')
  })

  it('未来のSaleを追加できる', async function () {
    const now = await time.latest()
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(
          2,
          2,
          2,
          now + 100,
          now + 200,
          ethers.parseEther('0.1'),
          ethers.ZeroHash
        )
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(2)
    expect((await obj.market.getCurrentSale()).id).to.equal(2)
  })

  it('時間前でMintできない', async function () {
    await expect(
      obj.market.connect(obj.guest).mint(obj.guest.address, 2, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'SaleHasNotStarted')
  })

  it('現在のSaleを追加できる', async function () {
    const now = await time.latest()
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(
          3,
          3,
          3,
          now - 100,
          now + 100,
          ethers.parseEther('0.1'),
          ethers.ZeroHash
        )
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(3)
    expect((await obj.market.getCurrentSale()).id).to.equal(3)
  })

  it('時間内はMintできる', async function () {
    await expect(
      obj.market.connect(obj.guest).mint(obj.guest.address, 3, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.guest.address, 3)
  })
})
