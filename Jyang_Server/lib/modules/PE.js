
const { Struct } = require('./Struct');

const COFF_HEADER = {
	Machine: 2,
	NumberOfSections: 2,
	TimeDateStamp: 4,
	PointerToSymbolTable: 4,
	NumberOfSymbols: 4,
	SizeOfOptionalHeader: 2,
	Characteristics: 2
};
const OPTIONAL_HEADER = {
	Magic: 2,
	MajorLinkerVersion: 1,
	MinorLinkerVersion: 1,
	SizeOfCode: 4,
	SizeOfInitializedData: 4,
	SizeOfUninitializedData: 4,
	AddressOfEntryPoint: 4,
	BaseOfCode: 4
};
const SECTION_HEADER = {
	Name: { type: 'utf8', length: 8 },
	VirtualSize: 4,
	VirtualAddress: 4,
	SizeOfRawData: 4,
	PointerToRawData: 4,
	PointerToRelocations: 4,
	PointerToLinenumbers: 4,
	NumberOfRelocations: 2,
	NumberOfLinenumbers: 2,
	Characteristics: 4
};

class PE {
	constructor(buffer) {
		const peOff = (new Uint32Array(buffer, 0x3c, 1))[0];

		const coff = new Struct(buffer, COFF_HEADER, peOff+4);
		const coffv = coff.values();

		const opt = new Struct(buffer, OPTIONAL_HEADER,
			coff.offset + coff.length,
			coffv.SizeOfOptionalHeader);

		const sects = new Array(coffv.NumberOfSections);
		for (let i=0; i<sects.length; i++)
			sects[i] = new Struct(buffer, SECTION_HEADER,
				opt.offset + opt.length + i*40);

		this.coff = coff;
		this.opt = opt;
		this.sects = sects;
	}

	values() {
		return {
			coff: this.coff.values(),
			opt: this.opt.values(),
			sects: this.sects.map(x=>x.values())
		};
	}

	static from(buffer) {
		if (!buffer) return;
		if (0x3c+4 > buffer.byteLength) return;
		const peOff = (new Uint32Array(buffer, 0x3c, 1))[0];
		if (peOff+4 > buffer.byteLength) return;
		const pe = (new Uint32Array(buffer, peOff, 1))[0];
		if (pe !== 17744) return;
		return new PE(buffer);
	}
}

module.exports = { PE };
