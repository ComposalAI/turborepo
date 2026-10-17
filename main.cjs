'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const {setTimeout: delay} = require('node:timers/promises');

function storagePath(env, platform = process.platform) {
  if (platform !== 'linux' || !env.COMPOSAL_DISK_ROOT) throw new Error('turborepo requires a Composal managed Linux runner');
  const key = env.INPUT_KEY || 'turborepo-v0';
  if (key.length > 512 || /[\r\n\0]/.test(key)) throw new Error('key must contain 1–512 characters without newlines');
  if (!env.GITHUB_REF) throw new Error('GITHUB_REF is required to isolate build artifacts');
  const root = fs.realpathSync(env.COMPOSAL_DISK_ROOT);
  const digest = crypto.createHash('sha256').update(JSON.stringify([key, env.GITHUB_REF])).digest('hex');
  const directory = path.join(root, 'turborepo-v0', digest);
  fs.mkdirSync(directory, {recursive: true});
  if (fs.realpathSync(directory) !== directory) throw new Error('Turborepo storage must not contain symlinks');
  return directory;
}

async function start(env = process.env, options = {}) {
  const storage = storagePath(env, options.platform);
  if (!env.RUNNER_TEMP || !env.GITHUB_STATE || !env.GITHUB_ENV || !env.GITHUB_OUTPUT) throw new Error('GitHub Actions runner files are required');
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(env.RUNNER_TEMP), 'composal-turborepo-'));
  const token = crypto.randomBytes(32).toString('hex');
  console.log(`::add-mask::${token}`);
  const config = {storage, token, team: 'composal', directory};
  const configPath = path.join(directory, 'server.json');
  fs.writeFileSync(configPath, JSON.stringify(config), {mode: 0o600});
  const log = fs.openSync(path.join(directory, 'server.log'), 'a', 0o600);
  // Do not pass workflow credentials or upstream server configuration to the
  // cache process. It only serves this job's local endpoint and storage path.
  const child = spawn(process.execPath, [path.join(__dirname, 'dist/index.cjs'), configPath], {
    detached: true, stdio: ['ignore', log, log],
    env: {PATH: path.dirname(process.execPath), HOME: env.HOME || directory,
      RUNNER_TRACKING_ID: env.RUNNER_TRACKING_ID || '', NODE_ENV: 'production',
      TURBO_TOKEN: token, AUTH_MODE: 'static', STORAGE_PROVIDER: 'local',
      STORAGE_PATH: storage, STORAGE_PATH_USE_TMP_FOLDER: 'false', LOG_LEVEL: 'silent',
      BODY_LIMIT: String(1024 * 1024 * 1024),
      // The upstream server only needs this flag to round-trip signature tags;
      // Turbo signs and verifies on the client. Never give it the signing key.
      ...(env.TURBO_REMOTE_CACHE_SIGNATURE_KEY ? {TURBO_REMOTE_CACHE_SIGNATURE_KEY: 'client-signatures'} : {})},
  });
  fs.closeSync(log);
  let failure;
  child.once('error', error => { failure = error; });
  child.unref();
  try {
    const ready = path.join(directory, 'ready.json');
    for (let attempt = 0; !fs.existsSync(ready); attempt++) {
      if (failure) throw failure;
      if (child.exitCode !== null) throw new Error('Turborepo cache server exited during startup');
      if (attempt >= 300) throw new Error('Turborepo cache server did not become ready within 30 seconds');
      await delay(100);
    }
    const {api} = JSON.parse(fs.readFileSync(ready, 'utf8'));
    const response = await fetch(`${api}/v8/artifacts/status`, {
      headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || (await response.json()).status !== 'enabled') throw new Error('Turborepo cache readiness check failed');
    fs.appendFileSync(env.GITHUB_STATE, `directory=${directory}\n`);
    fs.appendFileSync(env.GITHUB_ENV, `TURBO_API=${api}\nTURBO_TEAM=${config.team}\nTURBO_TOKEN=${token}\n`);
    fs.appendFileSync(env.GITHUB_OUTPUT, `api=${api}\npath=${storage}\n`);
    console.log(`Turborepo cache ready at ${api}; artifacts persist on the mounted filesystem.`);
    return {...config, api};
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(`${error.message}\n${fs.readFileSync(path.join(directory, 'server.log'), 'utf8')}`);
  }
}

if (require.main === module) start().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = {start, storagePath};
