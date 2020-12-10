export default class Auth {
	constructor(connections) {
		this.connections = connections;
	}

	checkAuthStatus(userNick) {
		return this.connections.connections[userNick] ? true : false;
	}

	authenticate (password, userPwd, loggedIn) {
		if (userPwd != password) {
			return "bad password!";
		}
		else if (loggedIn === true) {
			return "user is taken!";
		}
		else {
			return "continue";
		}

	}
}
