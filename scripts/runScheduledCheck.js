require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

function limaClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  return {
    hour: Number(parts.find((p) => p.type === 'hour').value),
    minute: Number(parts.find((p) => p.type === 'minute').value),
  };
}

function inWindow(date = new Date()) {
  const { hour } = limaClock(date);
  return hour >= 6 && hour <= 21;
}

if (!inWindow()) {
  console.log('Outside 6:00 a.m.–9:59 p.m. Peru time. Skipping.');
  process.exit(0);
}

const child = spawn(process.execPath, [path.join(__dirname, '..', 'checkCourts.js')], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code === null ? 1 : code);
});
