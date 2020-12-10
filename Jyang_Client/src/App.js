import React from "react";
import md5 from 'md5';
import { GoldenLayoutComponent } from "./GoldenLayout/goldenLayoutComponent";
import { ChatPanel } from "./GoldenLayout/ChatPanel";
import { AgentsPanel } from "./GoldenLayout/AgentsPanel";
import { AgentsMenuPanel } from "./GoldenLayout/AgentsMenuPanel";
import { AgentsGraphPanel } from "./GoldenLayout/AgentsGraphPanel";
import { HttpListenerPanel } from "./GoldenLayout/HttpListenerPanel";
import { SmbListenerPanel } from "./GoldenLayout/SmbListenerPanel";
import { HelpPanel } from "./GoldenLayout/HelpPanel";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css'
import 'golden-layout/src/css/goldenlayout-base.css';
import 'golden-layout/src/css/goldenlayout-dark-theme.css';
import 'bootstrap-css-only/css/bootstrap.min.css';
import './App.css';
import logo from "./logo.png";
import background from "./background.jpg";
import packageJson from "../package.json";

export function getCookie(name) {
  var cookie = localStorage.getItem(name);
  return cookie;
}

export function prepSendData(data) {
  data['nick'] = getCookie('Nick');
  return data;
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.getCommState = this.getCommState.bind(this);
    this.state = {
      isLoaded: false, nickValue: 'Jian Yang', hostValue: 'ws://127.0.0.1:8765', tokenValue: 'password', commState: {}
    };
  }

  getCommState() { return this.state.commState; }

  setCookie(name,value) {
    localStorage.setItem(name, value);
  }

  eraseCookie(name) {   
    localStorage.removeItem(name);
  }

  clear_agents = () => {
    confirmAlert({
      title: 'Clear All Agents?',
      message: 'This will clear all agents in the client.  Any live agents will simply connect back and re-populate.',
      buttons: [
        {
          label: 'Yes',
          onClick: () => this.connection.send(JSON.stringify(prepSendData({"route":"agents", "data":"clear"})))
        },
        {
          label: 'No',
          onClick: () => void(0)
        }
      ]
    })
  };

  exit_agents = () => {
    confirmAlert({
      title: 'Exit All Agents?',
      message: 'This will send an exit command to all running agents.',
      buttons: [
        {
          label: 'Yes',
          onClick: () => this.connection.send(JSON.stringify(prepSendData({"route":"agents", "data":"exit_all"})))
        },
        {
          label: 'No',
          onClick: () => void(0)
        }
      ]
    })
  };

  download_agent(agentType,agentName) {
    var data = prepSendData({"route":"download","data":{"type":agentType,"name":agentName}});
    this.connection.send(JSON.stringify(data));
  }

  handleChangeNick(e) {
    this.setState({ nickValue: e.target.value });
  }
  handleChangeHost(e) {
    this.setState({ hostValue: e.target.value });
  }
  handleChangeToken(e) {
    this.setState({ tokenValue: e.target.value });
  }

  eraseAllCookies() {
    this.eraseCookie("Nick");
    this.eraseCookie("Host");
    this.eraseCookie("Token");
    window.location.reload();
  }

  setAllCookies() {
    if ( getCookie("Host") == null ) {
      this.setCookie("Host", this.state.hostValue);
      this.setCookie("LastHost", this.state.hostValue);
    }
    if ( getCookie("Nick") == null ) {
      this.setCookie("Nick", this.state.nickValue);
      this.setCookie("LastNick", this.state.nickValue);
    }
    if ( getCookie("Token") == null ) {
      this.setCookie("Token", this.state.tokenValue);
      this.setCookie("LastToken", this.state.tokenValue);
    }
    let {hostValue, tokenValue, nickValue} = this.state;
    const newLogin = {};
    newLogin[hostValue] = {"nick":nickValue,"token":tokenValue};
    if ( localStorage.getItem("savedConnections") ) {
      const tmp = localStorage.getItem("savedConnections");
      this.setCookie("savedConnections", JSON.stringify(Object.assign({}, JSON.parse(tmp), newLogin)));
    }
    else {
      this.setCookie("savedConnections", JSON.stringify(newLogin));
    }
  }

  UNSAFE_componentWillMount() {
    if (getCookie("LastHost")) {
      this.setState({ hostValue: getCookie("LastHost")});
    }
    if (getCookie("LastNick")) {
      this.setState({ nickValue: getCookie("LastNick")});
    }
    if (getCookie("LastToken")) {
      this.setState({ tokenValue: getCookie("LastToken")});
    }
    if (getCookie('Host') !== null) {
      this.connection = new WebSocket(getCookie('Host'));
      setTimeout(() => {
        if (this.connection.readyState !== 1) {
            alert("Connection refused!  Check the ip and that the server is running.");
            this.eraseAllCookies();
          }
      }, 350);
      this.connection.onmessage = (evt => {
        //alert(evt.data);
        const commState = JSON.parse(evt.data);

        if ("login" in commState && commState["login"] !== "success") {
          alert("Failed to login!  Reason given: "+commState["reason"]);
          this.eraseAllCookies();
        }
        else if ("commState" in commState) {
          try {
            if (window.location.search) {
              if (!navigator.userAgent.includes("Electron")) {
                window.history.pushState({urlPath:"/"},"","/");
              }
            }
          }
          catch (err) {
            //Do Nothing
          }
          this.setState({ commState, isLoaded: true});
        }
        else if ("agentData" in commState) {
          var fileDownload = require('js-file-download');
          var base64js = require('base64-js')
          fileDownload(base64js.toByteArray(commState['agentData']), commState['agentName']);
        }
        else {
          //console.log(commState);
          const temp = this.state.commState;
          for (let key in commState) {
            temp[key] = commState[key];
          }
          this.setState({ commState:temp });
        }
      });
      if (getCookie('Nick') !== null || getCookie('Token') !== null) {
        this.connection.onopen = () => this.connection.send(JSON.stringify({nick:getCookie('Nick'),password:md5(getCookie('Token'))}));
      }
    }
  }

  change(event) {
    this.setState({hostValue: event.target.value});
    this.setState({nickValue: JSON.parse(localStorage.getItem("savedConnections"))[event.target.value]["nick"]});
    this.setState({tokenValue: JSON.parse(localStorage.getItem("savedConnections"))[event.target.value]["token"]});
    this.setState({connOption: event.target.value});
  }

  clearAllConnections() {
    this.eraseCookie("savedConnections");
    this.eraseCookie("LastHost");
    this.eraseCookie("LastNick");
    this.eraseCookie("LastTicken");
  }

  clearConnection() {
    const strUser = this.state.connOption;
    const current = JSON.parse(getCookie("savedConnections"));
    delete current[strUser];
    this.setCookie("savedConnections", JSON.stringify(current));
  }

  showSidebar(e) {
    if (e.target.tagName === "LI" || e.target.tagName === "UL" || e.target.tagName === "SPAN") {
      return false;
    }
    
    let deviceIsMobile = false; //At the beginning we set this flag as false. If we can detect the device is a mobile device in the next line, then we set it as true.
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) //eslint-disable-line
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { //eslint-disable-line
      deviceIsMobile = true;
    }

    let {menuVisible} = this.state;
    menuVisible = !menuVisible;
    if (menuVisible && !deviceIsMobile) {
      this.restartTimer();
    }
    else if (!deviceIsMobile) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = undefined;
      }
    }
    this.setState({ menuVisible });
    return;
  }

  toggleSidebar() {
    this.timer = undefined;
    this.setState({ menuVisible: !this.state.menuVisible });
    return;
  }

  timer = undefined;
  restartTimer() {
    let deviceIsMobile = false; //At the beginning we set this flag as false. If we can detect the device is a mobile device in the next line, then we set it as true.
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) //eslint-disable-line
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { //eslint-disable-line
      deviceIsMobile = true;
    }
    if (deviceIsMobile) {
      return false;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(this.toggleSidebar.bind(this), 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  render() {
    const FA = require('react-fontawesome')
    const { menuVisible } = this.state;

    const saved = localStorage.getItem("savedConnections");
    let connections;
    if (saved) {
      connections = Object.keys(JSON.parse(localStorage.getItem("savedConnections"))).map(function(key) {
      return <option key={Math.random()} value={key}>{key}</option>;
      });
    }

    if ( getCookie('Host') === null || getCookie('Nick') === null || getCookie('Token') === null ) {
      return ( 
        <div className="wrapper fadeInDown fill-cont" style={{backgroundImage : 'url(' + background + ')'}}>
          <div id="formContent" className="fadeIn first">
            <form>
              <br />
              <h1 style={{color:"white"}}>JYang<br/><span style={{fontSize:"20px"}}>v{packageJson.version}</span></h1>
              <img src={logo} style={{width:"25%"}} alt="jian yang" />
              <br /><br />
              <p style={{color:"white"}}><strong>Enter a host, nickname and token to login.</strong></p>
              <span className="custom-dropdown">
               <select defaultValue="" value={this.state.connOption} id="connection" onChange={this.change.bind(this)}>
                <option disabled value="">Saved Connections</option>
                  { connections }
                </select>
              </span><br />
              <input onChange={function(e){this.handleChangeHost(e)}.bind(this)} value={this.state.hostValue} type="text" id="Host" className="fadeIn third" name="Host" placeholder="Host"/>
              <input onChange={function(e){this.handleChangeNick(e)}.bind(this)} value={this.state.nickValue} type="text" id="Nick" className="fadeIn second" name="Nick" placeholder="Nick"/>
              <input onChange={function(e){this.handleChangeToken(e)}.bind(this)} value={this.state.tokenValue} type="text" id="Token" className="fadeIn third" name="Token" placeholder="Token"/>
              <br /><br /><button type="submit" className="fadeIn fourth btn btn-light" onClick={function(){this.setAllCookies()}.bind(this)}>ENTER</button> <button className="fadeIn fourth btn btn-light" onClick={function(){this.clearAllConnections()}.bind(this)}>CLEAR ALL</button><br /><br />
              <button className="fadeIn fourth btn btn-light" onClick={function(){this.clearConnection()}.bind(this)}>DELETE SELECTED CONNECTION</button><br /><br />
            </form>
          </div>
        </div>
      );
    }
 
    if (!this.state.isLoaded | this.state.commState.users === undefined) {
      return <div>Loading...</div>;
    }


    const helpConfig = {
      title: 'Agent Help',
      type: 'react-component',
      component: 'help-component',
    };

    const graphConfig = {
      title: 'Agents Graph',
      type: 'react-component',
      component: 'agents-graph-component',
      props: { connPipe: this.connection, getCommState: this.getCommState }
    };
  
    const httpConfig = {
      title: 'HTTP Listener',
      type: 'react-component',
      component: 'http-listener-component',
      props: { connPipe: this.connection, getCommState: this.getCommState }
    };

    const smbConfig = {
      title: 'SMB Listener',
      type: 'react-component',
      component: 'smb-listener-component',
      props: { connPipe: this.connection, getCommState: this.getCommState }
    };

    return (
      <div onClick={(menuVisible) ? this.showSidebar.bind(this):() => { return false }}>
        <div id="wrapper">
          <ul id="menuContainer" onMouseEnter={this.stopTimer.bind(this)} onMouseLeave={this.restartTimer.bind(this)} className={"scrollable "+( menuVisible ? 'visible' : '' )}>
            <li><img src={logo} style={{width:"30%"}} alt="jian yang" /><span style={{fontSize:"20px"}}>&nbsp;<strong>JYang</strong></span></li>
            <li onClick={function(){this.eraseAllCookies()}.bind(this)}>Logout</li>
            <li onClick={function(){window.location.reload()}}>Reload</li>
            <li className="dropdown">
                <span>Agents</span>
                <div className="dropdown-content">
                  <p id="helpmenu" onClick={() => ( global.myMainLayout.selectedItem === null ) ? global.myMainLayout.root.contentItems[ 0 ].addChild( helpConfig ) : global.myMainLayout.selectedItem.addChild( helpConfig )}>Agents Help Menu</p>
                  <p onClick={function(){this.clear_agents()}.bind(this)}>Clear All Active Agents</p>
                  <p onClick={function(){this.exit_agents()}.bind(this)}>Exit All Active Agents</p>
                </div>
            </li>
            <li className="dropdown">
                <span>Unstaged Agents</span>
                <div className="dropdown-content">
                  <p onClick={function(){this.download_agent("agent32exe","AgentEXE32.exe")}.bind(this)}>Windows x86 EXE</p>
                  <p onClick={function(){this.download_agent("agent64exe","AgentEXE.exe")}.bind(this)}>Windows x86-64 EXE</p>
                  <p onClick={function(){this.download_agent("agent32dll","AgentDLL32.dll")}.bind(this)}>Windows x86 DLL</p>
                  <p onClick={function(){this.download_agent("agent64dll","AgentDLL.dll")}.bind(this)}>Windows x86-64 DLL</p>
                  <p onClick={function(){this.download_agent("agent32exesmb","AgentSMB32.exe")}.bind(this)}>Windows x86 EXE SMB</p>
                  <p onClick={function(){this.download_agent("agent64exesmb","AgentSMB.exe")}.bind(this)}>Windows x86-64 EXE SMB</p>
                  <p onClick={function(){this.download_agent("agent32dllsmb","AgentSMB32.dll")}.bind(this)}>Windows x86 DLL SMB</p>
                  <p onClick={function(){this.download_agent("agent64dllsmb","AgentSMB.dll")}.bind(this)}>Windows x86-64 DLL SMB</p>
                  <p onClick={function(){this.download_agent("agent32sh","AgentSH32.bin")}.bind(this)}>Windows x86 ShellCode</p>
                  <p onClick={function(){this.download_agent("agent64sh","AgentSH.bin")}.bind(this)}>Windows x86-64 ShellCode</p>
                  <p onClick={function(){this.download_agent("agent32shsmb","AgentSH32SMB.bin")}.bind(this)}>Windows x86 ShellCode SMB</p>
                  <p onClick={function(){this.download_agent("agent64shsmb","AgentSHSMB.bin")}.bind(this)}>Windows x86-64 ShellCode SMB</p>
                  <p onClick={function(){this.download_agent("agentlinux","Agent.py")}.bind(this)}>Linux/OSX Python Agent</p>
                </div>
            </li>
          </ul>
          <div className="drawerScroll">
            <img style={{ position:"relative", width:"25px"}} src={logo} alt="jian yang" /><div className="pad" />
            <div tlte="expand" onClick={this.showSidebar.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="ellipsis-h" /></div><div className="pad" />
            <div title="logout" onClick={function(){this.eraseAllCookies()}.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="sign-out-alt" /></div><div className="pad" />
            <div title="refresh" onClick={function(){window.location.reload()}} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="sync" /></div><div className="pad" />
            <div id="helpmenuside" title="help" onClick={() => ( global.myMainLayout.selectedItem === null ) ? global.myMainLayout.root.contentItems[ 0 ].addChild( helpConfig ) : global.myMainLayout.selectedItem.addChild( helpConfig )} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="question-circle" /></div><div className="pad" />
            <div title="unstaged agent exes" onClick={function(){this.download_agent("agent64exe","AgentEXE.exe");this.download_agent("agent32exe","AgentEXE32.exe");}.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="bug" /></div><div className="pad" />
            <div title="unstaged agent exes smb" onClick={function(){this.download_agent("agent64exesmb","AgentEXESMB.exe");this.download_agent("agent32exesmb","AgentEXE32SMB.exe");}.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="bug" /><FA name="network-wired" /></div><div className="pad" />
            <div title="unstaged agent dlls" onClick={function(){this.download_agent("agent64dll","AgentDLL.dll");this.download_agent("agent32dll","AgentDLL32.dll")}.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="syringe" /></div><div className="pad" />
            <div title="unstaged agent dlls smb" onClick={function(){this.download_agent("agent64dllsmb","AgentDLLSMB.dll");this.download_agent("agent32dllsmb","AgentDLL32SMB.dll")}.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="syringe" /><FA name="network-wired" /></div><div className="pad" />
            <div title="unstaged agent shellcode bins" onClick={function(){this.download_agent("agent64sh","AgentSH.bin");this.download_agent("agent32sh","AgentSH32.bin")}.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="code" /></div><div className="pad" />
            <div title="unstaged agent shellcode bins SMB" onClick={function(){this.download_agent("agent64shsmb","AgentSHSMB.bin");this.download_agent("agent32shsmb","AgentSH32SMB.bin")}.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="code" /><FA name="network-wired" /></div><div className="pad" />
            <div title="unstaged agent python3 64 and 32 bit" onClick={function(){this.download_agent("agentlinux","Agent.py")}.bind(this)} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="scroll" /></div><div className="pad" />
            <div id="graphmenu" title="graph" onClick={() => ( global.myMainLayout.selectedItem === null ) ? global.myMainLayout.root.contentItems[ 0 ].addChild( graphConfig ) : global.myMainLayout.selectedItem.addChild( graphConfig )} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="project-diagram" /></div><div className="pad" />
            <div id="httpmenu" title="http listener" onClick={() => ( global.myMainLayout.selectedItem === null ) ? global.myMainLayout.root.contentItems[ 0 ].addChild( httpConfig ) : global.myMainLayout.selectedItem.addChild( httpConfig )} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="globe" /></div><div className="pad" />
            <div id="smbmenu" title="smb listener" onClick={() => ( global.myMainLayout.selectedItem === null ) ? global.myMainLayout.root.contentItems[ 0 ].addChild( smbConfig ) : global.myMainLayout.selectedItem.addChild( smbConfig )} className={"drawerBtn "+( menuVisible ? 'visibleBtn' : '' )}><FA name="network-wired" /></div><div className="pad" />
          </div>
          <div id="layoutContainer"></div>
        </div>
        <GoldenLayoutComponent //config from simple react example: https://golden-layout.com/examples/#qZXEyv
            config={{
              settings: {
                selectionEnabled: true
              },
              content: [{
                type: "column",
                content:[{
                  type:"react-component",
                  title: "Agents",
                  component: "agents-component",
                  isClosable: false,
                  activeItemIndex: 1,
                  props: { connPipe: this.connection, getCommState: this.getCommState }
                },
                {
                  title: "Chat",
                  type: "react-component",
                  component: "chat-component",
                  isClosable: false,
                  props: { connPipe: this.connection, getCommState: this.getCommState,currentUser: this.state.nickValue },
                  height: 40
                }]
              }]
            }}
            registerComponents={myLayout => {
              myLayout.registerComponent("agents-component", AgentsPanel);
              myLayout.registerComponent("chat-component", ChatPanel);
              myLayout.registerComponent("agents-menu-component", AgentsMenuPanel);
              myLayout.registerComponent("agents-graph-component", AgentsGraphPanel);
              myLayout.registerComponent("http-listener-component", HttpListenerPanel);
              myLayout.registerComponent("smb-listener-component", SmbListenerPanel);
              myLayout.registerComponent("help-component", HelpPanel);
            }}
            connPipe = {
              this.connection
            }
            getCommState = {
              this.getCommState
            }
        />
      </div>
    );
  }

}