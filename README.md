# raiden-energy-trading
A protoype of a decentralized energy trading platform using the blockchain technology.
Every 15 minutes (0, 15, 30, 45) the household server sends their data to the netting server. One minute later (1, 16, 31, 46) the netting server match the households and sends a list to a smart contract (https://goerli.etherscan.io/address/0x07799d623c82c4c4ada1245eb7688453216d529b).

to start for Linux:
1. ./start.sh
2. cd raiden
3. docker-compose up
