//Object Router
export default class Router {
        constructor() {
                this.routes = {};
        }

        addRoute(route,object) {
                this.routes[route] = object;
        }

	getState() {
		var commState = {};
		var temp = this.routes;
		for (var route in this.routes) {
			const stateData = temp[route].getState();
			commState = Object.assign({}, stateData, commState);

                }
		return commState;
	}

        postUpdate(route,data) {
                if (route in this.routes) {
                        var returnData = this.routes[route].postUpdate(data);
                        return returnData;
                }
        }
}
