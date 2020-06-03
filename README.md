# raiden-energy-trading
A protoype of a decentralized energy trading platform using the blockchain technology.
Every 15 minutes (0, 15, 30, 45) the household server sends their data to the netting server. One minute later (1, 16, 31, 46) the netting server matches the households and sends a list to a smart contract (https://goerli.etherscan.io/address/0x07799d623c82c4c4ada1245eb7688453216d529b).

start the household and netting server:
1. ./start.sh

start the raiden clients:
1. cd raiden
2. docker-compose up
