import fs from 'node:fs';
const FILE = 'alerts-seen.json';

export function loadSeen() {
  try {
    return new Set(JSON.parse(fs.readFileSync(FILE, 'utf8')));
  } catch {
    return new Set();
  }
}

export function saveSeen(seen) {
  fs.writeFileSync(FILE, JSON.stringify([...seen].slice(-5000), null, 2));
}
