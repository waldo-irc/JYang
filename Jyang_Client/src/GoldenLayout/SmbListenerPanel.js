import React from "react";
import { prepSendData } from "../App.js";

export class SmbListenerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { pipename: 'WindowsPipe' };
  }

  render() {
    //const FA = require('react-fontawesome');

    return ( 
    <div className="scrollable-noflex">
    <br />
    <form>
      <div className="form-group">
        <label>PipeName</label>
        <input onChange={function(e){this.handleChange(e,"pipename")}.bind(this)} className={"pipename" in this.allChanges ? "form-control active" : "form-control"} placeholder="WindowsPipe" value={this.state.pipename}/>
      </div>
    </form>
    <br />
    <button type="button" className="btn btn-success" onClick={function(){this.set_listener_settings()}.bind(this)}>Set</button>&nbsp;
    <button type="button" className="btn btn-secondary" onClick={function(){this.reset_listener_settings()}.bind(this)}>Reset</button>&nbsp;
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
      var data = prepSendData({"route":"smb_listener", "data":{"settings":this.allChanges}});
      this.props.connPipe.send(JSON.stringify(data))
      this.allChanges = {};
    }
  }

  reset_listener_settings() {
    var data = prepSendData({"route":"smb_listener", "data":{"action":"reset"}});
    this.props.connPipe.send(JSON.stringify(data))
    this.allChanges = {};
  }

  componentDidMount() {
    const { getCommState } = this.props;
    const commState = getCommState();
    const settings = commState.smb_listener_settings;
    const state = commState.smb_routes;

    this.setState({
      pipename: settings['PIPENAME'],
      lastListenerState: settings,
      lastListenerStateState: state
    });
  }

  componentDidUpdate() {
    const { getCommState } = this.props;
    const commState = getCommState();
    const settings = commState.smb_listener_settings;
    const state = commState.smb_routes;

    if (this.state.lastListenerState === settings && this.state.lastListenerStateState === state) {
      return false;
    }

    this.setState({
      pipename: settings['PIPENAME'],
      lastListenerState: settings,
      lastListenerStateState: state
    });
  }
}
