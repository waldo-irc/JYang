if [ -z $1 ]; then
	echo "[X] Must provide a binary to hex."
	exit 0
fi

hexdump -e '12/1 " 0x%02X," "\n"' $1 -v
wc -c < $1
