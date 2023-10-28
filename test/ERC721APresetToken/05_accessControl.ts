import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContractFixture } from './00_before'

describe('AccessControl', async function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
  })

  it('初期のロールはオーナーである', async function () {
    expect(await obj.contract.hasRole(obj.adminRole, obj.owner.address)).to.be
      .true
    expect(await obj.contract.hasRole(obj.minterRole, obj.owner.address)).to.be
      .true
  })

  it('ゲストはロールを変更できない', async function () {
    await expect(
      obj.contract
        .connect(obj.guest)
        .grantRole(obj.minterRole, obj.guest.address)
    ).to.be.revertedWithCustomError(
      obj.contract,
      'AccessControlUnauthorizedAccount'
    )
  })

  it('オーナーはロールメンバーを追加できる', async function () {
    await expect(
      obj.contract
        .connect(obj.owner)
        .grantRole(obj.minterRole, obj.guest.address)
    )
      .to.emit(obj.contract, 'RoleGranted')
      .withArgs(obj.minterRole, obj.guest.address, obj.owner.address)
    expect(await obj.contract.hasRole(obj.minterRole, obj.guest.address)).to.be
      .true
  })
  it('新メンバーはhasRoleの関数を実行できる', async function () {
    await expect(obj.contract.connect(obj.guest).mint(obj.guest.address, '1'))
      .to.be.not.reverted
  })
  it('旧メンバーもhasRoleの関数を実行できる', async function () {
    await expect(obj.contract.connect(obj.owner).mint(obj.guest.address, '2'))
      .to.be.not.reverted
  })
  it('非メンバーはhasRoleの関数を実行できない', async function () {
    await expect(obj.contract.connect(obj.addr[0]).mint(obj.guest.address, '3'))
      .to.be.reverted
  })

  it('オーナーはADMINを追加できる', async function () {
    await expect(
      obj.contract
        .connect(obj.owner)
        .grantRole(obj.adminRole, obj.guest.address)
    )
      .to.emit(obj.contract, 'RoleGranted')
      .withArgs(obj.adminRole, obj.guest.address, obj.owner.address)
    expect(await obj.contract.hasRole(obj.adminRole, obj.guest.address)).to.be
      .true
  })
  it('新ADMINはロールメンバーを追加できる', async function () {
    await expect(
      obj.contract
        .connect(obj.guest)
        .grantRole(obj.minterRole, obj.addr[0].address)
    )
      .to.emit(obj.contract, 'RoleGranted')
      .withArgs(obj.minterRole, obj.addr[0].address, obj.guest.address)
    expect(await obj.contract.hasRole(obj.minterRole, obj.addr[0].address)).to
      .be.true
    await expect(obj.contract.connect(obj.addr[0]).mint(obj.guest.address, 3))
      .to.be.not.reverted
  })
  it('ADMINはロールメンバーを削除できる', async function () {
    await expect(
      obj.contract
        .connect(obj.guest)
        .revokeRole(obj.minterRole, obj.addr[0].address)
    )
      .to.emit(obj.contract, 'RoleRevoked')
      .withArgs(obj.minterRole, obj.addr[0].address, obj.guest.address)
    expect(await obj.contract.hasRole(obj.minterRole, obj.addr[0].address)).to
      .be.false
    await expect(obj.contract.connect(obj.addr[0]).mint(obj.guest.address, 4))
      .to.be.reverted
  })
})
