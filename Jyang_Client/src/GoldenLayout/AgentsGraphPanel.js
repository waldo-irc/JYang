import React from "react";
import { Network, Node, Edge } from 'react-vis-network';
import station from "./Images/station.png";
import linux from "./Images/linux.png";
import mac from "./Images/mac.png";
import windows from "./Images/windows.png";

const PLATFORM_ICONS = {
  linux: linux,
  darwin: mac,
  win32: windows,
  win64: windows,
  unknown: windows
};

export class AgentsGraphPanel extends React.Component {
  constructor(props) {
    super(props);
    this.graphRef = React.createRef();
    this.state = { isLoaded: false, agents: [], graph: true };
  }

  render() {
    const { isLoaded, agents } = this.state;
    const { getCommState, connPipe } = this.props;

    function myClick(agent) {
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

    const Decorator = props => {
      return (
        /*<button onClick={() => console.log(`You clicked ${props.label}`)}>*/
        <button onClick={() => myClick(agents["active_agents"][props.id])}>
          CONNECT
        </button>
      );
    };

    if (!isLoaded) {
      return <div>Loading...</div>;
    }
    
    var allnodes = [];
    var agentsInfo = Object.keys(agents.active_agents).map(function(key) {
      const agent = agents["active_agents"][key];
      const { uuid, platform, hostname, admin, ip, pid } = agent;

      allnodes.push(uuid);

      return (
        <Node physics={false} scaling={{min:20,max:20,label: {enabled: true, min:8,max:8}}} value={20}
          key={ uuid } id={ uuid } shape="image"
          image={ PLATFORM_ICONS[platform || 'unknown'] }
          label={ hostname + "\n" + ip + "\nPID:" + pid}
          color={ admin === "true" ? "red":"black"} 
          decorator={Decorator} />
      );
    });

    var createEdges = Object.keys(agents["active_agents"]).map(function(key) {
      let connectTo;
      if (agents["active_agents"][key]["type"] === "smb" ) {
        connectTo = agents["smb_routes"][agents["active_agents"][key]["uuid"]];
      }
      return ( 
        <Edge dashes={agents["active_agents"][key]["type"] === "http" ? true:false} smooth={{enabled: true, type: "continous", roundness: .4}} scaling={{min:1,max:1}} value={1}
          arrows={{to: {enabled: true, scaling: 1} }} shadow={true} physics={false}
          key={ Math.random() } chosen={false} id={ Math.random() } from={agents["active_agents"][key]["type"] !== "smb" ? agents["active_agents"][key]["uuid"]:connectTo}  to={agents["active_agents"][key]["type"] !== "smb" ? "station":agents["active_agents"][key]["uuid"]} />
      );
    });
    
    return (
      <div /*className="scrollable"*/ id="graphOutline">
        <button className="btn btn-secondary" style={{width:"100%"}} onClick={function(){this.setState({graph: !this.state.graph})}.bind(this)}>Toggle Grid</button>
        <div className={this.state.graph ? "grid_style":"normal_style"}>
          <Network
            options={{ clickToUse: false }}
            ref={this.graphRef} >
            <Node physics={false} scaling={{min:20,max:20,label: {enabled: true, min:8,max:8}}} value={20}
              id="station" shape="image" image={station} label="You" color="black"/>
            { agentsInfo }
            { createEdges }
          </Network>
        </div>
      </div>
    );
  }

  componentDidMount() {
    const { getCommState } = this.props;
    const commState = getCommState();
    this.setState({ agents: commState, isLoaded: true, lastGraphState: Object.keys(commState.active_agents) });

    const {graphRef} = this;
    setTimeout(function() {
      const network = graphRef.current;
      if (network)
        network.network.fit();
        network.network.focus("station", {scale: .2});
        console.log(network);
    }, 300);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const nextCommState = nextProps.getCommState();
    const nextGraphData = Object.keys(nextCommState.active_agents);

    if (this.state !== nextState) {
      return true;
    }

    if (JSON.stringify(nextGraphData) !== JSON.stringify(this.state.lastGraphState)) {
      this.setState({ lastGraphState: Object.keys(this.props.getCommState().active_agents) });
      return true;
    } else if (this.props.getCommState['smb_routes'] !== nextCommState['smb_routes']) {
      return true;
    }
    else {
      return false;
    }
  }
}
