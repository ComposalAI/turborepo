'use strict';
const fs = require('node:fs');
const path = require('node:path');

async function serve(configPath) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const {createApp} = await import('turborepo-remote-cache');
  const app = createApp({logger: false, bodyLimit: 1024 * 1024 * 1024});
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    await app.close();
    fs.writeFileSync(path.join(config.directory, 'stopped'), '');
  }
  process.on('SIGTERM', () => close().catch(() => { process.exitCode = 1; }));
  app.post('/_composal/shutdown', (request, reply) => {
    if (request.headers.authorization !== `Bearer ${config.token}`) return reply.code(401).send();
    reply.code(202).send();
    setImmediate(() => close().catch(() => { process.exitCode = 1; }));
  });
  const api = await app.listen({host: '127.0.0.1', port: 0});
  fs.writeFileSync(path.join(config.directory, 'ready.json'), JSON.stringify({api}));
}

if (require.main === module) serve(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
