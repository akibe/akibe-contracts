import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployContractFixture } from './00_before'

describe('Public Sale', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
    // await obj.market.setTokenContract(obj.contract.target)
  })

  it('Tokenが未登録だとエラーになる', async function () {
    expect(await obj.market.tokenContract()).to.equal(ethers.ZeroAddress)
    await expect(obj.market.checkMint(obj.owner.address, 1, 0, [])).to.be
      .reverted
  })

  it('ゲストはTokenを登録できない', async function () {
    await expect(
      obj.market.connect(obj.guest).setTokenContract(obj.contract.target)
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
  })

  it('オーナーはTokenを登録できる', async function () {
    await expect(
      obj.market.connect(obj.owner).setTokenContract(obj.contract.target)
    ).to.be.not.reverted
    expect(await obj.market.tokenContract()).to.equal(obj.contract.target)
  })

  it('Saleが無いとMintできない', async function () {
    expect((await obj.market.getCurrentSale()).id).to.equal(0)
    await expect(
      obj.market.connect(obj.guest).mint(obj.guest.address, 1, 0, [])
    ).to.be.revertedWithCustomError(obj.market, 'NotForSale')
  })

  it('ゲストはSaleを追加できない', async function () {
    expect((await obj.market.getCurrentSale()).id).to.equal(0)
    await expect(
      obj.market
        .connect(obj.guest)
        .setCurrentSale(
          1,
          1,
          2,
          0,
          0,
          ethers.parseEther('0.1'),
          ethers.ZeroHash
        )
    ).to.be.revertedWithCustomError(obj.contract, 'OwnableUnauthorizedAccount')
    expect((await obj.market.getCurrentSale()).id).to.equal(0)
  })

  it('オーナーはSaleを追加できる', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(
          2,
          1,
          2,
          0,
          0,
          ethers.parseEther('0.1'),
          ethers.ZeroHash
        )
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(2)
    expect((await obj.market.getCurrentSale()).id).to.equal(2)
  })

  it('Minterが未登録だとmintできない', async function () {
    expect(await obj.contract.hasRole(obj.minterRole, obj.market.target)).to.be
      .false
    await expect(
      obj.market.connect(obj.guest).mint(obj.guest.address, 1, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(
      obj.contract,
      'AccessControlUnauthorizedAccount'
    )
  })

  it('ゲストはMinterを登録できない', async function () {
    await expect(
      obj.contract
        .connect(obj.guest)
        .grantRole(obj.minterRole, obj.market.target)
    ).to.be.revertedWithCustomError(
      obj.contract,
      'AccessControlUnauthorizedAccount'
    )
  })

  it('オーナーはMinterを登録できる', async function () {
    await expect(
      obj.contract
        .connect(obj.owner)
        .grantRole(obj.minterRole, obj.market.target)
    )
      .to.emit(obj.contract, 'RoleGranted')
      .withArgs(obj.minterRole, obj.market.target, obj.owner.address)
    expect(await obj.contract.hasRole(obj.minterRole, obj.market.target)).to.be
      .true
  })

  it('AL無しでMintできる', async function () {
    await expect(
      obj.market.connect(obj.guest).mint(obj.guest.address, 1, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.guest.address, 1)
    expect(await obj.contract.totalSupply()).to.equal(1)
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(1)
  })

  it('送金が足りないとMintできない', async function () {
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 1, 0, [], { value: ethers.parseEther('0.05') })
    ).to.be.revertedWithCustomError(obj.market, 'InsufficientFunds')
  })

  it('ALがあってもエラーにならない', async function () {
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 1, 1, [ethers.ZeroHash], {
          value: ethers.parseEther('0.1'),
        })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.guest.address, 2)
    expect(await obj.contract.totalSupply()).to.equal(2)
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(2)
  })

  it('セール数を超えたTokenはMintできない', async function () {
    await expect(
      obj.market.connect(obj.guest).mint(obj.guest.address, 1, 0, [], {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'OverMintLimit')
    expect(await obj.contract.totalSupply()).to.equal(2)
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(2)
  })
})
