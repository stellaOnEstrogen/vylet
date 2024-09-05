interface UUIDOptions {
	version: 1 | 4;
}

function getRandomValues(buffer: Uint8Array): Uint8Array {
	for (let i = 0; i < buffer.length; i++) {
		buffer[i] = Math.floor(Math.random() * 256);
	}
	return buffer;
}

function uuidV4(): string {
	const rnds = new Uint8Array(16);
	getRandomValues(rnds);

	// Set bits for version and `clock_seq_hi_and_reserved`
	rnds[6] = (rnds[6] & 0x0f) | 0x40;
	rnds[8] = (rnds[8] & 0x3f) | 0x80;

	const hexArray = [...rnds].map((b) => b.toString(16).padStart(2, '0'));
	return `${hexArray.slice(0, 4).join('')}-${hexArray.slice(4, 6).join('')}-${hexArray.slice(6, 8).join('')}-${hexArray.slice(8, 10).join('')}-${hexArray.slice(10, 16).join('')}`;
}

function uuidV1(): string {
	const now = new Date().getTime();
	const uuidEpoch = Date.UTC(1582, 9, 15);
	const timestamp = BigInt(now - uuidEpoch) * BigInt(10000); // Convert milliseconds to 100-ns intervals

	const timeLow = (timestamp & BigInt(0xffffffff))
		.toString(16)
		.padStart(8, '0');
	const timeMid = ((timestamp >> BigInt(32)) & BigInt(0xffff))
		.toString(16)
		.padStart(4, '0');
	const timeHighAndVersion = (
		((timestamp >> BigInt(48)) & BigInt(0x0fff)) |
		BigInt(0x1000)
	)
		.toString(16)
		.padStart(4, '0');

	const clockSeq = getRandomValues(new Uint8Array(2));
	clockSeq[0] = (clockSeq[0] & 0x3f) | 0x80; // variant 1

	const clockSeqHex = [...clockSeq]
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// For simplicity, generate a random 48-bit node ID
	const node = getRandomValues(new Uint8Array(6));
	const nodeHex = [...node]
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return `${timeLow}-${timeMid}-${timeHighAndVersion}-${clockSeqHex}-${nodeHex}`;
}

export function uuid({ version }: UUIDOptions): string {
	if (version === 1) {
		return uuidV1();
	} else if (version === 4) {
		return uuidV4();
	} else {
		throw new Error('Unsupported UUID version');
	}
}
