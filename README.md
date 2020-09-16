# raiden-energy-trading
A protoype of a decentralized energy trading platform using the blockchain technology. In this Project Smart Meter Data will be sent over a Payment Channel using the Raiden Network. Every 15 minutes (0, 15, 30, 45) the simulated Households sends their data to the netting server. One minute later (1, 16, 31, 46) the netting server hashes the received messages an sent them back to the households. 

used versions:

```
node: 11.15.0
npm : 6.7.0
docker: 19.03.12
docker-compose: 1.21.2
```

to start the netting server
```
cd netting_server
node nettingServer.js
docker-compose up
```

to start the simulated households

```
cd docker_manager
```
```
node manager.js

```
```
cd network*
```
```
docker-compose up
```
