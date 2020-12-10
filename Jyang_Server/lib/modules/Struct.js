
const BUFF_BY_LENGTH = {
	1: Uint8Array,
	2: Uint16Array,
	4: Uint32Array
};

class Struct {
	constructor(buffer, type, offset, length) {
		this.buffer = buffer;
		this.offset = offset;
		this.length = length;
		this.useComputedLength = (length === undefined);
		this.computedLength = 0;
		this.fields = this.f = {};

		if (typeof type === 'object') {
			this.type = 'struct';
			this.setFields(type);
		}
		else {
			this.type = type;
		}
	}

	setFields(fields) {
		for (let key in fields)
			this.setField(key, fields[key]);
	}

	setField(key, field) {
		if (typeof field === 'number') {
			return this.setField(key, {
				type: 'uint',
				offset: this.computedLength,
				length: field
			});
		}

		if (typeof field === 'object') {
			let { offset, length, type } = field;
			if (type === undefined) type = 'uint';
			if (offset === undefined) offset = this.computedLength;
			if (length === undefined && type !== 'struct') length = 1;

			offset += this.offset;

			if (length === 'nullterm') {
				const view = new Uint8Array(this.buffer, offset);
				for (length = 0; view[length] !== 0; )
					length++;
			}

			this.fields[key] = new Struct(this.buffer, type, offset, length);

			const fieldEnd = offset + length;
			if (fieldEnd > this.offset + this.computedLength) {
				this.computedLength = fieldEnd - this.offset;
				if (this.useComputedLength)
					this.length = this.computedLength;
			}
		}
	}

	values() {
		const { buffer, type, fields, offset, length } = this;
		if (type === 'array') {
			const values = {};
			Object.keys(fields).forEach(k => {
				values[k] = fields[k].values();
			});
			return values;
		}
		if (type === 'struct') {
			const values = {};
			Object.keys(fields).forEach(k => {
				values[k] = fields[k].values();
			});
			return values;
		}
		if (type === 'uint') {
			return (new (BUFF_BY_LENGTH[length] || Uint8Array)(buffer, offset, length))[0];
		}
		if (type === 'utf8') {
			return String.fromCharCode.apply(null, new Uint8Array(buffer, offset, length));
		}
		if (type === 'bin') {
			return new Uint8Array(buffer, offset, length);
		}
	}
}

module.exports = { Struct };
