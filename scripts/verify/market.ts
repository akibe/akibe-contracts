import { task } from 'hardhat/config'

task('verify:market', 'Verify Market Contract', async (arg, hre) => {
  await hre.run('verify:verify', {
    address: process.env.MARKET_CONTRACT,
  })
})
