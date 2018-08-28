import { PROVIDER } from './constants';
import Web3 from 'web3';

let provider;

if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
	//we're in browser running Metamask
	provider = window.web3.currentProvider;
} else {
	provider = new Web3.providers.HttpProvider(
		PROVIDER
	);
}
const web3 = new Web3(provider);

export default web3;