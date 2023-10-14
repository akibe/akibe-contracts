import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployContractFixture } from './00_before'

describe('Pausable', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
  })

  it('ポーズ前はMintできる', async function () {
    await expect(obj.contract.connect(obj.owner).mint(obj.addr[0].address, 1))
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.addr[0].address, 1)
    expect(await obj.contract.balanceOf(obj.addr[0].address)).to.equal(1)
    expect(await obj.contract.ownerOf(1)).to.equal(obj.addr[0].address)
  })

  it('ゲストはポーズできない', async function () {
    await expect(
      obj.contract.connect(obj.guest).pause()
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })

  it('オーナーはポーズできる', async function () {
    expect(await obj.contract.paused()).to.equal(false)
    await expect(obj.contract.connect(obj.owner).pause())
      .to.emit(obj.contract, 'Paused')
      .withArgs(obj.owner.address)
    expect(await obj.contract.paused()).to.equal(true)
  })

  it('ポーズするとトランスファーできない', async function () {
    const tx = obj.contract
      .connect(obj.addr[0])
      ['safeTransferFrom(address,address,uint256)'](
        obj.addr[0].address,
        obj.addr[1].address,
        1
      )
    await expect(tx).to.be.revertedWithCustomError(
      obj.contract,
      'EnforcedPause'
    )
  })

  it('ゲストはアンポーズできない', async function () {
    await expect(
      obj.contract.connect(obj.guest).unpause()
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })

  it('オーナーはアンポーズできる', async function () {
    expect(await obj.contract.paused()).to.equal(true)
    await expect(obj.contract.connect(obj.owner).unpause())
      .to.emit(obj.contract, 'Unpaused')
      .withArgs(obj.owner.address)
    expect(await obj.contract.paused()).to.equal(false)
  })

  it('アンポーズするとトランスファーできる', async function () {
    const tx = obj.contract
      .connect(obj.addr[0])
      ['safeTransferFrom(address,address,uint256)'](
        obj.addr[0].address,
        obj.addr[1].address,
        1
      )
    await expect(tx)
      .to.emit(obj.contract, 'Transfer')
      .withArgs(obj.addr[0].address, obj.addr[1].address, 1)
    expect(await obj.contract.balanceOf(obj.addr[0].address)).to.equal(0)
    expect(await obj.contract.balanceOf(obj.addr[1].address)).to.equal(1)
    expect(await obj.contract.ownerOf(1)).to.equal(obj.addr[1].address)

    expect(
      (await obj.contract.tokensOfOwner(obj.addr[0].address)).toString()
    ).to.equal('')
    expect(
      (await obj.contract.tokensOfOwner(obj.addr[1].address)).toString()
    ).to.equal('1')
  })
})
