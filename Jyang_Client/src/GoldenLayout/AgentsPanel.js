import React from "react";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import $ from "jquery";
import { prepSendData } from "../App.js";

export class AgentsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isLoaded: false, focused: false, agents: [], agentsCheck: [], dragSources: [], activeIndex: {}, allIndexes: {} };
  }

  render() {
    const { isLoaded, agents, dragSources, allIndexes } = this.state;
    const { getCommState, connPipe } = this.props;

    if (!isLoaded) {
      const FA = require('react-fontawesome');
      return <div className="loading"><FA name="spinner enlargeSpinner" className="rotate"/><br />LOADING</div>;
    }

    for (var i = 0; i < localStorage.length; i++) {
      const item = localStorage.key(i);
      if (item !== "savedConnections" && !item.includes("Host") && !item.includes("Nick") && !item.includes("Token") && !item.includes("gl-") && !item.includes("_latest")) {
        if (!(item in agents.active_agents)) {
          localStorage.removeItem(item);
          localStorage.removeItem(item+"_latest");
        }
      };
    }

    const agentInfo = Object.keys(agents.active_agents).map(function(key, index) {
      const agent = agents.active_agents[key];

      function myClick() {
        this.selectRow(index);
        const newItemConfig = {
          title: agent["ip"]+"@"+agent["pid"]+":"+agent["procname"],
          type: "react-component",
          component: "agents-menu-component",
          props: { agentuuid: agent["uuid"], "connPipe": connPipe, "getCommState": getCommState },
        };
        if( global.myMainLayout.selectedItem === null ) {
          //alert( 'No item selected. Please click the black header bar to select which item you want to add new items to.' );
          global.myMainLayout.root.contentItems[ 0 ].addChild( newItemConfig );
        } else {
          global.myMainLayout.selectedItem.addChild( newItemConfig );
        }
      }

      let dt = Math.max(((new Date()).getTime() - agent["lastCheckIn"]) / 1000);
      if (dt >= 1) {
        dt = Math.ceil(dt);
      }
      let stale = false;
      let seconds = dt + 's';
      if (Math.floor(dt) > 6+parseInt(agent["sleep"])+(parseInt(agent["sleep"])*(parseInt(agent["jitter"])/100))+1) {
        stale = true;
      }
      if (dt < 0) {
        dt = 0;
      }
      if (agent["sleep"] === "0") {
        dt = 'interactive';
      }
      else {
        if (dt > 86400) {
          dt = Math.floor(dt/86400);
          dt = seconds + '(' + dt + 'd)';
        }
        else if (dt > 3600) {
          dt = Math.floor(dt/3600);
          dt = seconds + '(' + dt + 'h)';
        }
        else if (dt > 60) {
          dt = Math.floor(dt/60);
          dt = seconds + '(' + dt + 'm)';
        }
        else if (dt >= 1 | dt === 0) {
          dt = seconds;
        }
        else {
          if (Math.round(dt) === 1) {
            dt = Math.round(dt) + 's'
          } else {
            dt = Math.round(dt*1000) + 'ms'
          }
        }
        if (stale === true) {
          dt = "[STALE] " + dt;
        }
      } // Sortable Table and fix right click context menu
      let linked;
      let unlinked;
      if (agent["type"] === "smb" && !(agent["uuid"] in this.props.getCommState()["smb_routes"])) {
        linked = ' ⚲ ';
        unlinked = true;
      } else if (agent["type"] === "smb") {
        linked = ' ☍ '+this.props.getCommState()["smb_routes"][agent['uuid']];
        unlinked = false;
      }
      allIndexes[index] = agent["uuid"];
      return <ContextMenuTrigger key={agent["uuid"]} id={agent["uuid"]+"JYANGMENU"} renderTag="tr" attributes={{
        id: agent["uuid"]+"JYANG",
        className: "pointer " + ((index in this.state.activeIndex) && "active-index") + " " + (unlinked && "unlinked")
      }}>
        {/*<tr id={agent["uuid"]+"JYANG"} key={agent["uuid"]} className="pointer">*/}
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)} /*style={{display: "none"}}*/>{agent["uuid"]}</td>
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)}>{agent["ip"]}{linked}</td>
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)}>{agent["admin"] === "true" ? agent["user"] + "*": agent["user"]}</td>
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)}>{agent["hostname"]}</td>
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)}>{agent["platform"]}</td>
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)}>{agent["type"]}</td>
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)}>{agent["pid"]}:{agent["procname"]}</td>
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)}>{agent["type"] !== "smb" ? agent["sleep"]+ "±" + agent["jitter"] + "% [" + agent["trueSleep"] + "]" : "∞"}</td>
          <td onContextMenu={ e=>this.selectRowRight(index,agent["uuid"]) } onClick={ e=>this.selectRow(index,agent["uuid"]) } onDoubleClick={myClick.bind(this)}>{dt}</td>
          {/*<td onClick={() => this.clear(agent["uuid"])}>X</td>*/}
        {/*</tr>*/}
        </ContextMenuTrigger>
    }.bind(this));

    let deviceIsMobile = false; //At the beginning we set this flag as false. If we can detect the device is a mobile device in the next line, then we set it as true.

    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) //eslint-disable-line
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { //eslint-disable-line
      deviceIsMobile = true;
    }

    if(!deviceIsMobile){
      const {agents} = this.state;
      $('.pointer').each(function() {
        const $tds = $(this).find('td'),
                    agentUUID = $tds.eq(0).text();
        const newItemConfig = {
          title: (!agents.active_agents[agentUUID]) ? "undefined" : agents.active_agents[agentUUID]["ip"]+"@"+agents.active_agents[agentUUID]["pid"]+":"+agents.active_agents[agentUUID]["procname"],
          type: "react-component",
          component: "agents-menu-component",
          props: { agentuuid: agentUUID, "connPipe": connPipe, "getCommState": getCommState },
        };
        if (!(dragSources.includes(agentUUID))) {
          global.myMainLayout.createDragSource( $(this), newItemConfig );
          dragSources.push(agentUUID);
        }
      });
  
      dragSources.forEach(function(item) {
        if ($("#" + item + "JYANG").length === 0) {
          const index = dragSources.indexOf(item);
          if (index !== -1) dragSources.splice(index, 1);
        }
      });
    }

    const agentsMenus = Object.keys(agents.active_agents).map((key) => {
      const active = this.state.activeIndex;
      function myClick() {
        for (const agent in active) {
          const newItemConfig = {
            title: (!agents.active_agents[active[agent]]) ? "undefined" : agents.active_agents[active[agent]]["ip"]+"@"+agents.active_agents[active[agent]]["pid"]+":"+agents.active_agents[active[agent]]["procname"],
            type: "react-component",
            component: "agents-menu-component",
            props: { agentuuid: active[agent], "connPipe": connPipe, "getCommState": getCommState },
          };
          if( global.myMainLayout.selectedItem === null ) {
            //alert( 'No item selected. Please click the black header bar to select which item you want to add new items to.' );
            global.myMainLayout.root.contentItems[ 0 ].addChild( newItemConfig );
          } else {
            global.myMainLayout.selectedItem.addChild( newItemConfig );
          }
        }
      }
      return (
      <ContextMenu key={key+"JYANGMENU"} id={key+"JYANGMENU"}>
        <MenuItem>
          <strong>{(Object.keys(this.state.activeIndex).length > 1) ? "MULTIPLE" : this.state.agents.active_agents[key]["pid"]+":"+this.state.agents.active_agents[key]["procname"]}</strong>
        </MenuItem>
        <MenuItem onClick={myClick}>
          Interact
        </MenuItem>
        <MenuItem onClick={() => this.sleep(prompt('Enter a sleep value.','5'))}>
          Sleep
        </MenuItem>
        <MenuItem onClick={() => this.clear()}>
          Remove
        </MenuItem>
        <MenuItem onClick={() => this.exit()}>
          Exit
        </MenuItem>
      </ContextMenu>
      )
    });

    return (
      <div tabIndex="1" onKeyDown={e=>this.selectMany(e)} className="scrollable-noflex-nopadding table-responsive" id="Agents_main"  ref={node => this.node = node}>
        { this.state.newCheckin && (<div className="static"></div>) }
        { agentsMenus }
        <table className="table"> 
          <thead>
            <tr className="noHover">
              <th>Agent</th>
              <th>IP</th>
              <th>User</th>
              <th>Hostname</th>
              <th>OS</th>
              <th>Type</th>
              <th>Process</th>
              <th>Sleep</th>
              <th>Last Checkin</th>
              {/*<th>Remove</th>*/}
            </tr>
          </thead>
          <tbody>
          { agentInfo }
          </tbody>
        </table>
      </div>
    );
  }

  triggerStatic() {
    this.setState({ newCheckin: true });
    setTimeout(x => this.setState({ newCheckin: false }), 1000);
  }

  selectRow(index, agentuuid) {
    document.getElementById('Agents_main').focus();
    const { activeIndex } = this.state;
    if (!(index in this.state.activeIndex)) {
      activeIndex[index] = agentuuid;
    }
    else {
      delete activeIndex[index];
    }
    this.setState( { activeIndex } )
  }

  selectRowRight(index, agentuuid) {
    document.getElementById('Agents_main').focus();
    const { activeIndex } = this.state;
    activeIndex[index] = agentuuid;
    this.setState( { activeIndex } )
  }

  selectMany(e) {
    let { activeIndex, allIndexes } = this.state;
    allIndexes = {};
    if (e.keyCode === 27) {
      activeIndex = {};
      this.setState({activeIndex});
      return;
    }
    if (e.keyCode === 16) {
      for (const key in this.state.allIndexes) {
        let vals = [];
        for (const key in activeIndex) {
          vals.push(key);
        }
        const highest = Math.max.apply( Math, vals );
        const lowest = Math.min.apply( Math, vals )
        if (parseInt(key) < highest &&  parseInt(key) >= lowest && highest !== lowest) {
          activeIndex[key] = this.state.allIndexes[key];
        }
      }
    }
    this.setState({ activeIndex, allIndexes });
  }

  handleClick(e) { /*On clicking anywhere outside of our table deselect all values: https://medium.com/@pitipatdop/little-neat-trick-to-capture-click-outside-react-component-5604830beb7f*/
    if (e.target.id === "Agents_main") {
      this.setState({activeIndex: {}});
    }
    else if (this.node.contains(e.target)) {
      return;
    }
    this.setState({activeIndex: {}});
  }

  componentDidMount() {
    let { agents, agentsCheck } = this.state;
    const { getCommState } = this.props;
    const commState = getCommState();
    agents = commState;

    for (const agent in agents.active_agents) {
      agentsCheck.push(agent);
    }

    this.setState({ agentsCheck, agents, isLoaded: true });

    document.addEventListener('mousedown', (e)=>this.handleClick(e), false)
    setInterval(x => this.forceUpdate(), 1000);
  }
  
  componentWillUnmount() {
    document.removeEventListener('mousedown', (e)=>this.handleClick(e), false)
  }

  componentDidUpdate() {
    let { agents, agentsCheck, focused } = this.state;

    if ( focused === false ) {
      document.getElementById('Agents_main').focus();
      focused = true;
      this.setState({ focused });
    };

    for (const agent in agents.active_agents) {
      if (!(agentsCheck.includes(agent))) {
        agentsCheck.push(agent);
        this.setState({ agentsCheck });
        this.triggerStatic();
      }
    }
  }

  time = (new Date()).getTime();
  shouldComponentUpdate(nextProps, nextState) {
    const TimeNow = (new Date()).getTime();
    if (this.state !== nextState) {
      return true;
    }

    if (Math.round((TimeNow - this.time) / 1000) >=1) {
      this.time=TimeNow;
      if (this.props.getCommState().active_agents !== nextProps.getCommState().active_agents) {
        return true;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }

  //Agent Quick Commands
  sleep(value) {
    if (value === null) {
      value = 5;
    }
    const { connPipe } = this.props;
    for (const key in this.state.activeIndex) {
      const data = prepSendData({"route":"agents", "data":{"agentUUID":this.state.activeIndex[key],"data":"sleep "+value}});
      connPipe.send(JSON.stringify(data))
    }
  }

  clear() {
    const { connPipe } = this.props;
    for (const key in this.state.activeIndex) {
      const data = prepSendData({"route":"agents", "data":{"clear_agent":this.state.activeIndex[key]}});
      delete this.state.activeIndex[key];
      connPipe.send(JSON.stringify(data))
    }
  }

  exit() {
    const { connPipe } = this.props;
    for (const key in this.state.activeIndex) {
      const data = prepSendData({"route":"agents", "data":{"agentUUID":this.state.activeIndex[key],"data":"exit 0"}});
      delete this.state.activeIndex[key];
      connPipe.send(JSON.stringify(data))
    }
  }
}
