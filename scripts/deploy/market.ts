import { task } from 'hardhat/config'

task('deploy:market', 'Deploy Market Contract', async (arg, hre) => {
  const [owner] = await hre.ethers.getSigners()
  console.log('Deploying contracts with the account:', owner.address)
  const beforeBalance = await hre.ethers.provider.getBalance(owner.address)

  const contract = await hre.ethers.deployContract('Market')

  await contract.waitForDeployment()
  console.log('Contract address:', contract.target)

  const afterBalance = await hre.ethers.provider.getBalance(owner.address)
  const cost = hre.ethers.formatEther(beforeBalance - afterBalance)
  console.log('Cost:', cost, 'eth')
})
