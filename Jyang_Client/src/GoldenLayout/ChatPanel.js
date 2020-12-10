import React from "react";
import { getCookie } from "../App.js";
import { prepSendData } from "../App.js";

function scrollToBottom (ref) {
  ref.current.scrollIntoView({ behavior: 'smooth' });
}

class ChatPanelOutput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return( 
      <div className="output grow">
        <div className="chat-shadow"> </div>
        { this.props.chatBody }
        <div style={{height:'0'}} ref={this.props.chatEnd} />
      </div>
    )
  }

  componentDidMount() {
    this.setState({ lastChatState: this.props.chatBody }, () => scrollToBottom(this.props.chatEnd));
  }

  componentDidUpdate() {
    const chatData = this.props.chatBody;

    if (this.state.lastChatState !== chatData) {
      scrollToBottom(this.props.chatEnd);
      this.setState({ lastChatState: chatData });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const nextChatData = this.props.chatBody;

    if ((this.state.lastChatState!==undefined)) {
      if (nextChatData.toString() !== this.state.lastChatState.toString()) {
        this.setState({ lastChatState: this.props.chatBody });
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
}

export class ChatPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '', history: [], historyval: 0, historylatest: '' };
    this.chatEnd = React.createRef();
    this.chatInput = React.createRef();
  }

  render() {
    const { getCommState } = this.props;
    const { value } = this.state;
    const commState = getCommState();
    const { currentUser } = this.props;

    const chatData = (commState && commState.chatData) || [];
    const chatBody = chatData.map(x => {
      const user = x['nick'];
      const message = x['message'];
      const date = x['date'];
      let textColor;
      if (user.includes("USER +") | user.includes("AGENT +")) {
        textColor = "#00aeff";
      }
      if (user.includes("USER -") | user.includes("AGENT -")) {
        textColor = "#e80000";
      }
      if (user === currentUser)
        return <div className="userTextHighlight" key={Math.random()}><p> [{date}][{user}]:{message}<br /></p></div>;
      else if (textColor)
        return <p key={Math.random()}> [{date}] [{user}]: <span style={{ color: textColor }}>{message}</span><br /></p>;
      else
        return <p key={Math.random()}> [{date}] [{user}]: {message}<br /></p>;
    });
    
    const data = commState.users.sort();

    return (
      <div className="flex h fullsize">
        <div className="flex v users">
          <div><strong>Users</strong><hr /></div>
          { data.map(x => (
            <div className="user" key={Math.random()}>{x}</div>
          )) }
        </div>
        <div className="grow wraponly">
          <div className="flex-grow-inner fullsize flex v">
            <ChatPanelOutput chatBody={chatBody} chatEnd={this.chatEnd}/>
            <div style={{ display:"flex", borderTop: "solid 1px", color: "#7DC584"}}>
              <div style={{ whiteSpace:"nowrap" }}>&nbsp;{getCookie('Nick')+ " >"}&nbsp;</div>
              <textarea ref={this.chatInput} maxLength="512" onChange={e=>this.handleChange(e)} value={value} onKeyDown={e=>this.keyPress(e)} className="input clear"/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  keyPress(e) {
    if(e.keyCode === 38) {
      let { value, history, historyval, historylatest } = this.state;

      if(historyval === history.length)
        historylatest = value;

      if(historyval > 0)
        historyval--;

      value = history[historyval];

      e.preventDefault();
      this.setState({ value, historyval, historylatest });

      return false;
    }
    else if(e.keyCode === 40) {
      let { value, history, historyval, historylatest } = this.state;
      
      if(historyval !== history.length)
        historyval++;
      
      if(historyval === history.length+1)
        value = history[historyval-1];
      else if(historyval === history.length)
        value = historylatest
      else
        value = history[historyval];

      e.preventDefault();
      this.setState({ value, historyval });

      return false;
    }
    else if(e.keyCode === 13){
      e.preventDefault()
      scrollToBottom(this.chatEnd);
      if(this.state.value === ""){
        return false;
      }
      this.send_chat();
    }
  }

  send_chat() {
    let { history, historyval, value, historylatest } = this.state;
    historylatest = "";
    if(history.length > 1024)
      history = history.slice(history.length-1024)
    history = history.concat(value);
    historyval = history.length;
    this.setState({ history, historyval, value, historylatest });

    var data = prepSendData({"route":"chat", "data":this.state.value});
    this.props.connPipe.send(JSON.stringify(data))
    this.setState({ value: '' });
  }

  componentDidMount() {
    const { getCommState } = this.props;
    const chatData = getCommState().chatData;

    this.setState({ lastChatState: chatData });
  }

  componentDidUpdate() {
    const { getCommState } = this.props;
    const chatData = getCommState().chatData;

    if (this.state.lastChatState !== this.props.getCommState().chatData) {
      this.setState({ lastChatState: chatData });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state !== nextState) {
      return true;
    }

    if (this.state.lastChatState !== nextProps.getCommState().chatData) {
      return true;
    }
    else {
      return false;
    }
  }
}
