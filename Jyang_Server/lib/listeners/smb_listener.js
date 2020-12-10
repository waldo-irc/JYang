import fs from 'fs';
import Stage from './listener_prep_agent.js';
import { ListenerCryptoAPI } from './listeners_api.js';

export default class SMB {
	constructor(router) {
		this.options = {
			'PIPENAME': 'WindowsPipe',
		}
		this.router = router;
		this.optionsBase = JSON.parse(JSON.stringify(this.options));
		if (fs.existsSync('data/save_states/smb_listener.json')) {
			this.options = JSON.parse(fs.readFileSync('data/save_states/smb_listener.json'));
		}
        this.routes = {}
	}
	
	getRoutes() {
		const folder = 'data/routes/';
		this.routes = {};

		fs.readdirSync(folder).forEach(file => {
			  	const content = JSON.parse(fs.readFileSync('data/routes/'+file, 'utf-8'));
				const source = file.replace('.json','');
			  	for (const value in content) {
				  	this.routes[content[value]] = source; 
			  	}
			});
	}

	createRoute(contents, agentRoutesPath) {
		let remoteIP;
		let currentRoutes;
		if (JSON.parse(contents)['connect'] != undefined) {
			remoteIP = JSON.parse(contents)['connect'][0]['connect'][1];

			if (fs.existsSync(agentRoutesPath)) {
				currentRoutes = JSON.parse(fs.readFileSync(agentRoutesPath,'utf-8'));
				currentRoutes[remoteIP] = 0;
				fs.writeFileSync(agentRoutesPath, JSON.stringify(currentRoutes));
			}
			else {
				fs.writeFileSync(agentRoutesPath, `{"${remoteIP}":"0"}`, function (err) {
					if (err) throw err;
				});
			}
		}
	}

	updateUUID(agentIP,agentUUID) {
		const folder = 'data/routes/';
		let content;

		fs.readdirSync(folder).forEach(file => {
			content = JSON.parse(fs.readFileSync('data/routes/'+file, 'utf-8'));
			if (agentIP in content) {
				if (content[agentIP] == "0") {
					content[agentIP] = agentUUID;
					fs.writeFileSync('data/routes/'+file, JSON.stringify(content), function (err) {
						if (err) throw err;
					});
				}
			}
		  });
		const returnData = this.getState();
		this.router.routes.agents.connections.sendAll(JSON.stringify(returnData));
		return this.routes;
	}

	checkWork(agentRoutesPath) {
		let listenerCryptoAPI = new ListenerCryptoAPI();
		let remoteAgentUUID;
		let setConnectMessage;
		let allRemoteConnections = [];
		const content = JSON.parse(fs.readFileSync(agentRoutesPath, 'utf-8'));
		for (const key in content) {
			const fileName = "data/queue/"+content[key]+".json";
			if (fs.existsSync(fileName)) { //if file exists for UUID in queue
				const smbComms = fs.readFileSync(`${fileName}`, 'utf-8');
				let encCommand = listenerCryptoAPI.encryptDecrypt(smbComms);
				encCommand = Buffer.from(encCommand).toString('base64');
				const construct = `{"response":"${encCommand}"}`;
				setConnectMessage = {"connect":{"1":key},"fpipe": this.options.PIPENAME, "connectData": construct};
				allRemoteConnections.push(setConnectMessage);
				remoteAgentUUID = content[key];
				fs.unlinkSync("data/queue/"+remoteAgentUUID+".json");
			}
		}
		return allRemoteConnections;
	}

	getState() {
		this.getRoutes();
		return {'smb_listener_settings':this.options, 'smb_routes': this.routes};
	}

	postUpdate(data) {
		if ('settings' in data) {
			for (const setting in data['settings']) {
				switch (setting.toLowerCase())  {
					case 'pipename':
                        this.options[setting.toUpperCase()] = data['settings'][setting];
				}
			}
			fs.writeFileSync('data/save_states/smb_listener.json',JSON.stringify(this.options));

			let stage = new Stage();
            stage.editBinarySMB(this.options['PIPENAME'], 'static/agents/agent_windows/AgentSMB.exe', 'data/agents_staged/AgentSMB.exe');
            stage.editBinarySMB(this.options['PIPENAME'], 'static/agents/agent_windows/AgentSMB.dll', 'data/agents_staged/AgentSMB.dll');
            stage.editBinarySMB(this.options['PIPENAME'], 'static/agents/agent_windows/AgentSMB32.dll', 'data/agents_staged/AgentSMB32.dll');
			stage.editBinarySMB(this.options['PIPENAME'], 'static/agents/agent_windows/AgentSMB32.exe', 'data/agents_staged/AgentSMB32.exe');
		}
		else if ('action' in data) {
			switch(data['action']) {
				case 'reset':
					this.options = JSON.parse(JSON.stringify(this.optionsBase));
					fs.unlinkSync('data/save_states/smb_listener.json');
					break;
			}
		}
		const returnData = this.getState();
		returnData['send'] = 'all';
		return returnData;
	}
}