#pragma once

// for convenience
using namespace std;

// For process enum, get architechture
typedef BOOL(WINAPI *LPFN_ISWOW64PROCESS) (HANDLE, PBOOL);
LPFN_ISWOW64PROCESS fnIsWow64Process;
BOOL IsWow64(HANDLE processHandle)
{
	BOOL bIsWow64 = FALSE;

	//IsWow64Process is not available on all supported versions of Windows.
	//Use GetModuleHandle to get a handle to the DLL that contains the function
	//and GetProcAddress to get a pointer to the function if available.

	fnIsWow64Process = (LPFN_ISWOW64PROCESS)GetProcAddress(
		GetModuleHandle(TEXT("kernel32")), "IsWow64Process");

	if (NULL != fnIsWow64Process)
	{
		if (!fnIsWow64Process(processHandle, &bIsWow64))
		{
			//handle error
		}
	}
	return bIsWow64;
}

//get parent pid
std::string getParentPID(DWORD pid) {
	HANDLE h = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
	PROCESSENTRY32 pe = { 0 };
	pe.dwSize = sizeof(PROCESSENTRY32);

	//assume first arg is the PID to get the PPID for, or use own PID
	string data;
	if (Process32First(h, &pe)) {
		do {
			if (pe.th32ProcessID == pid) {
				data = to_string(pe.th32ParentProcessID);
			}
		} while (Process32Next(h, &pe));
	}

	CloseHandle(h);
	return data;
}

//Get process owner
#define MAX_NAME 256
std::string GetLogonFromToken(HANDLE hToken)
{
	DWORD dwSize = MAX_NAME;
	BOOL bSuccess = FALSE;
	DWORD dwLength = 0;
	string data;
	_bstr_t strUser = "";
	_bstr_t strdomain = "";
	PTOKEN_USER ptu = NULL;
	//Verify the parameter passed in is not NULL.
	if (NULL == hToken)
		goto Cleanup;

	if (!GetTokenInformation(
		hToken,         // handle to the access token
		TokenUser,    // get information about the token's groups 
		(LPVOID)ptu,   // pointer to PTOKEN_USER buffer
		0,              // size of buffer
		&dwLength       // receives required buffer size
	))
	{
		if (GetLastError() != ERROR_INSUFFICIENT_BUFFER)
			goto Cleanup;

		ptu = (PTOKEN_USER)HeapAlloc(GetProcessHeap(),
			HEAP_ZERO_MEMORY, dwLength);

		if (ptu == NULL)
			goto Cleanup;
	}

	if (!GetTokenInformation(
		hToken,         // handle to the access token
		TokenUser,    // get information about the token's groups 
		(LPVOID)ptu,   // pointer to PTOKEN_USER buffer
		dwLength,       // size of buffer
		&dwLength       // receives required buffer size
	))
	{
		goto Cleanup;
	}
	SID_NAME_USE SidType;
	char lpName[MAX_NAME];
	char lpDomain[MAX_NAME];

	if (!LookupAccountSid(NULL, ptu->User.Sid, lpName, &dwSize, lpDomain, &dwSize, &SidType))
	{
		DWORD dwResult = GetLastError();
		if (dwResult == ERROR_NONE_MAPPED)
			strcpy(lpName, "NONE_MAPPED");
		else
		{
			data = "LookupAccountSid Error.";
		}
	}
	else
	{
		printf("Current user is  %s\\%s\n",
			lpDomain, lpName);
		strUser = lpName;
		strdomain = lpDomain;
		data = strdomain + "\\\\" + strUser;
	}

Cleanup:

	if (ptu != NULL)
		HeapFree(GetProcessHeap(), 0, (LPVOID)ptu);
	return data;
}

std::string PrintProcessNameAndID(DWORD processID)
{
	TCHAR szProcessName[MAX_PATH] = TEXT("<unknown>");

	// Get a handle to the process.

	HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION |
		PROCESS_VM_READ,
		FALSE, processID);

	string osArch;
	if (!IsWow64(GetCurrentProcess())) {
#if defined(_WIN64)
		osArch = "64";
#elif defined(_WIN32)
		osArch = "32";
#endif
	}

	string arch;
	if (IsWow64(hProcess)) {
		arch = "32";
	}
	else if (!IsWow64(hProcess) and osArch == "32") {
		arch = "32";
	}
	else {
		arch = "64";
	}

	string ppid = getParentPID(processID);

	HANDLE hToken = NULL;
	string user = "<unknown>";
	if (OpenProcessToken(hProcess, TOKEN_QUERY, &hToken))
	{
		user = GetLogonFromToken(hToken);
		CloseHandle(hToken);
	}

	// Get the process name.

	if (NULL != hProcess)
	{
		HMODULE hMod;
		DWORD cbNeeded;

		if (EnumProcessModules(hProcess, &hMod, sizeof(hMod),
			&cbNeeded))
		{
			GetModuleBaseName(hProcess, hMod, szProcessName,
				sizeof(szProcessName) / sizeof(TCHAR));
		}
	}

	// Print the process name and identifier.

	// Release the handle to the process.

	CloseHandle(hProcess);

	//string data = TEXT("%s  (PID: %u:)\n"), szProcessName, processID;
	string name = szProcessName;
	string pid = to_string(processID);
	string data = "PPID:" + ppid + " PID:" + pid + " PROCNAME:" + name + " OWNER:" + user + " ARCH:" + arch;
	return data;
}

std::string list_running_processes(void) {
	DWORD aProcesses[1024], cbNeeded, cProcesses;
	unsigned int i;

	if (!EnumProcesses(aProcesses, sizeof(aProcesses), &cbNeeded))
	{
		return "1";
	}

	// Calculate how many process identifiers were returned.

	cProcesses = cbNeeded / sizeof(DWORD);

	// Print the name and process identifier for each process.
	vector<string> procs;
	for (i = 0; i < cProcesses; i++)
	{
		if (aProcesses[i] != 0)
		{
			string data = PrintProcessNameAndID(aProcesses[i]);
			procs.push_back(data);
		}
	}
	std::string result;
	for (auto const& s : procs) { result += s + '\n'; }
	return result;
}
//End Process Enum