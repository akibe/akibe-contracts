import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployContractFixture } from './00_before'

describe('Burnable', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
  })

  it('所有トークンを焼却できる', async function () {
    await expect(obj.contract.connect(obj.owner).mint(obj.addr[0].address, 1))
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.addr[0].address, 1)
    expect(await obj.contract.totalSupply()).to.equal(1)

    expect(await obj.contract.balanceOf(obj.addr[0].address)).to.equal(1)
    await expect(obj.contract.connect(obj.addr[0]).burn(1))
      .to.emit(obj.contract, 'Transfer')
      .withArgs(obj.addr[0].address, ethers.ZeroAddress, 1)
    expect(await obj.contract.balanceOf(obj.addr[0].address)).to.equal(0)
    expect(await obj.contract.totalSupply()).to.equal(0)
  })

  it('未所有トークンは焼却できない', async function () {
    await expect(obj.contract.connect(obj.owner).mint(obj.addr[0].address, 2))
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.addr[0].address, 2)
    expect(await obj.contract.totalSupply()).to.equal(1)

    expect(await obj.contract.balanceOf(obj.addr[0].address)).to.equal(1)
    await expect(
      obj.contract.connect(obj.addr[1]).burn(2)
    ).to.be.revertedWithCustomError(obj.contract, 'ERC721InsufficientApproval')
    await expect(
      obj.contract.connect(obj.owner).burn(2)
    ).to.be.revertedWithCustomError(obj.contract, 'ERC721InsufficientApproval')
    expect(await obj.contract.balanceOf(obj.addr[0].address)).to.equal(1)
  })

  it('焼却トークンは参照できない', async function () {
    await expect(obj.contract.tokenURI(1)).to.be.revertedWithCustomError(
      obj.contract,
      'ERC721NonexistentToken'
    )
    expect(await obj.contract.tokenURI(2)).to.equal('')
  })

  it('焼却したトークンは保有リストから消える', async function () {
    await obj.contract.connect(obj.owner).mint(obj.addr[0].address, 3)
    await obj.contract.connect(obj.owner).mint(obj.addr[0].address, 4)

    expect(await obj.contract.totalSupply()).to.equal(3)
    expect(
      (await obj.contract.tokensOfOwner(obj.addr[0].address)).toString()
    ).to.equal('2,3,4')
    await expect(obj.contract.connect(obj.addr[0]).burn(3))
      .to.emit(obj.contract, 'Transfer')
      .withArgs(obj.addr[0].address, ethers.ZeroAddress, 3)
    // expect(
    //   (await obj.contract.tokensOfOwner(obj.addr[0].address)).toString(),
    // ).to.equal('2,4')
  })
})
