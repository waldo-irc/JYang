import React from "react";
import { prepSendData } from "../App.js";

export class HttpListenerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { running: '', start: "false", host: "127.0.0.1", port: "80", https: "false", server_header: "Apache/2.4.29 (Debian)" };
  }

  render() {
    const FA = require('react-fontawesome');

    return ( 
    <div className="scrollable-noflex">
  <div><span style={{fontSize:"18px"}} className={"Running" === this.state.running || "Starting" === this.state.running || "Restarting" === this.state.running ? "running" : "stopped"} >{(this.state.running === "Running" || this.state.running === "Stopped" || this.state.running.includes("ERROR")) ? <FA name="power-off" /> : <FA name="spinner" className="rotate"/>}</span> <strong>{this.state.running}</strong></div><br />
    <form>
      <div className="form-group">
        <label>Run on start</label>
        <select onChange={function(e){this.handleChange(e,"start")}.bind(this)} className={"start" in this.allChanges ? "form-control active" : "form-control"} value={this.state.start}>
          <option>true</option>
          <option>false</option>
        </select>
      </div>
      <div className="form-group">
        <label>Host</label>
        <input onChange={function(e){this.handleChange(e,"host")}.bind(this)} className={"host" in this.allChanges ? "form-control active" : "form-control"} placeholder="127.0.0.1" value={this.state.host}/>
      </div>
      <div className="form-group">
        <label>Port</label>
        <input onChange={function(e){this.handleChange(e,"port")}.bind(this)} className={"port" in this.allChanges ? Number.isInteger(Number(this.allChanges["port"])) ? Number(this.allChanges["port"]) < 65536 ? "form-control active": "form-control active_bad" : "form-control active_bad" : "form-control"} placeholder="443" value={this.state.port}/>
      </div>
      <div className="form-group">
        <label>HTTPS</label>
        <select onChange={function(e){this.handleChange(e,"https")}.bind(this)} className={"https" in this.allChanges ? "form-control active" : "form-control"} value={this.state.https}>
         <option>true</option>
         <option>false</option>
        </select>
      </div>
      <div className="form-group">
        <label>Server header</label>
        <input onChange={function(e){this.handleChange(e,"server_header")}.bind(this)} className={"server_header" in this.allChanges ? "form-control active" : "form-control"} placeholder="Apache2" value={this.state.server_header}/>
      </div>
    </form>
    <br />
    <button type="button" className="btn btn-secondary" onClick={function(){this.set_listener_settings()}.bind(this)}>Set</button>&nbsp;
    <button type="button" className="btn btn-secondary" onClick={function(){this.reset_listener_settings()}.bind(this)}>Reset</button>&nbsp;
    <button type="button" className="btn btn-success" onClick={function(){this.start_listener()}.bind(this)}>Start</button>&nbsp;
    <button type="button" className="btn btn-success" onClick={function(){this.restart_listener()}.bind(this)}>Restart</button>&nbsp;
    <button type="button" className="btn btn-error" onClick={function(){this.stop_listener()}.bind(this)}>Stop</button>
    </div>
    );
  }

  allChanges = {};
  handleChange(e, value) {
    this.setState({ [value]: e.target.value });
    this.allChanges[value] = e.target.value;
  }

  set_listener_settings(e) {
    const badOptions = document.getElementsByClassName('active_bad');
    if (badOptions.length > 0) {
      alert("Bad options set!  Check any options that are red and rectify!");
    }
    else {
      var data = prepSendData({"route":"http_listener", "data":{"settings":this.allChanges}});
      this.props.connPipe.send(JSON.stringify(data))
      this.allChanges = {};
    }
  }

  reset_listener_settings() {
    var data = prepSendData({"route":"http_listener", "data":{"action":"reset"}});
    this.props.connPipe.send(JSON.stringify(data))
    this.allChanges = {};
  }

  start_listener() {
    this.setState({ running: "Starting"});
    var data = prepSendData({"route":"http_listener", "data":{"action":"start"}});
    this.props.connPipe.send(JSON.stringify(data))
    this.allChanges = {};
  }

  stop_listener() {
    this.setState({ running: "Stopping"});
    var data = prepSendData({"route":"http_listener", "data":{"action":"stop"}});
    this.props.connPipe.send(JSON.stringify(data))
    this.allChanges = {};
  }

  restart_listener() {
    this.setState({ running: "Restarting"});
    var data = prepSendData({"route":"http_listener", "data":{"action":"restart"}});
    this.props.connPipe.send(JSON.stringify(data))
    this.allChanges = {};
  }

  componentDidMount() {
    const { getCommState } = this.props;
    const commState = getCommState();
    const settings = commState.http_listener_settings
    const state = commState.http_listener_state

    this.setState({
      start: settings['START'].toLowerCase(),
      host: settings['HOST'].toLowerCase(),
      port: settings['PORT'].toLowerCase(),
      https: settings['HTTPS'].toLowerCase(),
      server_header: settings['SERVER_HEADER'].toLowerCase(),
      running: state,
      lastListenerState: settings,
      lastListenerStateState: state
    });
  }

  componentDidUpdate() {
    const { getCommState } = this.props;
    const commState = getCommState();
    const settings = commState.http_listener_settings
    const state = commState.http_listener_state

    if (this.state.lastListenerState === settings && this.state.lastListenerStateState === state) {
      return false;
    }

    this.setState({
      start: settings['START'].toLowerCase(),
      host: settings['HOST'].toLowerCase(),
      port: settings['PORT'].toLowerCase(),
      https: settings['HTTPS'].toLowerCase(),
      server_header: settings['SERVER_HEADER'].toLowerCase(),
      running: state,
      lastListenerState: settings,
      lastListenerStateState: state
    });
  }
}
