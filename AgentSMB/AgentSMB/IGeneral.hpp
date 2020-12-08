#pragma once

//RTL Declartion, NTDLL.LIB
typedef struct _CLIENT_ID
{
	PVOID UniqueProcess;
	PVOID UniqueThread;
} CLIENT_ID, * PCLIENT_ID;

EXTERN_C LONG WINAPI RtlCreateUserThread(HANDLE,
	PSECURITY_DESCRIPTOR,
	BOOLEAN, ULONG,
	PULONG, PULONG,
	PVOID, PVOID,
	PHANDLE, PCLIENT_ID);

//Convert a bool to a string
inline const char* const BoolToString(bool b)
{
	return b ? "true" : "false";
}

//Get the self process arch
string getHostProcessArch(BOOL HostProc)
{
	string osArch;
	if (!HostProc) {
#if defined(_WIN64)
		return "64";
#elif defined(_WIN32)
		return "32";
#endif
	}
}

//Get the remote process arch
string getRemoteProcessArch(BOOL RemoteProc, string osArch)
{
	if (RemoteProc)
	{
		return "32";
	}
	else if (!RemoteProc and osArch == "32")
	{
		return "32";
	}
	else
	{
		return "64";
	}
}

//Check for 32 bit or 64 bit
BOOL EnvironmentCheck(HANDLE hproc)
{
	BOOL f64 = FALSE;
	IsWow64Process(hproc, &f64) && f64;
	return f64;
}

//Check if current process can inject into remote process
string CheckProcEnv(BOOL RemoteProc, BOOL HostProc)
{
	if (RemoteProc == false and HostProc == true)
	{
		return encryptDecrypt(base64_decode("PW4sej9cQEgILz4dFTRNRi4YKRdTQkISbnBQMztXQTdRNh9EU1MbJzVQEXoPUmMTMw4SRlMVIzUDA3pfFCwcehsSBRNaIjkEUDJWFTdRKghdVUQJM34="));
	}

	return "true";
}

//Check if DLL is valid for process
string CheckDLLEnv(string procArch, string arch)
{
	if (procArch == "64" and arch == "32")
	{
		return encryptDecrypt(base64_decode("PW4sei5AT0gUJ3AEH3pVAzUUKBtVUwEbYGNCUDhQEmM1FjYSX08OL3ARUGwNRiEYLlpAU0wVNDVQAChWBSYCKVYSQkkTM3AHHzQeEmMGNQhZGA=="));
	}

	if (procArch != arch)
	{
		return encryptDecrypt(base64_decode("PW4sei5AT0gUJ3AEH3pVAzUUKBtVUwEbYGZEUDhQEmM1FjYSX08OL3ARUGkLRiEYLlpAU0wVNDVQAChWBSYCKVYSQkkTM3AHHzQeEmMGNQhZGA=="));
	}

	return "true";
}

//Piece everything together and perform all the checks
string FullProcCheck(HANDLE hproc, const string& arch)
{
	BOOL RemoteProc = EnvironmentCheck(hproc);
	BOOL HostProc = EnvironmentCheck(GetCurrentProcess());
	string firstCheck = CheckProcEnv(RemoteProc, HostProc);
	if (firstCheck != "true") {
		return firstCheck;
	}

	string osArch = getHostProcessArch(HostProc);
	string procArch = getRemoteProcessArch(RemoteProc, osArch);
	string dllCheck = CheckDLLEnv(procArch, arch);
	if (dllCheck != "true") {
		return dllCheck;
	}

	return "true";
}

//Additional Notes and comments regarding DLL Injection Below

//Load a file locally for testing
//HMODULE ntdll = LoadLibrary("ntdll.dll");
//The below is for loading a file
/*
FILE *dll_open;
dll_open = fopen("C:\\Users\\IEUser\\Desktop\\reflective_dll.x64.bin", "rb");
fseek(dll_open, 0, SEEK_END);
size_t size = ftell(dll_open);
rewind(dll_open);

const size_t BUFFERSIZE = 256;
const size_t ELEMSIZE = sizeof(char);
char* buffer = new char[BUFFERSIZE * ELEMSIZE];

BYTE* dll = (BYTE*)malloc(size);
BYTE* dll_off = dll;
size_t bytes;
while ((bytes = fread(buffer, ELEMSIZE, BUFFERSIZE, dll_open)) > 0) {
	memcpy(dll_off, buffer, bytes);
	dll_off += bytes;
}
*/

//LoadLibraryA Manually!
//void *_loadLibrary = GetProcAddress(LoadLibraryA("kernel32.dll"), "LoadLibraryA");