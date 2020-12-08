#pragma once

string injectContext(int pid, const char* dll, size_t size, const string &arch) {
	char currentDir[MAX_PATH];
	SIZE_T bytesWritten = 0;
	HANDLE threadHandle;

	HANDLE hproc = OpenProcess(PROCESS_ALL_ACCESS, false, pid);
	if (hproc == INVALID_HANDLE_VALUE) {
		return "[-] Error: Could not open process";
	}

	string check = FullProcCheck(hproc, arch);
	if (check != "true") {
		return check;
	}

	void *alloc = VirtualAllocEx(hproc, 0, (SIZE_T)size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);

	void *_loadLibrary = LoadLibraryA;

	WriteProcessMemory(hproc, alloc, dll, size, &bytesWritten);

	DWORD oldProtect = 0;
	VirtualProtectEx(hproc, alloc, size, PAGE_EXECUTE_READ, &oldProtect);

	RtlCreateUserThread(hproc, NULL, true, 0, 0, 0, (LPTHREAD_START_ROUTINE)_loadLibrary, NULL, &threadHandle, NULL);

	// Get the current registers set for our thread
	CONTEXT ctx;
	ZeroMemory(&ctx, sizeof(CONTEXT));
	ctx.ContextFlags = CONTEXT_CONTROL;
	GetThreadContext(threadHandle, &ctx);
#ifdef _M_IX86
	ctx.Eip = (DWORD64)alloc;
#elif defined(_M_AMD64)
	ctx.Rip = (DWORD64)alloc;
#endif
	SetThreadContext(threadHandle, &ctx);
	ResumeThread(threadHandle);
	return "[+] Success";
}