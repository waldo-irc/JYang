//Connections Manager
export default class Connections {
	constructor() {
		this.connections = {};
	}

	addConnection(socket, nick) {
		const newConnection = {"socket":socket,"userNick":nick,"ip":socket._socket.RemoteAddress};
		this.connections[nick] = newConnection;
		return newConnection;
	}

	deleteConnection(nick) {
		if (this.connections[nick])
			delete this.connections[nick];
	}

	sendAll(data) {
		for (let key in this.connections)
			this.connections[key].socket.send(data);
	}

	getLength() {
		return Object.keys(this.connections).length;
	}
}
