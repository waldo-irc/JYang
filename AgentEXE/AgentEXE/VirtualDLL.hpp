#pragma once

struct cmp_str
{
	bool operator()(char const *a, char const *b) const
	{
		return std::strcmp(a, b) < 0;
	}
};

class VirtualDll {
public:
	UINT_PTR ptr;
	std::map<const char*, FARPROC, cmp_str> functions;
	VirtualDll() {};

	UINT_PTR getOrLoad(LPSTR dll) {
		if (ptr) return ptr;
		return load(dll);
	}

	UINT_PTR getOrLoadBase64(string b64dll) {
		return getOrLoad(const_cast<char*>(base64_decode(b64dll).c_str()));
	}

	UINT_PTR load(LPSTR dll) {
		ptr = LoadLibraryR(dll);
		return ptr;
	}

	void unload() {
		// TODO: Find a way to unload DLLs.
	}

	bool isLoaded() {
		return ptr != 0;
	}

	FARPROC operator [] (const char* fn) {
		if (functions.find(fn) != functions.end())
			return functions.at(fn);
		FARPROC addr = GetProcAddressR(ptr, fn);
		functions.insert(std::make_pair(fn, addr));
		return addr;
	}

	FARPROC operator [] (char* fn) {
		return operator[]((const char*)fn);
	}
};