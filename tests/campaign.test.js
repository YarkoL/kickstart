const assert = 	require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethcode/build/CampaignFactory.json');
const compiledCampaign = require('../ethcode/build/Campaign.json');

let accounts;
let factory; 
let campaignAddress;
let campaign;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts();

	factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface)) 
		.deploy({data: compiledFactory.bytecode})
		.send({from: accounts[0], gas: '1000000' });
	
	//factory.setProvider(provider);
	await factory.methods.createCampaign('10000').send({
		from: accounts[0], gas: '1000000' 
	});		

	//get the 1st element of the array via es2015 destructuring assignment
	[campaignAddress] = await factory.methods.getDeployedCampaigns().call();

	campaign = new web3.eth.Contract(
		JSON.parse(compiledCampaign.interface), 
		campaignAddress
	);
 });
	
 describe('Campaign', () => {
 	it('accepts a contribution and increases contributorsCount', async () => {
 		let contributorsCount = await campaign.methods.contributorsCount().call();
 		const initialContributorsCount = parseInt(contributorsCount);
		await campaign.methods.contribute().send({
			from: accounts[0], 
			value: '10001' 
		});
		const added = await campaign.methods.approvers(accounts[0]).call();
		contributorsCount = await campaign.methods.contributorsCount().call();
 		const finalContributorsCount = parseInt(contributorsCount);
		assert.equal(added, true);
		assert.equal(finalContributorsCount, initialContributorsCount+1);
	});

	it('rejects a contribution that is too small', async () => {
 		try {
 			await campaign.methods.contribute().send({
				from: accounts[0], 
				value: '10000' 
			});
 		} catch (err) {}
		const added = await campaign.methods.approvers(accounts[0]).call();
		assert.equal(added, false);
	});

	it('adds new request to requests', async () => {
		await campaign.methods.createRequest('test', 0, accounts[0]).send({
			from: accounts[0], gas: '1000000'
		});
		const request = await campaign.methods.requests(0).call();
		assert.equal(request.description, 'test');
	});

	it('rejects new request when sent by other than manager', async () => {
		let request = null; 
		try {
			await campaign.methods.createRequest('test', 0, accounts[1]).send({
				from: accounts[1], gas: '1000000'
			});
		} catch (err) {}
		try {
			request = await campaign.methods.requests(0).call();
		} catch (err) {}
		assert.equal(request, null);
	});

	it('accepts approval and increases approvalCount', async () => {
 		
		await campaign.methods.createRequest('test', 0, accounts[0]).send({
			from: accounts[0], gas: '1000000'
		});
		let request = await campaign.methods.requests(0).call();
		await campaign.methods.contribute().send({
			from: accounts[0], 
			value: '10001' 
		});

 		const initialApprovalCount = parseInt(request.approvalCount);
		await campaign.methods.approveRequest(0).send({
			from: accounts[0], gas: '1000000'
		});
		request = await campaign.methods.requests(0).call();
 		const finalApprovalCount = parseInt(request.approvalCount);
 		//assert.equal(request.approvals[accounts[0]], true); //how to test?
		assert.equal(finalApprovalCount, initialApprovalCount+1);
	});

	it('rejects approval from non-contributor', async() => {
		await campaign.methods.createRequest('test', 0, accounts[0]).send({
			from: accounts[0], gas: '1000000'
		});
		let request = await campaign.methods.requests(0).call();
		const initialApprovalCount = parseInt(request.approvalCount);
		try {
			await campaign.methods.approveRequest(0).send({
			from: accounts[0], gas: '1000000'
		});
		} catch (err) {}
		request = await campaign.methods.requests(0).call();
		const finalApprovalCount = parseInt(request.approvalCount);
		assert.equal(finalApprovalCount, initialApprovalCount);
	});

	it('rejects double approval from the same user', async() => {
		await campaign.methods.createRequest('test', 0, accounts[0]).send({
			from: accounts[0], gas: '1000000'
		});
		await campaign.methods.contribute().send({
			from: accounts[0], 
			value: '10001' 
		});	
		await campaign.methods.approveRequest(0).send({
			from: accounts[0], gas: '1000000'
		});
		let request = await campaign.methods.requests(0).call();
		const firstApprovalCount = parseInt(request.approvalCount);
		try {
			await campaign.methods.approveRequest(0).send({
			from: accounts[0], gas: '1000000'
		});
		} catch (err) {}
		request = await campaign.methods.requests(0).call();
		const secondApprovalCount = parseInt(request.approvalCount);
		assert.equal(firstApprovalCount, secondApprovalCount);
	});

	it('finalizes request and transfers value', async() => {
		await campaign.methods.contribute().send({
			from: accounts[0], 
			value: '10001' 
		});
		await campaign.methods.contribute().send({
			from: accounts[1], 
			value: '10001' 
		});
		await campaign.methods.contribute().send({
			from: accounts[2], 
			value: '10001' 
		});
		await campaign.methods.createRequest('test', 10, accounts[1]).send({
			from: accounts[0], gas: '1000000'
		});
		await campaign.methods.approveRequest(0).send({
			from: accounts[0], gas: '1000000'
		});
		await campaign.methods.approveRequest(0).send({
			from: accounts[1], gas: '1000000'
		});
		const initBalance = await web3.eth.getBalance(accounts[1]);
		await campaign.methods.finalizeRequest(0).send({
			from: accounts[0], gas: '1000000'
		});
		const finalBalance = await web3.eth.getBalance(accounts[1]);
		request = await campaign.methods.requests(0).call();
		assert.equal(request.complete, true);
		assert.equal(parseInt(finalBalance), parseInt(initBalance) + 10);
	});

	it('rejects finalization of request when not approved by majority', async() => {
		await campaign.methods.contribute().send({
			from: accounts[0], 
			value: '10001' 
		});
		await campaign.methods.contribute().send({
			from: accounts[1], 
			value: '10001' 
		});
		await campaign.methods.contribute().send({
			from: accounts[2], 
			value: '10001' 
		});
		await campaign.methods.createRequest('test', 10, accounts[1]).send({
			from: accounts[0], gas: '1000000'
		});
		await campaign.methods.approveRequest(0).send({
			from: accounts[0], gas: '1000000'
		});
		try {
			await campaign.methods.finalizeRequest(0).send({
				from: accounts[0], gas: '1000000'
			});
		} catch (err) {} 
		request = await campaign.methods.requests(0).call();
		assert.equal(request.complete, false);
	});

	it('rejects finalization of request by non-manager', async() => {
		await campaign.methods.contribute().send({
			from: accounts[0], 
			value: '10001' 
		});
		await campaign.methods.contribute().send({
			from: accounts[1], 
			value: '10001' 
		});
		await campaign.methods.contribute().send({
			from: accounts[2], 
			value: '10001' 
		});
		await campaign.methods.createRequest('test', 10, accounts[1]).send({
			from: accounts[0], gas: '1000000'
		});
		await campaign.methods.approveRequest(0).send({
			from: accounts[0], gas: '1000000'
		});
		await campaign.methods.approveRequest(0).send({
			from: accounts[1], gas: '1000000'
		});
		try {
			await campaign.methods.finalizeRequest(0).send({
				from: accounts[1], gas: '1000000'
			});
		} catch (err) {} 
		request = await campaign.methods.requests(0).call();
		assert.equal(request.complete, false);
	});
 });	
