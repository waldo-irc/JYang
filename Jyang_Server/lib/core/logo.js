import fs from 'fs';
import packageJson from '../../package.json';

export default class Logo {
	showLogo() {
		console.log('JYang Server');
		console.log('"Okay. Let\'s start with a hot dog." - Jian Yang\n');
		var contents = fs.readFileSync('static/base/logo.txt', 'utf8');
		console.log(contents);
		console.log("v"+packageJson.version);
	}
}
