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
2. Warms that package manager's cache/store with those versions **including their full
   dependency trees**, by doing a real install (`npm install` / `pnpm add` / `yarn add`) of
   each version in a throwaway project — not `npm cache add` / `pnpm store add`, which would
   only cache the named package and leave an Actor to download the whole transitive tree.
   Installs use `--ignore-scripts` (no browser downloads; we only need the tarballs cached).
3. Writes `data/<pm>_state.json` listing exactly which versions were cached.
4. Zips the populated cache into `data/<pm>.zip`.

`packagesToPrecache` is `crawlee`, `apify`, `playwright`, `puppeteer` (TypeScript is excluded —
Actors don't install it at runtime and it dominated the cache size).

The cache directories line up with the cache locations the base images already use, so a
`data/<pm>/` tree unpacks straight into `/pkg-cache/<pm>`:
- **npm** → `/pkg-cache/npm` (matches `NPM_CONFIG_CACHE`).
- **yarn** → `/pkg-cache/yarn` (Berry global cache; matches `YARN_GLOBAL_FOLDER`).
- **pnpm** → `/pkg-cache/pnpm/store` (matches `PNPM_CONFIG_STORE_DIR`). pnpm's store is
  versioned, so the builder warms a store for **each pnpm major in `PNPM_MAJORS`** (currently
  10 and 11) → `/pkg-cache/pnpm/store/v10` and `/pkg-cache/pnpm/store/v11`. An Actor then hits
  the cache whether it uses pnpm 10 or 11.

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
