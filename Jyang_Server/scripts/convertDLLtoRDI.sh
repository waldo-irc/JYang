#!/bin/bash
if [ -z $1 ]; then
    echo "[X] Must provide a dll to convert!"
    echo "[USAGE] $0 DLL function(OPTIONAL)"
    exit 0
fi
if [ -z $2 ]; then
    function="main"
else
    function=$2
fi
echo "[*] Calling second function: $function"
python3 ../lib/pythonModules/sRDI/ConvertToShellcode.py $1 -f $function -c