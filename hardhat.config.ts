import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox-viem'
import 'dotenv/config'
import 'hardhat-gas-reporter'
import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {},
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'JPY',
    coinmarketcap: process.env.COINMARKETCAP,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}

export default config
