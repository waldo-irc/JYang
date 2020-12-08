#pragma once

DWORD WINAPI CreateMessageBox(LPVOID lpParam) {
	MessageBoxA(NULL, (char*)lpParam, "", MB_OK);
	VirtualFree(lpParam, 0, MEM_RELEASE);
	return 0;
};