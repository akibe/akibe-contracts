import { task } from 'hardhat/config'

task('verify:token', 'Verify Token Contract', async (arg, hre) => {
  await hre.run('verify:verify', {
    address: process.env.TOKEN_CONTRACT,
    constructorArguments: [`${process.env.NEXT_PUBLIC_METADATA_URI}metadata/`],
  })
})
