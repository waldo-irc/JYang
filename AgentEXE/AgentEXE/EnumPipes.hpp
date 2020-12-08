#pragma once

vector<string> EnumeratePipes()
{
	WIN32_FIND_DATA FindFileData;
	HANDLE hFind;
	vector<string> pipes;

#define TARGET_PREFIX "//./pipe/"
	const char *target = TARGET_PREFIX "*";

	memset(&FindFileData, 0, sizeof(FindFileData));
	hFind = FindFirstFileA(target, &FindFileData);
	if (!(hFind == INVALID_HANDLE_VALUE))
	{
		do
		{
			pipes.push_back(FindFileData.cFileName);
		} while (FindNextFile(hFind, &FindFileData));

		FindClose(hFind);
	}
#undef TARGET_PREFIX
	return pipes;
}