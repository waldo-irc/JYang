#pragma once

//LS
std::string get_all_files_names_within_folder(string folder)
{
	vector<string> names;
	string search_path = folder + "/*.*";
	WIN32_FIND_DATA fd;
	HANDLE hFind = ::FindFirstFile(search_path.c_str(), &fd);
	if (hFind != INVALID_HANDLE_VALUE) {
		do {
			names.push_back(fd.cFileName);
		} while (::FindNextFile(hFind, &fd));
		::FindClose(hFind);
	}
	std::string result;
	for (auto const& s : names) { result += s + '\n'; }

	return result;
}
//END LS