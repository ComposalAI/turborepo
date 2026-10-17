'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {setTimeout: delay} = require('node:timers/promises');

async function persist(env = process.env, run = execFileSync) {
  if (!env.STATE_directory) return;
  const directory = env.STATE_directory;
  const {storage, token} = JSON.parse(fs.readFileSync(path.join(directory, 'server.json'), 'utf8'));
  const stopped = path.join(directory, 'stopped');
  try {
    if (!fs.existsSync(stopped)) {
      const {api} = JSON.parse(fs.readFileSync(path.join(directory, 'ready.json'), 'utf8'));
      const response = await fetch(`${api}/_composal/shutdown`, {
        method: 'POST', headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(5000),
      });
      if (response.status !== 202) throw new Error('Could not shut down the Turborepo cache server');
      for (let attempt = 0; !fs.existsSync(stopped); attempt++) {
        if (attempt >= 300) throw new Error('Turborepo cache shutdown timed out');
        await delay(100);
      }
    }
  } finally {
    run('sync', [storage], {stdio: 'inherit'});
  }
  console.log('Turborepo cache stopped and artifact writes flushed.');
}

if (require.main === module) persist().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = {persist};
