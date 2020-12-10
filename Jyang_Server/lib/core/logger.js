import colors from 'colors';

export default class Logger {
	constructor(verbose,clientIP,userNick) {
		this.verbose = verbose;
		this.clientIP = clientIP;
		this.userNick = userNick;
	}

	log(details,level=0) {
		var today = new Date();
		var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
		var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
		var date = date+' '+time;

		const logColors = {
				'cyan':colors.cyan,
				'green':colors.green,
				'yellow':colors.yellow,
				'red':colors.red,
				'blue':colors.blue,
				'white':colors.white
				}

		if (level == 0) {
			var color = 'cyan';
			var prefix = '[+] ';
		}
		else if (level == 1){
			var color = 'green';
			var prefix = '[*] ';
		}
		else if (level == 2){
			var color = 'yellow';
			var prefix = '[!] ';
		}
		else if (level == 3){
			var color = 'red';
			var prefix = '[X] ';
		}
		else if (level == 4){
			var color = 'blue';
			var prefix = '[#] ';
		}
		else if (level == 5){
			var color = 'white';
			var prefix = '[DEV DATA] ';
		}

		if (level == 0) {
			var data = prefix + details;
		}
		else if (level == 5) {
			var data = prefix + details + ' ' + 'TIME: ' + date;
		}
		else {
			var data = prefix + 'USER: ' + this.userNick + ' | ' + 'DATA: ' + details + ' | ' + 'IP: ' + this.clientIP + ' | ' + 'TIME: ' + date;
		}

		if (this.verbose == null) {
			if (level == 0) {
				console.log(logColors[color](data));
			}
		}
		else if (this.verbose.length > 1) {
			console.log(logColors[color](data));
		}
		else if (this.verbose == true) {
			if (level != 5) {
				console.log(logColors[color](data));
			}
		}
	}
}
