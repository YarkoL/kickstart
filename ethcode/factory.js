import web3 from './web3';
import CampaignFactory from './build/CampaignFactory.json';

const factoryDeployedToAddress = '0x67604C62410bbC44966c15E974a06DFB5476dbB6';

const instance = new web3.eth.Contract(
	JSON.parse(CampaignFactory.interface),
	factoryDeployedToAddress
);

export default instance;