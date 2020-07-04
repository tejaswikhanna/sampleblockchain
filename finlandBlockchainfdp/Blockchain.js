var sha256 = require('sha256'); //imports sha256 library, should be installed first
var currentNodeUrl = process.argv[3]; //to take the forth value from the package.json file of node 

function Blockchain(){ //parent function to create the chain
    this.chain = []; //array of chain
    this.pendingTransactions = []; //array of newTransactions
    this.createNewBlock("00000000000a1","000000000000",2342342345); //used to create genesis
    this.networkNodes = []; //list of all the nodes url
    this.currentNodeUrl = process.argv[3];
}

Blockchain.prototype.createNewBlock = function(hashOfThisBlock,previousHash,valueOfNonce){ //child function to create the block
    const newBlock = {
        height:this.chain.length+1, //number of the block
        timestamp:Date.now(),
        transactions:this.pendingTransactions,
        hash:hashOfThisBlock,
        previousBlockHash:previousHash,
        nonce:valueOfNonce,
        numberOfTransactions:this.pendingTransactions.length
    };
this.chain.push(newBlock);
this.pendingTransactions=[];
return newBlock;
}


Blockchain.prototype.createNewTransaction = function(senderId,recipientId,amountOfTr){ //child function to create the block
    const newTransaction = {
        sender:senderId,
        recipient:recipientId,
        amount:amountOfTr
    };
this.pendingTransactions.push(newTransaction);
return newTransaction;
}


Blockchain.prototype.createNewHash = function(previousBlockHash,nonce,currentBlockData){ //this fucntion is used to create new hash
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash; //return this hash to the function
}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){ //this fucntion is used to create new hash
    let nonce = 0;
    let hash = this.createNewHash(previousBlockHash,nonce,currentBlockData);
    console.log(hash)
    while(hash.substring(0,5)!="00000"){
        nonce++;
        hash = this.createNewHash(previousBlockHash,nonce,currentBlockData);
    }
    return nonce;
}

Blockchain.prototype.addTransactionToPendingTransactions = function(newTr){ //this fucntion is used to add new transactions to pending transaction array
    this.pendingTransactions.push(newTr);
    return this.chain.length+1;
}

Blockchain.prototype.getLastBlock = function(){ //get the previous block
    return this.chain[this.chain.length-1];
}
    
Blockchain.prototype.getPendingTransactions = function(){ //returns pending transactions array
    return this.pendingTransactions;
}

Blockchain.prototype.addNewNode= function(newNodeUrl){ //child function to add new node into the list of network nodes    
this.networkNodes.push(newNodeUrl);
return this.networkNodes;
}

module.exports = Blockchain;