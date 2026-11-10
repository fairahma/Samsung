# Verification — November 10, 2026

## Live Samsung S95B preview

Model: QN55S95BAFXZC. The runtime independently reported Tizen 6.5.

The existing TizenBrew debugger was used for a temporary app preview. No permanent application installation, public publication, firmware change or signing-certificate change was performed.

- TamilGun landing: 26 live titles, HTTP success.
- TamilGun pagination: 49 distinct titles after three page requests, with a next-page URL retained.
- Website search for `legend`: 10 results and a paginated search URL containing the original term.
- TamilBlasters: 48 distinct titles after two pages.
- Directional-key event: Right moved focus from card index 0 to 1.
- Movie detail opened and returned to the catalog.
- At 49 loaded titles, only 40 poster elements were mounted, including the offscreen focus/scroll buffer.

TV screenshot capture did not return through this model's debugger. The companion layout image was therefore rendered separately in desktop Chromium and is labeled as a layout preview.

## Desktop regression checks

1920×1080 UI; Right/Down directional movement; paginated append; search returning an older title; preservation of the search query on subsequent pages; second-source selection; detail/Back; readable HTTP 403 state; bounded mounted poster elements; no uncaught JavaScript errors.

TV-local transport helper tested on Windows Node: loopback binding, health response, module-origin CORS header, rejection of non-allowlisted hosts/protocols/credentials/ports, and HTTPS success for both public catalog roots. TLS verification remains enabled.

## Remaining checks

- The permanent TizenBrew module must be published/installed before its Node service can be tested in the TV's actual service runtime. The packaged-file preview and service helper were tested separately.
- Standalone WGT signing is not complete; the supplied widget is unsigned.
- Actual movie decoding, third-party player controls, embedded-player return-key handling and long-session playback have not been verified on the TV. Source discovery or an HTTP 200 response does not prove successful video playback.
