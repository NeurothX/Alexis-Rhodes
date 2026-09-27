const fs = require("fs"); const path = require("path");
const rate = 22050, seconds = .32, samples = Math.floor(rate * seconds), data = Buffer.alloc(samples * 2);
for (let i = 0; i < samples; i++) { const t = i / rate; const f = t < .16 ? 880 : 1320; const envelope = Math.max(0, 1 - t / seconds); data.writeInt16LE(Math.round(Math.sin(2 * Math.PI * f * t) * 9000 * envelope), i * 2); }
const header = Buffer.alloc(44); header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4); header.write("WAVEfmt ", 8); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(data.length, 40);
const output = path.join(__dirname, "..", "assets", "achievement-unlock.wav"); fs.writeFileSync(output, Buffer.concat([header, data])); console.log(`✅ Sonido creado: ${output}`);
