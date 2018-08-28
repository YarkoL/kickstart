//put the name of the source here
const srcFile = 'Campaign.sol';

//from here on, generic build system
const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath); //delete old build if exists

//compile
const contractPath = path.resolve(__dirname, 'contracts', srcFile);
const source = fs.readFileSync(contractPath, 'utf8');
const output = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildPath); //set new build directory

//write each contract in compiled output to its own json file
for (let contract in output) {
	fs.outputJsonSync(
		path.resolve(buildPath, contract.replace(':','') + '.json'),
		output[contract]
		);
}
