# Composal Turborepo

Serve Turborepo's remote cache on localhost, backed by the Modal Volume v2
filesystem already mounted on Composal managed GitHub Actions runners.
Task artifacts stay on the mounted filesystem between jobs; builds transfer
them over loopback without an external cache service or archive restore step.

```yaml
jobs:
  build:
    runs-on: [composal-x64-4x]
    steps:
      - uses: actions/checkout@v7
      - uses: composalai/turborepo@v0
      - run: npm ci
      - run: npx turbo run build
```

The action exports `TURBO_API`, `TURBO_TEAM`, and a random, job-local
`TURBO_TOKEN` for subsequent steps. It starts a bundled
[ducktors/turborepo-remote-cache](https://github.com/ducktors/turborepo-remote-cache)
2.14.3 server on an available loopback port, checks readiness, and stops it
before flushing writes in the post step. No server installation, Docker daemon,
cloud cache credentials or runner image update is needed.

Configure task `outputs` in `turbo.json` so Turborepo can restore build files.
Turborepo decides cache hits from task hashes. This action does not run builds,
watch source files, or add live reload. Existing Turbo commands continue to work.
Keep the checkout, local `.turbo` cache and restored outputs on local runner disk.

## Cache sharing

The optional `key` input defaults to `turborepo-v0`. Use another key to start
fresh, or to separate independent Turbo projects within the repository.

The artifact directory is scoped by GitHub installation, repository, key and
`GITHUB_REF`. Jobs on the same ref reuse entries across runs and runner sizes.
Pull request merge refs have separate directories; different refs start cold.
Concurrent jobs on one ref share writable storage. Failed jobs retain completed
artifacts. New runners see committed writes; an existing runner does not reload
its view when another runner writes. There is no automatic eviction in v0.

These directories prevent accidental cross-ref cache reuse; they are not an
access boundary against workflow code with access to the shared volume. For
workflows that execute untrusted code, configure Turborepo's artifact signatures
with `remoteCache.signature: true` and provide `TURBO_REMOTE_CACHE_SIGNATURE_KEY`
only to trusted jobs. The action preserves the client's signing configuration.
Do not put credentials into cached task outputs.

Outputs are `api` (loopback server URL) and `path` (persistent artifact directory).
An existing directory does not mean a task will hit; inspect Turbo's build summary.
Uploads are limited to 1 GiB per artifact. The action requires a Composal managed
Linux runner with `COMPOSAL_DISK_ROOT`; GitHub-hosted runners and job containers
without that mount are unsupported.

## Development

The source lives in `github-actions/turborepo` in the Vex monorepo. From its root:

```sh
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter composal-turborepo-action build
mise exec -- node --test github-actions/turborepo/main.test.cjs
```

The release includes `dist/` and its generated third-party license notices.
Rebuild before packaging; Actions downloads the bundle without installing packages.
