# Composal Turborepo

[Runner setup guide](https://composal.ai/docs/github-actions-runners)

Reuse Turborepo task outputs between CI jobs with `composalai/turborepo@v0`.
The action starts a remote cache server on localhost and stores artifacts directly
on the persistent Modal Volume v2 filesystem mounted on Composal managed runners.
Later jobs can restore matching outputs instead of running the same task again.

## Add the action to your workflow

First [configure a Composal runner pool](https://composal.ai/docs/github-actions-runners#configure)
for your repository. Your project must already have Turborepo installed and a
working build task. Add the action before the first Turbo command:

```yaml
name: Build
on: [push, pull_request]

permissions:
  contents: read

jobs:
  build:
    runs-on: [composal-x64-4x]
    steps:
      - uses: actions/checkout@v7
      - uses: composalai/turborepo@v0
      - run: npm ci
      - run: npx turbo run build
```

Keep your existing package manager and install step. For a pnpm project, use
your usual pnpm setup, `pnpm install --frozen-lockfile`, and
`pnpm exec turbo run build` instead of the npm commands above.

The action exports `TURBO_API`, `TURBO_TEAM`, and a job-local `TURBO_TOKEN` for
subsequent steps. You do not need `turbo login`, `turbo link`, a Vercel account,
or a remote-cache token secret. Remove explicit overrides of these three variables
from your build step so it uses the local endpoint. The token and URL belong to
this job; do not save them for another job or a developer machine.

The server starts from a bundled distribution, checks readiness, and listens
only on loopback at an available port. It runs on both Composal VM and sandbox
Linux runners without Docker. Its post step stops the server and flushes writes
before the job finishes.

## Tell Turbo which files to restore

Declare the files produced by each cacheable task in `turbo.json`. For a build
that writes `dist/` within each package:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

Replace `dist/**` with your actual output paths. For a Next.js build, a common
choice is `[".next/**", "!.next/cache/**"]`. Keep the checkout, restored files,
and local `.turbo` directory on the runner's local disk. The action persists
the remote artifact store; you do not need to mount these directories yourself.

Cache tasks whose outputs are determined by their inputs. Declare environment
variables that affect build output in the task's `env` or in `globalEnv`, and
include other relevant input files in Turbo's configuration. Tasks that deploy,
publish, or require fresh external state should not reuse a cached result.
See Turbo's [caching guide](https://turborepo.dev/docs/crafting-your-repository/caching)
and [environment variable guide](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)
for task configuration.

This cache reuses completed tasks. It does not add source watching, hot reload,
or incremental compilation to a task that does not already support them.

## Verify a remote cache hit

Run a build once to populate the cache. Then rerun the workflow on the same Git
ref with unchanged task inputs and the same action key. A fresh runner has no
local build cache, so restored task outputs demonstrate reuse between jobs.
Check Turbo's summary for cached tasks and confirm the expected output files exist.

To test only the remote cache, temporarily use:

```sh
npx turbo run build --cache=remote:rw --summarize
```

The first run should miss for tasks without existing artifacts. The next matching
run should hit and restore their declared outputs. `--summarize` writes run
details under `.turbo/runs/`; compare these when a task unexpectedly rebuilds.
Keep the default local and remote cache behavior for ordinary builds unless you
specifically want the remote-only check.

## Choose a stable cache key

The default key is `turborepo-v0`. Use a stable project name when a repository
contains multiple independent Turbo projects, or change the key to start fresh:

```yaml
- uses: composalai/turborepo@v0
  with:
    key: storefront-v1
```

Do not include a commit SHA, run ID, or timestamp in a normal cache key: changing
the key starts a separate store. Turbo already hashes task inputs to decide
which results it can reuse.

Stores are scoped by GitHub installation, repository, key, and `GITHUB_REF`.
Jobs on the same ref reuse artifacts across workflow runs and runner sizes.
Different branches, tags, and pull request merge refs use separate directories;
a pull request does not inherit the default branch's cache. Reruns on that pull
request can reuse artifacts whose task hashes still match.

Concurrent jobs with the same scope share writable storage. Completed artifacts
from failed jobs can remain available. New runners see committed writes, but an
already-running runner does not automatically refresh its view of another
runner's writes. Let a producer job finish, including its post step, before
starting a consumer job that must read its new artifacts.

Changing a key leaves the old store in place. V0 has no automatic eviction or
user-facing cache deletion command.

## Cache dependency downloads too

The Turbo action caches task outputs. Use the disk-volume action separately for
package downloads if you want to speed up installation too:

```yaml
- uses: actions/checkout@v7
- uses: composalai/disk-volume@v1.2.0
  with:
    key: npm-store-v1
    path: ~/.npm
- uses: composalai/turborepo@v0
- run: npm ci
- run: npx turbo run build
```

Always keep the install step. The npm store supplies downloads; Turbo supplies
matching task results. Avoid separately archiving the same remote artifact store
with `actions/cache` or putting `node_modules`, `.git`, or the workspace root
on a dependency disk. See [dependency caches](https://composal.ai/docs/github-actions-runners#dependency-caches)
for the disk action's sharing rules and limits.

## Sign artifacts used by trusted builds

Ref directories separate normal cache reuse, but the mounted volume is writable
by workflow code. They are not an access boundary against untrusted jobs.
Never cache credentials or secret-bearing output files or logs.

To verify restored artifacts, add this setting alongside your existing tasks:

```json
{
  "remoteCache": {
    "signature": true
  }
}
```

Set `TURBO_REMOTE_CACHE_SIGNATURE_KEY` to the same secret for the action and
your Turbo command. Use a randomly generated secret of at least 32 bytes, and
make it available only to trusted jobs. For example, in a workflow triggered
only by trusted pushes:

```yaml
jobs:
  build:
    runs-on: [composal-x64-4x]
    env:
      TURBO_REMOTE_CACHE_SIGNATURE_KEY: ${{ secrets.TURBO_REMOTE_CACHE_SIGNATURE_KEY }}
    steps:
      - uses: actions/checkout@v7
      - uses: composalai/turborepo@v0
      - run: npm ci
      - run: npx turbo run build
```

The action enables signature-tag storage without giving the signing secret to
the cache server. Turbo signs and verifies on the client. Fork pull request
jobs generally do not receive repository secrets; do not treat an absent secret
as a signed-build configuration. See Turbo's
[artifact authenticity guidance](https://turborepo.dev/docs/core-concepts/remote-caching#artifact-integrity-and-authenticity-verification).

## Troubleshoot cache misses and failures

| Symptom | Check |
| --- | --- |
| The action requires a Composal managed Linux runner | Use a configured Composal runner label. GitHub-hosted runners and job containers without the mounted disk are unsupported. |
| Turbo reports remote caching disabled | Run Turbo after the action, remove step-level overrides of its exported variables, and check that your command has not disabled remote caching. |
| Every run misses | Keep the key and ref stable. Compare run summaries for changed source, lockfiles, task configuration, build environment, or command arguments. Do not use `--force` when testing reuse. |
| Turbo reports a hit, but build files are missing | Add the generated paths to that task's `outputs`. Cached logs alone do not restore undeclared files. |
| A new PR starts cold | Each PR merge ref has a separate store. The default branch's artifacts are not a fallback. |
| A concurrent job cannot see a new artifact | Wait for the producer job to finish and use a fresh consumer runner. Existing mounted views do not automatically reload. |
| Signature verification fails | Check the trusted job's signing key and `remoteCache.signature` setting. Use the same signing key for matching producers and consumers; never bypass verification to accept an artifact. |
| An artifact upload fails | Check artifact size: v0 accepts at most 1 GiB per artifact. Review declared outputs for files that should not be cached. |

The action must report readiness before the build begins. Its logs identify
startup and post-step flush failures. Do not print `TURBO_TOKEN` or the signing
key when collecting diagnostics.

## Inputs, outputs, and limits

| Setting | Meaning |
| --- | --- |
| `key` input | Optional stable cache name. Defaults to `turborepo-v0`; at most 512 characters, without newlines. |
| `api` output | This job's loopback server URL. |
| `path` output | Persistent artifact directory on the mounted filesystem. |
| Authentication | Random token for this job, automatically exported to subsequent steps. |
| Artifact limit | 1 GiB per upload. |
| Retention | Persistent storage with no automatic eviction in v0. |

There is no action-level `cache-hit` output: Turbo determines hits separately
for each task. An existing directory does not establish that a task can be
restored. The server uses
[ducktors/turborepo-remote-cache](https://github.com/ducktors/turborepo-remote-cache)
2.14.3 with local filesystem storage. The
[published action](https://github.com/ComposalAI/turborepo) includes its bundled
runtime and third-party license notices.

## Development

The source lives in `github-actions/turborepo` in the Vex monorepo. From its root:

```sh
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter composal-turborepo-action build
mise exec -- node --test github-actions/turborepo/main.test.cjs
```

The release includes `dist/` and its generated third-party license notices.
Rebuild before packaging; Actions downloads the bundle without installing packages.
