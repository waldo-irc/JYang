import fs from 'fs';

export class ListenerSettingsAPI {
	constructor() {
		this.defaultPath = 'data/default_states/';
		this.savePath = 'data/save_states';
	}

	saveDefaultSettings(listener,options) {
		if (!fs.existsSync(this.defaultPath+listener+'.json')) {
			fs.writeFileSync(this.defaultPath+listener+'.json', JSON.stringify(options), function (err) {
				if (err) throw err;
			});
		}
	}

	saveSettings(listener,options) {
		fs.writeFileSync(this.savePath+listener+'.json', JSON.stringify(options), function (err) {
			if (err) throw err;
		});
	}

	loadDefaultSettings(listener) {
		const contents = fs.readFileSync(this.defaultPath+listener+'.json');
		return JSON.parse(contents);
	}

	loadSavedSettings(listener) {
		if (fs.existsSync(this.savePath+listener+'.json')) {
			const contents = JSON.parse(fs.readFileSync(this.defaultPath+listener+'.json'));
		}
		else {
			const contents = this.loadDefaultSettings(listener);
		}
		return data;
	}

	resetSettings(listener) {
		if (fs.existsSync(this.savePath+listener+'.json')) {
			//Remove File
		}
		const defaults = this.loadDefaultSettings(listener);
		return defaults;
	}

	updateSettings(data,options,listener) {
		newOptions = data['settings'];
		for (const key in newOptions) {
			options[
key.toUpperCase()] = newOptions[key];
		}
		this.saveSettings(listener.options)
		return options;
	}
}

export class ListenerControlAPI {
	constructor() {
		this.state = [];
	}

	startOnInit(run,init) {
		if (init.toLowerCase() == 'true') {
			run();
		}
	}

	startState(listener) {
		this.state.push(`${listener} running`);
	}

	stopState(listener) {
		this.state.remove(`${listener} running`);
	}
}

export class ListenerCryptoAPI {
	constructor() {
		this.xorKey = 'fCqZz26!z@PppZ9';
	}

	encryptDecrypt(text) {
		return Array.from(
			text,
			(c, i) => String.fromCharCode(c.charCodeAt() ^ this.xorKey.charCodeAt(i % this.xorKey.length))
		).join('');
	}
}

export class ListenerAgentsAPI {
	constructor(agents,connections) {
		this.agents = agents;
		this.connections = connections;
	}

	addAgent(hostUUID,data) {
		this.agents.addAgent(hostUUID,data);
	}
}
