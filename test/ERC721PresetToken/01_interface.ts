import '@nomicfoundation/hardhat-chai-matchers'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deployContractFixture } from './00_before'

describe('Interface', () => {
  let obj: any
  before(async () => {
    obj = await loadFixture(deployContractFixture)
  })

  it('ERC165のインターフェースが定義されている', async () => {
    const INTERFACE_ID = '0x01ffc9a7'
    expect(await obj.contract.supportsInterface(INTERFACE_ID)).to.be.true
  })
  it('ERC721のインターフェースが定義されている', async () => {
    const INTERFACE_ID = '0x80ac58cd'
    expect(await obj.contract.supportsInterface(INTERFACE_ID)).to.be.true
  })
  it('ERC721Metadataのインターフェースが定義されている', async () => {
    const INTERFACE_ID = '0x5b5e139f'
    expect(await obj.contract.supportsInterface(INTERFACE_ID)).to.be.true
  })
  it('ERC2981のインターフェースが定義されている', async () => {
    const INTERFACE_ID = '0x2a55205a'
    expect(await obj.contract.supportsInterface(INTERFACE_ID)).to.be.true
  })
})
