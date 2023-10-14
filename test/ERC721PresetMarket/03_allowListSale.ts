import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployContractFixture, makeMarkleTree } from './00_before'

describe('AllowList Sale', function () {
  let obj: any

  before(async function () {
    obj = await loadFixture(deployContractFixture)
    await obj.market.setTokenContract(obj.contract.target)
    await obj.contract.grantRole(obj.minterRole, obj.market.target)

    obj.al1 = makeMarkleTree([
      [obj.owner.address, 2],
      [obj.guest.address, 2],
    ])

    obj.al2 = makeMarkleTree([
      [obj.owner.address, 2],
      [obj.guest.address, 2],
      [obj.addr[0].address, 2],
    ])
  })

  it('AL有りのSaleを追加できる (O2,G2/Max2)', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(1, 0, 0, ethers.parseEther('0.1'), 3, obj.al1.tree.root)
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(1, 3)
    expect((await obj.market.getCurrentSale()).id).to.equal(1)
  })

  it('ALユーザーでもProofが無いとMintできない', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .mint(1, 1, [], { value: ethers.parseEther('0.1') })
    ).to.be.revertedWithCustomError(obj.market, 'NotAllowlisted')
  })

  it('ALユーザーはProof付きでMintできる', async function () {
    const tree = obj.al1.proofs[obj.guest.address]
    await expect(
      obj.market.connect(obj.guest).mint(1, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.guest.address, 1)
    expect(await obj.contract.totalSupply()).to.equal(1)
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(1)
  })

  it('AL情報が揃っていても送金が足りないとMintできない', async function () {
    const tree = obj.al1.proofs[obj.guest.address]
    await expect(
      obj.market.connect(obj.guest).mint(2, tree.count, tree.proof, {
        value: ethers.parseEther('0.05'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'InsufficientFunds')
  })

  it('ALの保有数があれば複数Mintできる', async function () {
    const tree = obj.al1.proofs[obj.guest.address]
    await expect(
      obj.market.connect(obj.guest).mint(2, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.guest.address, 2)
    expect(await obj.contract.totalSupply()).to.equal(2)
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(2)
  })

  it('ALの保有数を超えたMintはできない', async function () {
    const tree = obj.al1.proofs[obj.guest.address]
    await expect(
      obj.market.connect(obj.guest).mint(3, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'OverMintLimit')
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(2)
  })

  it('MaxSupplyを超えたTokenIdはミントできない', async function () {
    const tree = obj.al1.proofs[obj.owner.address]
    await expect(
      obj.market.connect(obj.owner).mint(3, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.owner.address, 3)

    await expect(
      obj.market.connect(obj.owner).mint(4, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'InvalidTokenId')
  })

  it('ALを変えて同じIDのSaleを追加できる', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(1, 0, 0, ethers.parseEther('0.1'), 6, obj.al2.tree.root)
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(1, 6)
    expect((await obj.market.getCurrentSale()).id).to.equal(1)
  })

  it('同じIDのSaleはMint可能数が引き継がれる', async function () {
    const tree = obj.al2.proofs[obj.owner.address]
    await expect(
      obj.market.connect(obj.owner).mint(4, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.owner.address, 4)

    await expect(
      obj.market.connect(obj.owner).mint(5, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'OverMintLimit')
  })

  it('同じALで違うIDのSaleを追加できる', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(2, 0, 0, ethers.parseEther('0.1'), 6, obj.al2.tree.root)
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(2, 6)
    expect((await obj.market.getCurrentSale()).id).to.equal(2)
  })

  it('IDを変えてSaleを追加するとMint可能数がリセットされる', async function () {
    const tree = obj.al2.proofs[obj.owner.address]
    await expect(
      obj.market.connect(obj.owner).mint(5, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.owner.address, 5)
  })

  it('tokenIdは0だとミントできない', async function () {
    const tree = obj.al2.proofs[obj.guest.address]
    await expect(
      obj.market.connect(obj.guest).mint(0, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'InvalidTokenId')
  })
  it('オーナーであってもtokenIdが0だとミントできない', async function () {
    const tree = obj.al2.proofs[obj.guest.address]
    await expect(
      obj.market.connect(obj.owner).mint(0, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'InvalidTokenId')
  })
  it('セール数を超えたMintはできない', async function () {
    const tree = obj.al2.proofs[obj.owner.address]
    await expect(
      obj.market.connect(obj.owner).mint(6, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.owner.address, 6)
    expect(await obj.contract.totalSupply()).to.equal(6)
    expect(await obj.contract.balanceOf(obj.owner.address)).to.equal(4)

    await expect(
      obj.market.connect(obj.owner).mint(7, tree.count, tree.proof, {
        value: ethers.parseEther('0.1'),
      })
    ).to.be.revertedWithCustomError(obj.market, 'InvalidTokenId')
    expect(await obj.contract.totalSupply()).to.equal(6)
    expect(await obj.contract.balanceOf(obj.owner.address)).to.equal(4)
  })
})
