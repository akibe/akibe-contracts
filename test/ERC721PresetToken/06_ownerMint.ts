import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployContractFixture } from './00_before'

describe('Owner Mint', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
  })

  it('初期Minterはオーナーである', async function () {
    expect(await obj.contract.hasRole(obj.minterRole, obj.owner.address)).to.be
      .true
  })

  it('MinterはMintできる', async function () {
    await expect(obj.contract.connect(obj.owner).mint(obj.addr[0].address, 1))
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.addr[0].address, 1)
  })
  it('MintするとTotalSupplyが増加する', async function () {
    expect(await obj.contract.totalSupply()).to.equal(1)
  })
  it('Mintすると送信先のBalanceが増加する', async function () {
    expect(await obj.contract.balanceOf(obj.addr[0].address)).to.equal(1)
  })
  it('送信先の保有Tokenを取得できる', async function () {
    expect(await obj.contract.tokensOfOwner(obj.addr[0].address)).to.deep.equal(
      [1]
    )
  })

  it('Minter以外はMintできない', async function () {
    await expect(
      obj.contract.connect(obj.guest).mint(obj.addr[1].address, 2)
    ).to.be.revertedWithCustomError(
      obj.contract,
      'AccessControlUnauthorizedAccount'
    )
    expect(await obj.contract.totalSupply()).to.equal(1)
    expect(await obj.contract.balanceOf(obj.addr[1].address)).to.equal(0)
  })

  it('同じTokenIDはMintできない', async function () {
    await expect(
      obj.contract.connect(obj.owner).mint(obj.addr[0].address, 1)
    ).to.be.revertedWithCustomError(obj.contract, 'ERC721InvalidSender')
  })
})
