const express = require('express');
const sunnyCoinMiner = express();
const rp = require('request-promise');
var port = process.argv[2];
const bodyParser = require('body-parser');
var BlockchainApp = require('./blockchain'); //used to import blockchain.js
var sunnycoin = new BlockchainApp; //cyrptocurrently

sunnyCoinMiner.use(bodyParser.json());
sunnyCoinMiner.use(bodyParser.urlencoded({ extended: false }));

sunnyCoinMiner.get('/',function(req,res){
res.send("Node of the Miner");
});

sunnyCoinMiner.get('/blockchain',function(req,res){
res.send(sunnycoin);
});

// create a new transaction - only for single node
sunnyCoinMiner.post('/transaction', function(req, res) {
const newTransaction = req.body;
const blockIndex = sunnycoin.addTransactionToPendingTransactions(newTransaction);
res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});


// broadcast transaction
sunnyCoinMiner.post('/transaction/broadcast', function(req, res) {

const newTransaction = sunnycoin.createNewTransaction(req.body.sender, req.body.recipient, req.body.amount);
const requestPromises = [];
sunnycoin.networkNodes.forEach(networkNodeUrl => {
console.log(networkNodeUrl);
const requestOptions = {
uri: networkNodeUrl + '/transaction', // http://localhost:3005/transaction
method: 'POST',
body: newTransaction,
json: true
};

requestPromises.push(rp(requestOptions));
});

Promise.all(requestPromises)
.then(data => {
res.json({ note: 'Transaction created and broadcast successfully.' });
});
});


sunnyCoinMiner.get('/mine',function(req,res){
var currentBlockData = sunnycoin.getPendingTransactions();
//to get the previous hash
var previousBlockHash = sunnycoin.getLastBlock().hash;
//to create the nonce
var valueOfNonce = sunnycoin.proofOfWork(previousBlockHash,currentBlockData)
//to create hash of the block
var hashOfThisBlock = sunnycoin.createNewHash(previousBlockHash,valueOfNonce,currentBlockData)
//to create block
var newBlock = sunnycoin.createNewBlock(hashOfThisBlock,previousBlockHash,valueOfNonce);
//BROADCAST THE BLOCK and make it received at all the nodes
const requestPromises = [];
sunnycoin.networkNodes.forEach(networkNodeUrl => {
const requestOptions = {
uri: networkNodeUrl + '/receive-new-block',
method: 'POST',
body: { newBlock: newBlock },
json: true
};

requestPromises.push(rp(requestOptions));
});

Promise.all(requestPromises)
.then(data => {
const requestOptions = {
uri: sunnycoin.currentNodeUrl + '/transaction/broadcast',
method: 'POST',
body: {
amount: 12.5,
sender: "00",
recipient: "currentNodeUrl"
},
json: true
};

return rp(requestOptions);
})
.then(data => {
res.json({
note: "New block mined & broadcast successfully",
block: newBlock
});
});

});

// receive new block
sunnyCoinMiner.post('/receive-new-block', function(req, res) {
const newBlock = req.body.newBlock;
const lastBlock = sunnycoin.getLastBlock();
const correctHash = lastBlock.hash === newBlock.previousBlockHash;
const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

if (correctHash && correctIndex) {
sunnycoin.chain.push(newBlock);
sunnycoin.pendingTransactions = [];
res.json({
note: 'New block received and accepted.',
newBlock: newBlock
});
} else {
res.json({
note: 'New block rejected.',
newBlock: newBlock
});
}
});

// register a node and broadcast it the network
sunnyCoinMiner.post('/register-and-broadcast-node', function(req, res) {//3001
const newNodeUrl = req.body.newNodeUrl;//3013
if (sunnycoin.networkNodes.indexOf(newNodeUrl) == -1) sunnycoin.networkNodes.push(newNodeUrl);

const regNodesPromises = [];
sunnycoin.networkNodes.forEach(networkNodeUrl => {

const requestOptions = {
uri: networkNodeUrl + '/register-node',
method: 'POST',
body: { newNodeUrl: newNodeUrl },
json: true
};

regNodesPromises.push(rp(requestOptions));
});

Promise.all(regNodesPromises)
.then(data => {
const bulkRegisterOptions = {
uri: newNodeUrl + '/register-nodes-bulk',
method: 'POST',
body: { allNetworkNodes: [ ...sunnycoin.networkNodes, sunnycoin.currentNodeUrl ] },
json: true
};

return rp(bulkRegisterOptions);
})
.then(data => {
res.json({ note: 'New node registered with network successfully.' });
});
});

// block explorer
sunnyCoinMiner.get('/block-explorer',function(req, res){
res.sendFile('./block-explorer/index.html', { root: __dirname });
});





//register a node with another node
sunnyCoinMiner.post('/register-node',function(req,res){
const newNodeUrl = req.body.newNodeUrl;
const nodeNotAlreadyPresent = sunnycoin.networkNodes.indexOf(newNodeUrl) == -1;
const notCurrentNode = sunnycoin.currentNodeUrl !== newNodeUrl;
if (nodeNotAlreadyPresent && notCurrentNode) sunnycoin.networkNodes.push(newNodeUrl);
res.json({ note: 'New node registered successfully.' });
});

// register multiple nodes at once
sunnyCoinMiner.post('/register-nodes-bulk', function(req, res) {
const allNetworkNodes = req.body.allNetworkNodes;
allNetworkNodes.forEach(networkNodeUrl => {
const nodeNotAlreadyPresent = sunnycoin.networkNodes.indexOf(networkNodeUrl) == -1;
const notCurrentNode = sunnycoin.currentNodeUrl !== networkNodeUrl;
if (nodeNotAlreadyPresent && notCurrentNode) sunnycoin.networkNodes.push(networkNodeUrl);
});

res.json({ note: 'Bulk registration successful.' });
});




sunnyCoinMiner.listen(port,function(){
console.log('my server is running at :'+port);
});