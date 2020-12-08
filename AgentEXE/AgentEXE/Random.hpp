#pragma once

string random_string(size_t length)
{
	const char* charmap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
	const size_t charmapLength = strlen(charmap);
	auto generator = [&]() { return charmap[rand() % charmapLength]; };
	string result;
	result.reserve(length);
	generate_n(back_inserter(result), length, generator);
	return result;
}