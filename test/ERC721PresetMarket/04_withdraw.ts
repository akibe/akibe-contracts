import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployContractFixture } from './00_before'

describe('Withdraw', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
    await obj.market.setTokenContract(obj.contract.target)
    await obj.contract.grantRole(obj.minterRole, obj.market.target)
    const now = await time.latest()
    await obj.market.setCurrentSale(
      1,
      1,
      2,
      now - 100,
      now + 100,
      ethers.parseEther('0.1'),
      ethers.ZeroHash
    )
  })

  it('ミント料金が正しくコントラクトに保管される', async function () {
    await obj.market.connect(obj.guest).mint(obj.guest.address, 1, 0, [], {
      value: ethers.parseEther('0.1'),
    })
    await obj.market.connect(obj.guest).mint(obj.guest.address, 2, 0, [], {
      value: ethers.parseEther('0.1'),
    })

    expect(await ethers.provider.getBalance(obj.contract.target)).to.equal(0)
    expect(await ethers.provider.getBalance(obj.market.target)).to.equal(
      ethers.parseEther('0.2')
    )
  })

  it('ゲストは預金を引き出せない', async function () {
    await expect(
      obj.market.connect(obj.guest).withdraw()
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })

  it('オーナーは預金を引き出せる', async function () {
    const before = await ethers.provider.getBalance(obj.owner.address)
    await expect(obj.market.connect(obj.owner).withdraw())
      .to.emit(obj.market, 'Withdrawn')
      .withArgs(obj.owner.address, ethers.parseEther('0.2'))
    const after = await ethers.provider.getBalance(obj.owner.address)
    const diff = after - before
    expect(diff).to.be.within(
      ethers.parseEther('0.19'),
      ethers.parseEther('0.2')
    ) // ガス代により幅あり
  })

  it('引き出すと預金が空になる', async function () {
    expect(await ethers.provider.getBalance(obj.market.target)).to.equal(0)
  })

  it('預金が空の場合は引き出せない', async function () {
    await expect(obj.market.connect(obj.owner).withdraw()).to.be.revertedWith(
      'Withdrawable: 0 Balance'
    )
  })
})
