#pragma once

//PWD
std::string workingdir()
{
	char buf[256];
	GetCurrentDirectoryA(256, buf);
	return std::string(buf) + '\\';
}
//END PWD