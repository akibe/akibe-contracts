import '@nomicfoundation/hardhat-chai-matchers'
import { ethers } from 'hardhat'

const tokenContName = 'ERC721APresetToken'

const tokenName = 'Token'
const tokenSymbol = 'TOKEN'

export async function deployContractFixture() {
  const [owner, guest, ...addr] = await ethers.getSigners()

  const contract = await ethers.deployContract(tokenContName, [
    tokenName,
    tokenSymbol,
    1000,
  ])

  const adminRole = await contract.DEFAULT_ADMIN_ROLE()
  const minterRole = await contract.MINTER_ROLE()

  return {
    contract,
    owner,
    guest,
    addr,
    adminRole,
    minterRole,
    tokenName,
    tokenSymbol,
  }
}
