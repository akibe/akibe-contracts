import { task } from 'hardhat/config'

task('deploy:token', 'Deploy Token Contract', async (arg, hre) => {
  const [owner] = await hre.ethers.getSigners()
  console.log('Deploying contracts with the account:', owner.address)
  const beforeBalance = await hre.ethers.provider.getBalance(owner.address)

  const contract = await hre.ethers.deployContract('Token', [
    'Test',
    'TEST',
    'https://arweave.net/Wrk3kFNLaWPziTHOxUsYt7xbnAhQ1WcIHAV_KJaLU0w/metadata/',
    500,
  ])

  await contract.waitForDeployment()
  console.log('Contract address:', contract.target)

  const afterBalance = await hre.ethers.provider.getBalance(owner.address)
  const cost = hre.ethers.formatEther(beforeBalance - afterBalance)
  console.log('Cost:', cost, 'eth')
})
