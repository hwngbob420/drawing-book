// Sinh toàn bộ SVG sách tranh vào public/svg/story/ :  node scripts/storybook/index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lib } from './shared.mjs';
import './nature.mjs';
import './scenery.mjs';
import './animals.mjs';
import './wild.mjs';
import './objects.mjs';
import './vehicles.mjs';
import './people.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'public/svg/story');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.svg')) fs.unlinkSync(path.join(out, f));

const names = Object.keys(lib).sort();
for (const n of names) fs.writeFileSync(path.join(out, n + '.svg'), lib[n]().toString());
fs.writeFileSync(path.join(root, 'scripts/storybook/names.json'), JSON.stringify(names));
console.log(names.length, 'SVG ->', path.relative(root, out));
