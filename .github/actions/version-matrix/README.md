# Version Matrix Actions Script

This folder contains scripts that are used to create Actions matrices for building specific Docker images with the right version combinations of Apify SDK, Playwright/Puppeteer, and Crawlee.

These scripts are ran using the [bun](https://bun.sh) runtime (for no reason other than ease of use).

## Adding a new Node version to the matrix

When a new version of Node is released, just update the `supportedNodeVersions` array in the `src/shares/constants.ts` file.

Then, run `SKIP_CACHE_SET=true bun node:normal` locally to preview the new matrix. (you can append `| jq -r '.include[] | "node-version=\(.["node-version"]) apify-version=\(.["apify-version"]) is-latest=\(.["is-latest"])"'` to get a nicer output from the big JSON blob)

## Adding a new Python version to the matrix

When a new version of Python is released, just update the `supportedPythonVersions` array in the `src/shares/constants.ts` file.

Then, run `SKIP_CACHE_SET=true bun python:normal` locally to preview the new matrix. (you can append `| jq -r '.include[] | "python-version=\(.["python-version"]) playwright-version=\(.["playwright-version"]) apify-version=\(.["apify-version"]) is-latest=\(.["is-latest"])"'` to get a nicer output from the big JSON blob)

## Adding a new Python version range for specific Playwright version ranges

Sometimes, newer Python is not compatible with Playwright versions that were released before a specific one (at the time of writing, this is the case for Playwright 1.48.0 and Python 3.13 -> Python 3.13.x can only run Playwright 1.48.0 and newer).

To add a new Python version range for a specific Playwright version, add a new entry to the `playwrightPythonVersionConstraints` array in the `python.ts` file.

The key represents the Python version range where this starts taking effect. The value is the Playwright version range that is required for the Python version.

## Updating the runtime version that will be used for images that are referenced with just the build tag

When we build images, we also include a specific runtime version in the tag (as an example, we have `apify/actor-node:20`). We also provide images tagged with `latest` or `beta`. These images will default to the "latest" runtime version that is specified in the `src/shares/constants.ts` file under `latestPythonVersion` or `latestNodeVersion`.

When the time comes to bump these, just make a PR, edit those values, and merge it. Next time images get built, the `latest` or `beta` tags will use those new versions for the tag.

## Creating new matrices

The structure for a GitHub Actions matrix is as follows:

```ts
interface Matrix {
  include: MatrixEntry[];
}

type MatrixEntry = Record<string, string>;
```

When trying to integrate a new matrix into a flow, you need to follow the following steps:

- have a step that outputs the matrix as a JSON blob

  ```yaml
  matrix:
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}

    steps:
      - name: Generate matrix
        id: set-matrix
        run: echo "matrix=$(bun python:normal)" >> $GITHUB_OUTPUT
        working-directory: ./.github/actions/version-matrix
  ```

(optionally you can also add in a print step to ensure the matrix is correct. Feel free to copy it from any that uses previous matrices)

- ensure the actual build step needs the matrix and uses it like this (the if check if optional if the matrix will always have at least one entry):

  ```yaml
  needs: [matrix]
  if: ${{ toJson(fromJson(needs.matrix.outputs.matrix).include) != '[]' }}
  strategy:
    matrix: ${{ fromJson(needs.matrix.outputs.matrix) }}
  ```

- reference matrix values based on the keys in the objects in the `include` array. For example, to get the Python version, you can use `${{ matrix.python-version }}`.
