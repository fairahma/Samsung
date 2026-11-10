# Cinema TV

A remote-first Tizen TV app with TamilGun and TamilBlasters catalogs, website search, endless scrolling, shared My List, movie details and in-app player selection.

## Controls

- Arrow keys: move focus. The focused control has a white outline.
- OK/Enter: choose a title or control. Search supports the TV keyboard and USB keyboards.
- Return/Back: close playback, then details, or return Home. At Home it shows an exit confirmation.
- Play/Pause and skip keys: control direct HTML video sources. Third-party embedded players provide their own controls; a pointer may be required for some providers.

The catalog grid keeps only a small window of poster elements mounted while retaining loaded movie metadata. More pages load near the bottom, with duplicate titles removed and Retry for failures. Server-denied searches are reported as errors rather than empty results.

## TizenBrew installation route

This directory is a TizenBrew application module: `packageType: app`, `appPath: app/index.html`, and `serviceFile: service.js`. Publish these files at the root of a public GitHub repository, then add that repository through TizenBrew's module manager.

The module service runs **on the TV**, bound only to `127.0.0.1:39971`, and transports catalog HTML for the two supported sites. It preserves HTTPS certificate verification, limits redirects and response size, and rejects other destinations. This solves the browser-origin restriction of modules served from TizenBrew's local HTTP server. No laptop relay is required after installation.

The ZIP is a source/module package, not a directly installable TizenBrew ZIP importer file. The GitHub module is hosted in `fairahma/Samsung`; install it through TizenBrew's GitHub module manager.

## Standalone widget route

`config.xml` also provides a standalone Samsung TV widget configuration targeting Tizen 6.5+. The generated `.wgt` is explicitly **unsigned**. It must be signed using a valid Samsung TV certificate profile that permits the target TV before installation. No shared certificate, fabricated signature or personal signing material is supplied.

The standalone widget uses direct application network access and does not depend on the TizenBrew service.

## Validation

The packaged-file preview was run on a Samsung S95B QN55S95BAFXZC reporting Tizen 6.5. Live catalog loading, multiple pages, search, directional-key event focus and detail navigation were verified. See `TESTING.md` for exact scope and remaining installation/playback checks.

The image supplied alongside the build is a desktop rendering of the same TV layout, not a TV screen capture.

## Source dependencies

The UI has no npm build dependencies. It uses HTML, CSS, JavaScript, DOMParser and the TV's media/input APIs. The TizenBrew transport uses only Node core modules and ES5 syntax. It does not decrypt protected media, collect account credentials or bypass source access restrictions. Source availability and video compatibility remain provider/device dependent.

References: [TizenBrew module format](https://github.com/reisxd/TizenBrew/blob/main/docs/MODULES.md), [Samsung TV app configuration](https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html), [Samsung remote input](https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html).
