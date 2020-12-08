#pragma once

string inject(DWORD pid, const char* dll, size_t size, const string &arch)
{

	HANDLE hproc = OpenProcess(
		PROCESS_CREATE_THREAD | PROCESS_VM_OPERATION |
		PROCESS_VM_WRITE,
		FALSE, 
		pid
	);

	string check = FullProcCheck(hproc, arch);
	if (check != "true") {
		return check;
	}

	HANDLE addr = VirtualAllocEx(hproc, NULL, (SIZE_T)size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);

	WriteProcessMemory(hproc, addr, dll, size, NULL);

	DWORD oldProtect = 0;
	VirtualProtectEx(hproc, addr, size, PAGE_EXECUTE_READ, &oldProtect);

	HANDLE hRemoteThread;
	RtlCreateUserThread(hproc, NULL, 0, 0, 0, 0, (PVOID)addr, NULL, &hRemoteThread, NULL);

	return "[+] Success";
}