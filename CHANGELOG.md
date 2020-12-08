# Changelog-Dev
## 12/18/2019
* Fixes

## 12/13/2019
* Added sleep to agentsmenu panel
* Fixed container in agentspanel
* Theming now exists
* Included version in client and server

## 12/05/2019
* Fixed issue where duplicate outputs weren't appearing in AgentsMenuPanel
* Agent Hardening
* Added agent options for inject type, ppid set, sac process set for 64 and 32

## 12/04/2019
* Added default value to "sleep" prompt
* Added drag and drop & select dll inject uploads
* Added drawer btns for all 64 bit agents
* Added shellcode injector
* Added staged shellcode/bin files
* Disabled Client React Tests for now, fails when it shouldn't?

## 12/03/2019
* Fixed issue in chat where typing re-rendered the output, this has improved performance.
* Fixed drawer click in mobile
* Changed icon for starting http listener
* Added bytes returned to agent output
* Added "sleep" to context menu
* Interact in context menu now opens windows for all highlighted agents
* Added checks for listener to throw errors if anything fails instead of exiting out
* Added loading animation to listener and power icon
* We now check if upx exists and upx pack the binary if it does
* Lowered starting height of chat to give more room for agents panel
* Added a box shadow to chat panel


## 12/01/2019
* Optimization fixes across every panel
* New Agent Download Button
* Fixed drawer issues
* Fixed http listener issues

## 11/28/2019
* Added new context menu!
* Added selected table row highlighting
* Added back agent UUID
* Removed the "remove" column in client table as the new context menu replaces it
* Fixed agent in agents.js where it doesnt check if a file exists for an agent before removing
* Shift select multiple agents
* Enhanced right click menu, run against multiple agents if selected or single if not

## 11/27/2019
* Added drawer instead of constant sidebar
* Fixed users panel to remove green circle from Users text
* Added new drawer shortcuts
* Performance Improvements

## 11/26/2019
* Agents Menu now shows help alphabetically
* Agents Menu right click now toggles a single click scroll
* clearQueue command added to clear current agent commands in queue
* listQueue command added to list all commands for an agent in a queue
* Added proper word wrap to chat and agents menu
* Chat now does word-wrap in its input as well
* Added color coding to chat messages
* Added logged in users to the chat
* Adjusted failed to login error to distinguish between a taken nick and bad password
* Added functionality to client to save last connection data if exists
* Added small notifier at bottom right of agent menu to track whether scrolling is enabled
* Added connections management to login screen
* General small fixes

## 11/21/2019
* Added Pipeline
* Pushed to git