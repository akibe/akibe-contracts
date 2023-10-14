import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContractFixture } from './00_before'

describe('Ownable', async function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
  })

  it('初期のOwnerはオーナーである', async function () {
    expect(await obj.contract.owner()).to.be.equal(obj.owner.address)
  })
  it('ゲストはOwnerを変更できない', async function () {
    await expect(
      obj.contract.connect(obj.guest).transferOwnership(obj.guest.address)
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })
  it('オーナーはOwnerを変更できる', async function () {
    await expect(
      obj.contract.connect(obj.owner).transferOwnership(obj.guest.address)
    )
      .to.emit(obj.contract, 'OwnershipTransferred')
      .withArgs(obj.owner.address, obj.guest.address)
    expect(await obj.contract.owner()).to.be.equal(obj.guest.address)
  })
  it('新オーナーはonlyOwnerの関数を実行できる', async function () {
    await expect(
      obj.contract.connect(obj.guest).setDefaultRoyalty(obj.guest.address, 2000)
    ).to.be.not.reverted
  })
  it('旧オーナーはonlyOwnerの関数を実行できない', async function () {
    await expect(
      obj.contract.connect(obj.owner).setDefaultRoyalty(obj.owner.address, 2000)
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })
  it('旧オーナーはOwnerを変更できない', async function () {
    await expect(
      obj.contract.connect(obj.owner).transferOwnership(obj.owner.address)
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })
  it('新オーナーはOwnerを変更できる', async function () {
    await expect(
      obj.contract.connect(obj.guest).transferOwnership(obj.owner.address)
    )
      .to.emit(obj.contract, 'OwnershipTransferred')
      .withArgs(obj.guest.address, obj.owner.address)
    expect(await obj.contract.owner()).to.be.equal(obj.owner.address)
  })
})
