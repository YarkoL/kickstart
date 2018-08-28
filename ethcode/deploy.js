import './constants';
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledFactory = require('../ethcode/build/CampaignFactory.json');

const provider = new HDWalletProvider(
	MNEMONIdC,
	PROVIDER
);
const web3 = new Web3(provider);

const deploy = async () => {
	const accounts = await web3.eth.getAccounts();
	console.log('Attempting to deploy from account', accounts[0]);
	const result = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
		.deploy({data: compiledFactory.bytecode})
		.send({from: accounts[0], gas: '1000000' });
	console.log('Contract deployed to ',result.options.address);
	//console.log('ABI ', interface);
};

deploy();

/*
jarkko@sbl128:~/EthCourse/kickstart/ethcode$ node deploy.js 
Attempting to deploy from account 0x16A09b236899632e959c3cE7A3C03c340D8C3eE2
Contract deployed to  0x67604C62410bbC44966c15E974a06DFB5476dbB6

*/
