import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContractFixture } from './00_before'

describe('Deploy', function () {
  let obj: any
  before(async function () {
    obj = await loadFixture(deployContractFixture)
  })

  it('Tokenコントラクトのオーナーが正しい', async function () {
    expect(await obj.contract.owner()).to.equal(obj.owner.address)
  })
  it('Tokenコントラクトの名前が正しい', async function () {
    expect(await obj.contract.name()).to.equal(obj.tokenName)
  })
  it('Tokenコントラクトのシンボルが正しい', async function () {
    expect(await obj.contract.symbol()).to.equal(obj.tokenSymbol)
  })
  it('ミント数が0である', async function () {
    expect(await obj.contract.totalSupply()).to.equal(0)
  })

  it('Marketコントラクトのオーナーが正しい', async function () {
    expect(await obj.contract.owner()).to.equal(obj.owner.address)
  })
})
