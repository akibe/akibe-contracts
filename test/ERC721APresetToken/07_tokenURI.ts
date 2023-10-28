import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployContractFixture } from './00_before'

const baseURI = 'https://mydomain.you/metadata/'
const baseURI2 = 'https://mydomain.you/metadata2/'

describe('TokenURI', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
    await obj.contract.connect(obj.owner).mint(obj.guest.address, 1)
    await obj.contract.connect(obj.owner).mint(obj.guest.address, 1)
  })

  it('BaseURIが空の場合はTokenURIは空になる', async function () {
    expect(await obj.contract.tokenURI(1)).to.equal('')
    expect(await obj.contract.tokenURI(2)).to.equal('')
  })

  it('オーナーはBaseURIを変更できる', async function () {
    await expect(obj.contract.connect(obj.owner).setBaseURI(baseURI)).to.not
      .reverted
  })
  it('ゲストはBaseURIを変更できない', async function () {
    await expect(
      obj.contract.connect(obj.guest).setBaseURI(baseURI2)
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })

  it('正しいTokenURIを取得できる', async function () {
    expect(await obj.contract.tokenURI(1)).to.equal(baseURI + '1')
    expect(await obj.contract.tokenURI(2)).to.equal(baseURI + '2')
  })

  it('未発行のTokenURIは取得できない', async function () {
    await expect(obj.contract.tokenURI(3)).to.be.revertedWithCustomError(
      obj.contract,
      'URIQueryForNonexistentToken'
    )
  })

  it('所有トークンを取得できる', async function () {
    const mint1 = obj.contract.connect(obj.owner).mint(obj.addr[1].address, 1)
    await expect(mint1)
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.addr[1].address, 3)

    const mint2 = obj.contract.connect(obj.owner).mint(obj.addr[1].address, 1)
    await expect(mint2)
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.addr[1].address, 4)

    expect(
      (await obj.contract.tokensOfOwner(obj.addr[1].address)).toString()
    ).to.equal('3,4')
  })
  it('無効なアドレス指定はエラーになる', async function () {
    await expect(
      obj.contract.tokensOfOwner(ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(obj.contract, 'BalanceQueryForZeroAddress')
  })

  it('オーナーはBaseURIを空にできる', async function () {
    await expect(obj.contract.connect(obj.owner).setBaseURI('')).to.not.reverted
    expect(await obj.contract.tokenURI(1)).to.equal('')
    expect(await obj.contract.tokenURI(2)).to.equal('')
  })
})
