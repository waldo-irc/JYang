#pragma once

#ifdef _DEBUG
	typedef string(__stdcall *customFunction)(string);
#endif
typedef string(__stdcall *pFunctions)(string command);
typedef wchar_t *(__stdcall *mFunctions)(LPCWSTR command);