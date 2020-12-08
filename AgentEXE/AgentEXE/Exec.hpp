#pragma once

#pragma warning( disable : 4800 ) // stupid warning about bool
#define BUFSIZE 4096
HANDLE g_hChildStd_OUT_Rd = NULL;
HANDLE g_hChildStd_OUT_Wr = NULL;
HANDLE g_hChildStd_ERR_Rd = NULL;
HANDLE g_hChildStd_ERR_Wr = NULL;
string ReadFromPipe(PROCESS_INFORMATION);
string exec(const string &szCmdline) {
	SECURITY_ATTRIBUTES sa;

	// Set the bInheritHandle flag so pipe handles are inherited. 
	sa.nLength = sizeof(SECURITY_ATTRIBUTES);
	sa.bInheritHandle = TRUE;
	sa.lpSecurityDescriptor = NULL;
	// Create a pipe for the child process's STDERR. 
	if (!CreatePipe(&g_hChildStd_ERR_Rd, &g_hChildStd_ERR_Wr, &sa, 0)) {
		exit(1);
	}
	// Ensure the read handle to the pipe for STDERR is not inherited.
	if (!SetHandleInformation(g_hChildStd_ERR_Rd, HANDLE_FLAG_INHERIT, 0)) {
		exit(1);
	}
	// Create a pipe for the child process's STDOUT. 
	if (!CreatePipe(&g_hChildStd_OUT_Rd, &g_hChildStd_OUT_Wr, &sa, 0)) {
		exit(1);
	}
	// Ensure the read handle to the pipe for STDOUT is not inherited
	if (!SetHandleInformation(g_hChildStd_OUT_Rd, HANDLE_FLAG_INHERIT, 0)) {
		exit(1);
	}

	// Set the text I want to run
	PROCESS_INFORMATION piProcInfo;
	STARTUPINFO siStartInfo;
	bool bSuccessProcess = FALSE;

	// Set up members of the PROCESS_INFORMATION structure. 
	ZeroMemory(&piProcInfo, sizeof(PROCESS_INFORMATION));

	// Set up members of the STARTUPINFO structure. 
	// This structure specifies the STDERR and STDOUT handles for redirection.
	ZeroMemory(&siStartInfo, sizeof(STARTUPINFO));
	siStartInfo.cb = sizeof(STARTUPINFO);
	siStartInfo.hStdError = g_hChildStd_ERR_Wr;
	siStartInfo.hStdOutput = g_hChildStd_OUT_Wr;
	siStartInfo.dwFlags |= STARTF_USESTDHANDLES;

	// Create the child process. 
	bSuccessProcess = CreateProcess(NULL,
		(LPTSTR)szCmdline.c_str(),     // command line 
		NULL,          // process security attributes 
		NULL,          // primary thread security attributes 
		TRUE,          // handles are inherited 
		CREATE_NO_WINDOW,             // creation flags 
		NULL,          // use parent's environment 
		NULL,          // use parent's current directory 
		&siStartInfo,  // STARTUPINFO pointer 
		&piProcInfo);  // receives PROCESS_INFORMATION
	CloseHandle(g_hChildStd_ERR_Wr);
	CloseHandle(g_hChildStd_OUT_Wr);

	CloseHandle(piProcInfo.hThread);
	WaitForInputIdle(piProcInfo.hProcess, INFINITE);

	if (WaitForSingleObject(piProcInfo.hProcess, 5000) == WAIT_TIMEOUT)
	{
		if (WaitForSingleObject(piProcInfo.hProcess, 5000) == WAIT_TIMEOUT)
		{
			// application did not close in a timely manner, do something...

			// in this example, just kill it.  In a real world
			// app, you should ask the user what to do...
			TerminateProcess(piProcInfo.hProcess, 0);
		}
	}

	CloseHandle(piProcInfo.hProcess);

	DWORD dwRead;
	CHAR chBuf[BUFSIZE];
	bool bSuccess = FALSE;
	string out = "", err = "";
	for (;;) {
		bSuccess = ReadFile(g_hChildStd_OUT_Rd, chBuf, BUFSIZE, &dwRead, NULL);
		if (!bSuccess || dwRead == 0) break;

		string s(chBuf, dwRead);
		out += s;
	}
	dwRead = 0;
	for (;;) {
		bSuccess = ReadFile(g_hChildStd_ERR_Rd, chBuf, BUFSIZE, &dwRead, NULL);
		if (!bSuccess || dwRead == 0) break;

		string s(chBuf, dwRead);
		err += s;

	}

	return out;
}