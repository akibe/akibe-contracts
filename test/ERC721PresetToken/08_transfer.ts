import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContractFixture } from './00_before'

describe('Transfer', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
  })

  it('所有トークンを別ウォレットにTransferできる', async function () {
    await obj.contract.connect(obj.owner).mint(obj.addr[0].address, 1)
    expect(await obj.contract.balanceOf(obj.addr[0].address)).to.equal(1)
    expect(await obj.contract.balanceOf(obj.addr[1].address)).to.equal(0)

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

  it('未所有トークンはトランスファーできない', async function () {
    const tx = obj.contract
      .connect(obj.addr[0])
      ['safeTransferFrom(address,address,uint256)'](
        obj.addr[0].address,
        obj.addr[2].address,
        1
      )
    await expect(tx).to.be.revertedWithCustomError(
      obj.contract,
      'ERC721InsufficientApproval'
    )
    expect(await obj.contract.ownerOf(1)).to.equal(obj.addr[1].address)
  })

  it('他人のトークンはトランスファーできない', async function () {
    const tx = obj.contract
      .connect(obj.addr[0])
      ['safeTransferFrom(address,address,uint256)'](
        obj.addr[1].address,
        obj.addr[2].address,
        1
      )
    await expect(tx).to.be.revertedWithCustomError(
      obj.contract,
      'ERC721InsufficientApproval'
    )
    expect(await obj.contract.ownerOf(1)).to.equal(obj.addr[1].address)
  })

  it('存在しないトークンはトランスファーできない', async function () {
    const tx = obj.contract
      .connect(obj.addr[1])
      ['safeTransferFrom(address,address,uint256)'](
        obj.addr[1].address,
        obj.addr[2].address,
        2
      )
    await expect(tx).to.be.revertedWithCustomError(
      obj.contract,
      'ERC721NonexistentToken'
    )
  })

  it('存在しないトークンは許可できない', async function () {
    const tx = obj.contract.connect(obj.addr[1]).approve(obj.addr[0].address, 2)
    await expect(tx).to.be.revertedWithCustomError(
      obj.contract,
      'ERC721NonexistentToken'
    )
  })

  it('許可された場合は未所有トークンのトランスファーが可能', async function () {
    await expect(
      obj.contract.connect(obj.addr[1]).approve(obj.addr[0].address, 1)
    )
      .to.emit(obj.contract, 'Approval')
      .withArgs(obj.addr[1].address, obj.addr[0].address, 1)
    const tx = obj.contract
      .connect(obj.addr[0])
      ['safeTransferFrom(address,address,uint256)'](
        obj.addr[1].address,
        obj.addr[2].address,
        1
      )
    await expect(tx)
      .to.emit(obj.contract, 'Transfer')
      .withArgs(obj.addr[1].address, obj.addr[2].address, 1)
    expect(await obj.contract.balanceOf(obj.addr[1].address)).to.equal(0)
    expect(await obj.contract.balanceOf(obj.addr[2].address)).to.equal(1)
    expect(await obj.contract.ownerOf(1)).to.equal(obj.addr[2].address)

    expect(
      (await obj.contract.tokensOfOwner(obj.addr[1].address)).toString()
    ).to.equal('')
    expect(
      (await obj.contract.tokensOfOwner(obj.addr[2].address)).toString()
    ).to.equal('1')
  })
})
