import '@nomicfoundation/hardhat-chai-matchers'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { ethers } from 'hardhat'

const tokenContName = 'ERC721PresetToken'
const marketContName = 'ERC721PresetMarket'

const tokenName = 'Token'
const tokenSymbol = 'TOKEN'

export async function deployContractFixture() {
  const [owner, guest, ...addr] = await ethers.getSigners()

  const contract = await ethers.deployContract(tokenContName, [
    tokenName,
    tokenSymbol,
    1000,
  ])
  const market = await ethers.deployContract(marketContName)

  const adminRole = await contract.DEFAULT_ADMIN_ROLE()
  const minterRole = await contract.MINTER_ROLE()

  return {
    contract,
    market,
    owner,
    guest,
    addr,
    adminRole,
    minterRole,
    tokenName,
    tokenSymbol,
  }
}

export const makeMarkleTree = (allowLists: any[][]) => {
  const tree = StandardMerkleTree.of(allowLists, ['address', 'uint256'])
  let proofs: any = {}
  for (const [i, v] of tree.entries()) {
    proofs[v[0]] = { proof: tree.getProof(i), count: v[1] }
  }
  return { tree, proofs }
}
