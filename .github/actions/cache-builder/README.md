# cache-builder

Pre-caches recent versions of the dependencies most Apify Actors install, once per
supported package manager, and zips each populated cache. The idea is to ship these
archives into the base images so Docker builds (and the Actors built on top of them)
can install dependencies from a warm cache instead of hitting the network.

> Status: experimental. This produces the cache archives; wiring them into the image
> builds and adding tests is handled separately.

## What it does

For each supported package manager — **npm**, **yarn**, **pnpm** — the matching script in
`src/caches/<pm>.ts`:

1. Looks up the last `versionsToCache` (currently 5) **stable** versions of every package in
   `packagesToPrecache` (see `src/shared/constants.ts`) from the npm registry.
2. Warms that package manager's cache/store with those versions, pointed at `data/<pm>/`.
3. Writes `data/<pm>_state.json` listing exactly which versions were cached.
4. Zips the populated cache into `data/<pm>.zip`.

The cache directories line up with the cache locations the base images already use:
npm cache → `npm_config_cache`, yarn global cache → `YARN_GLOBAL_FOLDER`, pnpm store →
`--store-dir`. So a `data/<pm>.zip` can be unpacked straight into `/pkg-cache/<pm>`.

## Running locally

The scripts run natively on **Node.js >= 24** (TypeScript type stripping — no build step).
You need the relevant package manager available (`corepack enable` provides yarn and pnpm)
and the `zip` CLI.

```bash
node src/caches/npm.ts     # -> data/npm.zip  + data/npm_state.json
node src/caches/yarn.ts    # -> data/yarn.zip + data/yarn_state.json
node src/caches/pnpm.ts    # -> data/pnpm.zip + data/pnpm_state.json
```

The populated caches and the `.zip` archives are git-ignored; only the `*_state.json`
files are committed (so changes to which versions are cached are reviewable).

## Adding a package to the cache

Add it to `packagesToPrecache` in `src/shared/constants.ts`. To change how many versions
are kept, edit `versionsToCache` in the same file.
