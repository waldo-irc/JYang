import fs from 'fs';
import replace from 'buffer-replace';
import {execSync} from 'child_process';
import commandExists from 'command-exists';

export default class ListenerPrepBinaries {
    constructor() {
        this.portString='2eb9c9299ecd7a1d6e9e2f724aa7cf66'
		this.httpsString='1a94d25ca9c5ff229b3f609d8f976b0b'
        this.hostString='ec450b1fcbd2f6cecefcfc4cae52284b'
        this.smbString='ec450b1fcbd2f6cecefcfc4cae52284b'
    }

    nullCalc(item1, item2) {
        const length1 = item1.length;
        const length2 = item2.length;
        let diff = length1 - length2;
        if (diff > 0) {
            const final2 =item2+("\x00".repeat(diff));
            return final2;
        }
        else if (diff === 0) {
            return item2;
        }
    }

    editBinaryHTTP(host, port, https, filename, newFilename, platform="windows") {
        let f=fs.readFileSync(filename);
        if (platform === "windows") {
            let s = replace(f, this.portString, this.nullCalc(this.portString,port));
            s = replace(s, this.httpsString, this.nullCalc(this.httpsString,https));
            s = replace(s, this.hostString, this.nullCalc(this.hostString,host));
            fs.writeFileSync(newFilename, s);
            console.log("[+] Staging HTTP: "+newFilename);
            if (newFilename.includes(".exe")) {
                var commandExistsSync = require('command-exists').sync;
                // returns true/false; doesn't throw
                if (commandExistsSync('upx')) {
                    // proceed
                    console.log("[+] UPX is installed, packing: "+newFilename);
                    //execSync("upx --ultra-brute --compress-icons=0 --nrv2d --crp-ms=999999 "+newFilename);
                } else {
                    // ...
                    console.log("[-] UPX Not installed, skipping packing: "+newFilename);
                }
            }
        }
        else {
            let s = replace(f, this.portString, port);
            s = replace(s, this.httpsString, https);
            s = replace(s, this.hostString, host);
            fs.writeFileSync(newFilename, s);
        }
    }

    editBinarySMB(pipe, filename, newFilename) {
        let f=fs.readFileSync(filename);

        console.log("[+] Staging SMB: "+newFilename);
        let s = replace(f, this.smbString, this.nullCalc(this.smbString,pipe));
        fs.writeFileSync(newFilename, s);
    }
}
