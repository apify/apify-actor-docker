# node-playwright-* images
This short readme should walk you through the problem and solution of custom-made playwright images.

## The problem

We maximized our efforts to make the images as small as possible, so we bundled the images with the preinstalled playwright and respective browser. The problem is that each playwright version comes with its bundled browser. For example, `playwright 1.7` comes with `firefox-1234`. This is still alright since we have added the playwright version tag to our images. The real trouble happens if someone wants to create an actor with this image, but they use a different playwright version. The browser won't start because `playwright 1.8` looks for its firefox, which is not `firefox-1234`, but `firefox-2345`.

## The solution (One of many)
The solution is quite straightforward: rename all the browser folders to be playwright version agnostic and allow developers to reinstall playwright if the version of the browser and version of playwright are not compatible. To do that, we need to create a new environment variable, `APIFY_DEFAULT_BROWSER_PATH`, and assign the version agnostic browser binary path to it. In Apify SDK, we need to use this path as a `defaultExecutablePath` for the `PlaywrightLauncher` class.
