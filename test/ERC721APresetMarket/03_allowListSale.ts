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
      [obj.owner.address, 5],
      [obj.guest.address, 3],
    ])

    obj.al2 = makeMarkleTree([
      [obj.owner.address, 5],
      [obj.guest.address, 3],
      [obj.addr[0].address, 2],
    ])
  })

  it('AL有りのSaleを追加できる (O2,G2/Max2)', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(1, 0, 0, ethers.parseEther('0.1'), 4, obj.al1.tree.root)
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(1, 4)
    expect((await obj.market.getCurrentSale()).id).to.equal(1)
  })

  it('残りミント数を正しく取得できる', async function () {
    const tree = obj.al1.proofs[obj.owner.address] || {
      count: 0,
      proof: [],
    }
    expect(
      await obj.market.getMintAmount(obj.owner.address, tree.count, tree.proof)
    ).to.equal(4)

    const tree2 = obj.al1.proofs[obj.guest.address] || {
      count: 0,
      proof: [],
    }
    expect(
      await obj.market.getMintAmount(
        obj.guest.address,
        tree2.count,
        tree2.proof
      )
    ).to.equal(3)
  })

  it('ALユーザーでもProofが無いとMintできない', async function () {
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 1, 1, [], { value: ethers.parseEther('0.1') })
    ).to.be.revertedWithCustomError(obj.market, 'OverMintLimit')
  })

  it('ALユーザーはProof付きでMintできる', async function () {
    const tree = obj.al1.proofs[obj.guest.address]
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 1, tree.count, tree.proof, {
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
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 1, tree.count, tree.proof, {
          value: ethers.parseEther('0.05'),
        })
    ).to.be.revertedWithCustomError(obj.market, 'InsufficientFunds')
  })

  it('ALの保有数があれば複数Mintできる', async function () {
    const tree = obj.al1.proofs[obj.guest.address]
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 2, tree.count, tree.proof, {
          value: ethers.parseEther('0.1'),
        })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.guest.address, 3)
    expect(await obj.contract.totalSupply()).to.equal(3)
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(3)
  })

  it('ALの保有数を超えたMintはできない', async function () {
    const tree = obj.al1.proofs[obj.guest.address]
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 1, tree.count, tree.proof, {
          value: ethers.parseEther('0.1'),
        })
    ).to.be.revertedWithCustomError(obj.market, 'OverMintLimit')
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(3)
  })

  it('MaxSupplyを超えたミントはできない', async function () {
    const tree = obj.al1.proofs[obj.owner.address]
    await expect(
      obj.market
        .connect(obj.owner)
        .mint(obj.owner.address, 3, tree.count, tree.proof, {
          value: ethers.parseEther('0.1'),
        })
    ).to.be.revertedWithCustomError(obj.market, 'OverMintLimit')
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
    const tree = obj.al2.proofs[obj.guest.address]
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 1, tree.count, tree.proof, {
          value: ethers.parseEther('0.1'),
        })
    ).to.be.revertedWithCustomError(obj.market, 'OverMintLimit')
  })

  it('同じALで違うIDのSaleを追加できる', async function () {
    await expect(
      obj.market
        .connect(obj.owner)
        .setCurrentSale(2, 0, 0, ethers.parseEther('0.1'), 8, obj.al2.tree.root)
    )
      .to.emit(obj.market, 'ChangeSale')
      .withArgs(2, 8)
    expect((await obj.market.getCurrentSale()).id).to.equal(2)
  })

  it('IDを変えてSaleを追加するとMint可能数がリセットされる', async function () {
    const tree = obj.al2.proofs[obj.owner.address]
    expect(
      await obj.market.getMintAmount(obj.owner.address, tree.count, tree.proof)
    ).to.equal(5)

    const tree2 = obj.al2.proofs[obj.guest.address]
    expect(
      await obj.market.getMintAmount(
        obj.guest.address,
        tree2.count,
        tree2.proof
      )
    ).to.equal(3)
  })

  it('購入限度だったユーザーはまたミント可能になる', async function () {
    const tree = obj.al2.proofs[obj.guest.address]
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 1, tree.count, tree.proof, {
          value: ethers.parseEther('0.1'),
        })
    )
      .to.emit(obj.contract, 'Transfer')
      .withArgs(ethers.ZeroAddress, obj.guest.address, 4)
  })

  it('Quantityは0だとミントできない', async function () {
    const tree = obj.al2.proofs[obj.guest.address]
    await expect(
      obj.market
        .connect(obj.guest)
        .mint(obj.guest.address, 0, tree.count, tree.proof, {
          value: ethers.parseEther('0.1'),
        })
    ).to.be.revertedWithCustomError(obj.market, 'InvalidQuantity')

    const tree2 = obj.al2.proofs[obj.owner.address]
    await expect(
      obj.market
        .connect(obj.owner)
        .mint(obj.owner.address, 0, tree2.count, tree2.proof, {
          value: ethers.parseEther('0.1'),
        })
    ).to.be.revertedWithCustomError(obj.market, 'InvalidQuantity')
  })

  it('セール数を超えたMintはできない', async function () {
    const tree = obj.al2.proofs[obj.owner.address]
    await expect(
      obj.market
        .connect(obj.owner)
        .mint(obj.owner.address, 10, tree.count, tree.proof, {
          value: ethers.parseEther('0.1'),
        })
    ).to.be.revertedWithCustomError(obj.market, 'InvalidQuantity')
  })

  it('トークン数の確認', async function () {
    expect(await obj.contract.totalSupply()).to.equal(4)
    expect(await obj.contract.balanceOf(obj.owner.address)).to.equal(0)
    expect(await obj.contract.balanceOf(obj.guest.address)).to.equal(4)
  })
})
