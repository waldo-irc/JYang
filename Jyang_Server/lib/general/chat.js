import fs from 'fs';

export default class Chat {
	constructor() {
		this.commands = {
			'clear': this.clearChatData.bind(this),
			'help': this.helpMenu.bind(this)
		};
		this.userNick = 'none';
		this.admin = 'ANNOUNCEMENT';
        }

	getChatData() {
		var contents = fs.readFileSync('data/chat/chat.json', 'utf8');
		return contents.replace(/(\r\n|\n|\r)/gm, "");
	}

	newChatData(data,userNick=this.userNick) {
		var date = new Date();
		var month = date.getMonth() + 1; //months from 1-12
		var day = date.getDate();
		var seconds = date.getSeconds();
		var minutes = date.getMinutes();
		var hour = date.getHours();
		var fullDateAndTime = month+"/"+day+" "+hour+":"+minutes+":"+seconds;

		var contents = fs.readFileSync('data/chat/chat.json', 'utf8');
		contents = JSON.parse(contents);
		contents['chatData'].push({'nick':userNick, 'message':data, 'date':fullDateAndTime});
		contents = JSON.stringify(contents);
		fs.writeFileSync('data/chat/chat.json', contents, function (err) {
			if (err) throw err;
		});
	}

	runCommand(command) {
		command = command.replace('/','').split(' ')[0];
		if (command in this.commands) {
			this.commands[command]();
		}
		else {
			const chat = 'USER '+this.userNick+' Ran Bad Command: '+command
			this.newChatData(chat,this.admin);
		}
	}

	clearChatData() {
		fs.writeFileSync('data/chat/chat.json', '{"chatData":[]}', function (err) {
			if (err) throw err;
		});
	}

	helpMenu() {
		this.newChatData('VALID COMMANDS: clear (Clears Chat), help (Display Help)',this.admin);
	}

	getState() {
		return JSON.parse(this.getChatData());
	}

	postUpdate(data) {
		if (data.charAt(0) == '/') {
			const command = data.replace('/','');
			this.runCommand(command);
			const returnData = JSON.parse(this.getChatData());
			returnData['send'] = 'all';
			return returnData;
		}
		else {
			this.newChatData(data);
			var returnData = JSON.parse(this.getChatData());
			returnData['send'] = 'all';
			return returnData;
		}
	}
}

