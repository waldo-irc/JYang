#pragma once

using namespace std;

string encryptDecrypt(const string &toEncrypt) {
	char key[15] = { 'f', 'C', 'q', 'Z', 'z', '2', '6', '!', 'z', '@', 'P', 'p', 'p', 'Z', '9' }; //Any chars will work
	string output = toEncrypt;

	for (int i = 0; i < toEncrypt.size(); i++)
		output[i] = toEncrypt[i] ^ key[i % (sizeof(key) / sizeof(char))];

	return output;
}