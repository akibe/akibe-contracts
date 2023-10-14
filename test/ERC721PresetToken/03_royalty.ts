import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContractFixture } from './00_before'

describe('Royalties', async function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
  })

  it('ロイヤリティを取得できる', async function () {
    const [receiver, royaltyAmount] = await obj.contract.royaltyInfo(0, 10000)
    expect(royaltyAmount.toString()).to.equal('1000')
    expect(receiver).to.equal(obj.owner.address)
  })
  it('オーナーはロイヤリティを設定できる', async function () {
    await expect(
      obj.contract.connect(obj.owner).setDefaultRoyalty(obj.owner.address, 2000)
    ).to.be.not.reverted
    const [receiver, royaltyAmount] = await obj.contract.royaltyInfo(0, 10000)
    expect(royaltyAmount.toString()).to.equal('2000')
    expect(receiver).to.equal(obj.owner.address)
  })
  it('オーナー以外はロイヤリティを設定できない', async function () {
    await expect(
      obj.contract.connect(obj.guest).setDefaultRoyalty(obj.owner.address, 1000)
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })
})
