#!/usr/bin/env node
//Built in libraries Import
import yargs from 'yargs';
import WebSocket from 'ws';
import md5 from 'md5';
import fs from 'fs';
//Custom Core Imports
import Connections from './lib/core/connections';
import Auth from './lib/core/auth';
import Router from './lib/core/router';
import Logger from './lib/core/logger';
import Logo from './lib/core/logo';
//Custom General Imports
import Chat from './lib/general/chat';
import Download from './lib/general/download';
import Agents from './lib/general/agents';
//Custom Other Imports
import HTTP from './lib/listeners/http_listener';
import SMB from './lib/listeners/smb_listener';

const dir_base = "data/";
const agents_dir = dir_base+"agents";
const agents_staged_dir = dir_base+"agents_staged";
const chat_dir = dir_base+"chat";
const queue_dir = dir_base+"queue";
const save_states_dir = dir_base+"save_states";

if (!fs.existsSync(agents_dir)){
    fs.mkdirSync(agents_dir);
}
if (!fs.existsSync(agents_staged_dir)){
    fs.mkdirSync(agents_staged_dir);
}
if (!fs.existsSync(chat_dir)){
	fs.mkdirSync(chat_dir);
	fs.writeFileSync('data/chat/chat.json', '{"chatData":[]}', function (err) {
		if (err) throw err;
	});
}
if (!fs.existsSync(queue_dir)){
    fs.mkdirSync(queue_dir);
}
if (!fs.existsSync(save_states_dir)){
    fs.mkdirSync(save_states_dir);
}

//fun random boot stuff
new Logo().showLogo();

//Setup Arguments - Uses Yargs library import
const argv = yargs // eslint-disable-line
	.help('h')
	.alias('h', 'help')
	.command('run [key]', 'Start the server with a key (default key is "password").', (yargs) => {
		yargs
			.positional('key', {
				describe: 'key to authenticate',
				default: 'password'
			})
	}, (argv) => {
		//if (argv.verbose) console.info(`Starting server on port: ${argv.port}`);
		if (argv.verbose) console.log('Running in verbose mode.');
	})
	.option('verbose', {
		alias: 'v',
		type: 'boolean',
		description: 'Run with verbose logging. -v for regular verbosity and -vv for dev verbosity.'
	})
	.option('port', {
		alias: 'p',
		type: 'number',
		default: 8765,
		description: 'Run with port (Default is 8765)'
	})
	.argv

function checkRoot() {
	var isRoot = process.getuid && process.getuid() === 0;
	if (isRoot === false) {
		return false;
	}
	else {
		return true;
	}
}

//If not root then we exit.
if (checkRoot === false) {
	console.log('Run again as root.');
	process.exit();
}

//If no key is set then we exit.
if (typeof argv.key == 'undefined') {
	console.log('Must run with a command. EX:./jyang run');
	console.log('Run "./jyang --help" for more info.');
	process.exit();
}

//Instantiate core library objects
let connections = new Connections();
let auth = new Auth(connections);
let router = new Router();

//Instantiate general library objects
let chat = new Chat();
let download = new Download();
let agents = new Agents(connections, router);

//Instantiate listener library objects
let smb = new SMB(router);
let http = new HTTP(agents,smb);

//Add routes
router.addRoute('chat',chat);
router.addRoute('download',download);
router.addRoute('agents',agents);
router.addRoute('http_listener',http);
router.addRoute('smb_listener',smb);

//Prepare socket listener
const wss = new WebSocket.Server({ port: argv.port });
const password = md5(md5(argv.key));
console.log('User hashed password: '+password+'\n');

//Error Handling to Prevent Crashes
process.on('uncaughtException', function (err) {
	console.log('Caught exception: ', err);
	console.log("[X] Error caught above.")
	if (err.code === "EADDRINUSE") {
		agents.connections.sendAll(JSON.stringify({'http_listener_state': 'ERROR: Check that the port is not in use and that SSL Certificates exist if HTTPS is true.'}));
	}
})

//Start Websocket Server
wss.on('connection', function connection(ws) {
	let client = null;
	let logger = null;
	ws.on('message', function incoming(message) {
		let userData = JSON.parse(message);
		let userNick = userData["nick"];
		let loggedIn = auth.checkAuthStatus(userNick);

		//This core lib needs to be instatiated here to obtain socket and user data for logging
		logger = new Logger(argv.verbose, ws._socket.remoteAddress, userNick);

		logger.log(JSON.stringify(userData),1)

		if (("password" in userData)) {
			const userPwd = md5(userData["password"]);
			logger.log(`Login attempted with password ${userPwd}!`,2)

			const authVerdict = auth.authenticate(password, userPwd, loggedIn);
			if (authVerdict === "continue") {
				client = connections.addConnection(ws,userNick);
				logger.log(`User ${userNick} has logged in!`);
				logger.log(`Number of connections: ${connections.getLength()}`,4);
				/*logger.log(`CONNECTIONS: ${JSON.stringify(connections.connections)}`,5);*/
				ws.send('{"login":"success"}');

				const state = router.getState();
				state['commState'] = 'true';
				logger.log(`INIT STATE: ${JSON.stringify(state)}`,5);
				ws.send(JSON.stringify(state));

				chat.newChatData("User: "+userNick+" has logged in.  Run /help for a list of commands.","USER +");
				//connections.sendAll(JSON.stringify(chat.getState()));

				const initData = chat.getState();
				const users = [];
				for (const key in connections["connections"]) {
					users.push(key);
				}
				initData["users"] = users;
				connections.sendAll(JSON.stringify(initData))
			}
			else {
				logger.log(`User ${userNick} has failed to log in due to ${authVerdict}!`,3);
				ws.send('{"login":"failure","reason":"' + authVerdict + '"}');
			}
		}
		else if (loggedIn === false) {
			//If we aren't logged in and no password is sent with the nick then we send a login failure
			logger.log(`User ${client.userNick} has failed to log in due to no password set and not authenticated!`,3);
			ws.send('{"login":"failure"}');
		}
		else {
			const data = JSON.parse(message);
			const routeSupplied = data["route"];
			const dataSupplied = data["data"];

			//Just a fix for chat
			router.routes["chat"].userNick = userNick;

			const changes = router.postUpdate(routeSupplied, dataSupplied);
			logger.log(`CHANGE DATA: ${JSON.stringify(changes)}`,5);

			const all_or_one = changes["send"];
			delete changes["send"];

			if (all_or_one == "all") {
				connections.sendAll(JSON.stringify(changes));
			}
			else {
				ws.send(JSON.stringify(changes));
			}
		}

	});

	ws.onclose = () => {
		try {
			chat.newChatData("User: "+client.userNick+" has logged out.","USER -");
			//connections.sendAll(JSON.stringify(chat.getState()));

			connections.deleteConnection(client.userNick);
			logger.log(`User ${client.userNick} has logged out!`);
			logger.log(`Number of connections: ${connections.getLength()}`,4)
			logger.log(`CONNECTIONS: ${JSON.stringify(connections.connections)}`,5);
			const initData = chat.getState();
			const users = [];
			for (const key in connections["connections"]) {
				users.push(key);
			}
			initData["users"] = users;
			connections.sendAll(JSON.stringify(initData));
		}
		catch (err) {
			//Do Nothing
		}
	};
	//ws.send('something'); // This is here to remind me more stuff can go here
});
