#pragma once
#define PROC_THREAD_ATTRIBUTE_PARENT_PROCESS 0x00020000
#define PROC_THREAD_ATTRIBUTE_NUMBER   0x0000ffff
#define PROC_THREAD_ATTRIBUTE_THREAD   0x00010000
#define PROC_THREAD_ATTRIBUTE_INPUT    0x00020000
#define PROC_THREAD_ATTRIBUTE_HANDLE_LIST ( 2 | PROC_THREAD_ATTRIBUTE_INPUT)
#define PROC_THREAD_ATTRIBUTE_IDEAL_PROCESSOR ( 5 | 0x00020000 | PROC_THREAD_ATTRIBUTE_THREAD | PROC_THREAD_ATTRIBUTE_INPUT)

//The Magic below is used to support Windows XP.
bool _trace(const char *format, ...);
#define TRACE _trace

bool _trace(const char *format, ...)
{
	TCHAR buffer[1000];

	va_list argptr;
	va_start(argptr, format);
	wvsprintf(buffer, format, argptr);
	va_end(argptr);

	OutputDebugString(buffer);

	return true;
}

struct proc_thread_attr
 {
	DWORD_PTR attr;
	SIZE_T size;
	void *value;
	};

struct _PROC_THREAD_ATTRIBUTE_LIST
 {
	DWORD mask;  /* bitmask of items in list */
	DWORD size;  /* max number of items in list */
	DWORD count; /* number of items in list */
	DWORD pad;
	DWORD_PTR unk;
	struct proc_thread_attr attrs[1];
	};

BOOL WINAPI InitializeProcThreadAttributeList(struct _PROC_THREAD_ATTRIBUTE_LIST *list,
	DWORD count, DWORD flags, SIZE_T *size)
	 {
	SIZE_T needed;
	BOOL ret = FALSE;
	
		TRACE("(%p %d %x %p)\n", list, count, flags, size);
	
		needed = FIELD_OFFSET(struct _PROC_THREAD_ATTRIBUTE_LIST, attrs[count]);
	if (list && *size >= needed)
		 {
		list->mask = 0;
		list->size = count;
		list->count = 0;
		list->unk = 0;
		ret = TRUE;
		}
	else
		 SetLastError(ERROR_INSUFFICIENT_BUFFER);
	
		*size = needed;
	return ret;
	}

BOOL WINAPI UpdateProcThreadAttribute(struct _PROC_THREAD_ATTRIBUTE_LIST *list,
	DWORD flags, DWORD_PTR attr, void *value, SIZE_T size,
	void *prev_ret, SIZE_T *size_ret)
	 {
	DWORD mask;
	struct proc_thread_attr *entry;
	
		TRACE("(%p %x %08lx %p %ld %p %p)\n", list, flags, attr, value, size, prev_ret, size_ret);
	
		if (list->count >= list->size)
		 {
		SetLastError(ERROR_GEN_FAILURE);
		return FALSE;
		}
	
		switch (attr)
		{
		case PROC_THREAD_ATTRIBUTE_PARENT_PROCESS:
			if (size != sizeof(HANDLE))
				 {
				SetLastError(ERROR_BAD_LENGTH);
				return FALSE;
				}
			break;
			
		case PROC_THREAD_ATTRIBUTE_HANDLE_LIST:
			if ((size / sizeof(HANDLE)) * sizeof(HANDLE) != size)
				 {
				SetLastError(ERROR_BAD_LENGTH);
				return FALSE;
				}
			break;
			
		case PROC_THREAD_ATTRIBUTE_IDEAL_PROCESSOR:
			if (size != sizeof(PROCESSOR_NUMBER))
				 {
				SetLastError(ERROR_BAD_LENGTH);
				return FALSE;
				}
			break;
			
		default:
			SetLastError(ERROR_NOT_SUPPORTED);
			return FALSE;
			}
	
		mask = 1 << (attr & PROC_THREAD_ATTRIBUTE_NUMBER);
	
		if (list->mask & mask)
		 {
		SetLastError(ERROR_OBJECT_NAME_EXISTS);
		return FALSE;
		}
	
		list->mask |= mask;
	
		entry = list->attrs + list->count;
	entry->attr = attr;
	entry->size = size;
	entry->value = value;
	list->count++;
	
		return TRUE;
	}

typedef struct _STARTUPINFOEX {
	STARTUPINFO                 StartupInfo;
	LPPROC_THREAD_ATTRIBUTE_LIST lpAttributeList;
} STARTUPINFOEX, *LPSTARTUPINFOEX;

/*Begin sac process*/
DWORD GetProcessByName(void)
{
	PROCESSENTRY32 entry;
	entry.dwSize = sizeof(PROCESSENTRY32);

	HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, NULL);

	if (Process32First(snapshot, &entry) == TRUE)
	{
		while (Process32Next(snapshot, &entry) == TRUE)
		{
			if (_stricmp(entry.szExeFile, "explorer.exe") == 0)
			{
				HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, entry.th32ProcessID);

				CloseHandle(snapshot);
				DWORD process_pid = GetProcessId(hProcess);
				CloseHandle(hProcess);
				return process_pid;
			}
		}
	}
}

BOOL CurrentProcessAdjustToken(void)
{
	HANDLE hToken;
	TOKEN_PRIVILEGES sTP;

	if (OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, &hToken))
	{
		if (!LookupPrivilegeValue(NULL, SE_DEBUG_NAME, &sTP.Privileges[0].Luid))
		{
			CloseHandle(hToken);
			return FALSE;
		}
		sTP.PrivilegeCount = 1;
		sTP.Privileges[0].Attributes = SE_PRIVILEGE_ENABLED;
		if (!AdjustTokenPrivileges(hToken, 0, &sTP, sizeof(sTP), NULL, NULL))
		{
			CloseHandle(hToken);
			return FALSE;
		}
		CloseHandle(hToken);
		return TRUE;
	}
	return FALSE;
}

static DWORD startSacProcess(string arch, string ppidCheck, string sac64, string sac32)
{
	PROCESS_INFORMATION pi = { 0 };
	STARTUPINFOEX sie = { sizeof(sie) };
	SIZE_T cbAttributeListSize = 0;
	PPROC_THREAD_ATTRIBUTE_LIST pAttributeList = NULL;
	HANDLE hParentProcess = NULL;

	InitializeProcThreadAttributeList(NULL, 1, 0, &cbAttributeListSize);
	pAttributeList = (PPROC_THREAD_ATTRIBUTE_LIST)HeapAlloc(GetProcessHeap(), 0, cbAttributeListSize);

	InitializeProcThreadAttributeList(pAttributeList, 1, 0, &cbAttributeListSize);

	CurrentProcessAdjustToken();
	int ppid;
	if (ppidCheck == "default") {
		ppid = GetProcessByName();
	}
	else {
		ppid = stoi(ppidCheck);
	}
	hParentProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, ppid);

	UpdateProcThreadAttribute(pAttributeList, 0, PROC_THREAD_ATTRIBUTE_PARENT_PROCESS, &hParentProcess, sizeof(HANDLE), NULL, NULL);

	sie.lpAttributeList = pAttributeList;

	if (arch == "32") {
		if (CreateProcess(sac32.c_str(), LPSTR(""), NULL, NULL, TRUE, CREATE_SUSPENDED | EXTENDED_STARTUPINFO_PRESENT, NULL, NULL, &sie.StartupInfo, &pi))
		{
			CloseHandle(pi.hThread);
			return GetProcessId(pi.hProcess);
		}
	}
	else if (arch == "64") {
		if (CreateProcess(sac64.c_str(), LPSTR(""), NULL, NULL, TRUE, CREATE_SUSPENDED | EXTENDED_STARTUPINFO_PRESENT, NULL, NULL, &sie.StartupInfo, &pi))
		{
			CloseHandle(pi.hThread);
			return GetProcessId(pi.hProcess);
		}
	}
	return NULL;
}
/*End Sac Process*/