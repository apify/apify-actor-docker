# Version Matrix Actions Script

This folder contains scripts that are used to create Actions matrices for building specific Docker images with the right version combinations of Apify SDK, Playwright/Puppeteer, and Crawlee.

These scripts are ran using the [bun](https://bun.sh) runtime (for no reason other than ease of use).

## Adding a new Python version to the matrix

When a new version of Python is released, just update the `supportedPythonVersions` array in the `python.ts` file.

Then, run `bun python` locally to preview the new matrix. (you can use `| jq -r '.include[] | "python-version=\(.["python-version"]) playwright-version=\(.["playwright-version"]) apify-version=\(.["apify-version"]) is-latest=\(.["is-latest"])"'` to get a nicer output from the big JSON blob)

## Adding a new Python version range for specific Playwright version ranges

Sometimes, newer Python is not compatible with Playwright versions that were released before a specific one (at the time of writing, this is the case for Playwright 1.48.0 and Python 3.13 -> Python 3.13.x can only run Playwright 1.48.0 and newer).

To add a new Python version range for a specific Playwright version, add a new entry to the `playwrightPythonVersionConstraints` array in the `python.ts` file.

The key represents the Python version range where this starts taking effect. The value is the Playwright version range that is required for the Python version.

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
        run: echo "matrix=$(bun python)" >> $GITHUB_OUTPUT
        working-directory: ./.github/actions/version-matrix
  ```

(optionally you can also add in a print step to ensure the matrix is correct. Feel free to copy it from any that uses previous matrices)

- ensure the actual build step needs the matrix and uses it like this:

  ```yaml
  needs: [matrix]
  strategy:
    matrix: ${{ fromJson(needs.matrix.outputs.matrix) }}
  ```

- reference matrix values based on the keys in the objects in the `include` array. For example, to get the Python version, you can use `${{ matrix.python-version }}`.
