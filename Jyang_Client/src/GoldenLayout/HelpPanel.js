import React from "react";

export class HelpPanel extends React.Component {
  render() {
    return (
      <div id="agenthelp" className="scrollable-noflex">
        <hr />
        <h3>Agent Help</h3>
        <hr />
        <h4>EXE</h4>
        <p>The agent EXE runs from Windows XP to Windows 10.  Simply double click the unstaged EXE to run it.</p>
        <h4>DLL</h4>
        <p>The agent DLL runs from Windows XP to Windows 10. The agent DLL exports main() and uses that for execution, NOT dllmain, this is accomplished in the agent using sRDI.  Reflectively injecting this dll requires calling "main".  Compatible with rundll32.exe EX: rundll32.exe AgentDLL.dll,main</p>
        <h4>Linux/Mac</h4>
        <p>This Linux and Mac agent is a fairly straightforward python script.  No additional dependences other than Python should be required.  Both Python 2 and 3 should be supported.  The unstaged version is setup to just run.</p>
        <p>Recommended execution method: nohup python3 run.py > /dev/null 2>&1 &</p>
        <hr />
        <h3>Client Help</h3>
        <hr />
        <h4>Agent Panel</h4>
        <ul>
          <li>* Clicking an element selects it for the context menu.</li>
          <li>* Most actions in the context menu will apply to multiple selections, certain actions such as "interact" will only apply to the currently selected row.</li>
          <li>* If no rows are selected then all actions will apply only to the row right clicked on.</li>
          <li>* Selecting shift will highlight all rows from the bottommost to the topmost selected.</li>
          <li>* Hitting esc or clicking off the table in the pane will deselect all selections.</li>
        </ul>
        <h4>Agents</h4>
        <ul>
          <li>* Last agent checkin is obtained by subtracting client time from the servers timestamp.  As a result, if server or client are off there will be discrepencies.</li>
          <li>* You can interact with an agent by double clicking it, dragging the panel and docking it, or right clicking it and selectin "Interact".</li>
          <li>* Type "help" for a list of agent commands.  Type "help [command]" to get additional information about a command.</li>
          <li>* Click the panel to scroll down, click again when the input is in view to focus on it.  Right click to disable this feature in order to select text and right click again to re-enable it.  An asterisk will denote whether it is enabled or not.</li>
        </ul>
        <h4>Chat</h4>
        <ul>
          <li>* There is only 2 commands right now, /help and /clear.  Even these may be removed later, why did I do this? Anyways, each is self-explanatory.</li>
          <li>* User panel on left shows logged in users.</li>
          <li>* Chat shows basic log data as well.  Agent connectbacks and exits as well as user connects and exits are all recorded.  Exists are red, new connections are blue.</li>
          <li>* Only 1 user with a nick can login at a type.  Nicks are case sensitive so "hello" and "Hello" can both login at the same time.</li>
        </ul>
      </div>
      
    );
  }
}
