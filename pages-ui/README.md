# EcoSort browser application

This is the independent GitHub Pages version of EcoSort. The existing Figma
interface runs the original validation-selected MobileNetV2 as **FP32 ONNX** in
a browser worker using **ONNX Runtime Web 1.31.1 / WASM**. It needs no Python,
FastAPI, localhost API, accounts, paid services or visitor installation.

## Develop or preview (maintainers only)

Use Node 24.19.0 and pnpm 11.25.0:

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm preview
```

Open the printed address, normally `http://127.0.0.1:5174`. A static web server
is needed for local testing; do not open `dist/index.html` through `file://`.
`pnpm dev` also prepares the runtime assets. Visitors to GitHub Pages need only
their browser; these tools are for maintainers and CI.

The default relative Vite base works under a repository subpath. GitHub Actions
discovers and supplies the actual Pages base path; no repository-name edits are
needed. Navigation uses the original React state, so it creates no unsupported
deep routes and refresh at the site root works without a 404 rewrite.

`pnpm build` copies version-matched runtime assets from the locked package into
`public/runtime`, builds the site, then verifies the ONNX SHA-256, class order,
exact threshold, required assets, sizes and absence of localhost/API URLs.
Runtime binaries and `dist` are generated and ignored by Git. The exported ONNX
model, catalog and provenance manifest **are committed** under `public/`.

## Preserved inference contract

* Checkpoint SHA-256: `f7b5fca1b392484d58df6e1856a1af0f5d5f9df0dda2ad11805faf2a38a6e4d8`.
* Six classes, in order: cardboard, glass, metal, paper, plastic, trash.
* EXIF orientation, RGB conversion, Pillow-compatible antialiased bilinear
  resizing directly to 224 × 224, CHW float32, ImageNet mean/std normalization.
* The PNG decoder preserves underlying RGB values when discarding alpha,
  matching Pillow rather than compositing transparent pixels onto a background.
* The exact validation-only review rule is `score < 0.47120377421379084`.
* Scores remain uncalibrated. Guidance remains material-specific and subordinate
  to local collection rules and item condition. No result proves safety or
  recyclability; the minority trash class is less reliable.

The model is downloaded lazily on first classification, hash-checked, and reused
for that page session. Runtime and model assets come from the same deployed site.
No photo leaves the device and no image history is saved. The image, prediction
and score-section expansion survive navigation in temporary React memory. Only
removing/replacing the image resets that selection; closing or reloading the app
ends the session. Navigation does not trigger inference. A worker keeps model
loading/inference off the interface thread; cancellation suppresses stale results.
Single-threaded WASM avoids the cross-origin isolation headers Pages cannot set.
Original Google Fonts requests remain; absent network access, the declared font
fallback is used. The classifier itself uses no external inference service/CDN.

## Verification and limits

See `../docs/STAGE_5C_VERIFICATION.md` and `../docs/stage5c_verification.json`.
The browser port was checked on 25 original validation images and 21 derived
decode/orientation fixtures, never held-out test images. These are numerical
parity checks, not a new accuracy evaluation or a guarantee on unseen images.

Use a current browser with WebAssembly SIMD, module workers, OffscreenCanvas,
createImageBitmap and Web Crypto. Actual browser verification used Windows
Chrome, including a touch/mobile viewport; physical iOS/Android and other browser
engines were not tested. Unsupported browsers show an error rather than mock
predictions. Browser JPEG decoding and floating-point behavior may differ by
platform, particularly near a decision or review boundary.
The inherited 10 MB / 20-megapixel limits remain. Extremely narrow/tall images
above 32,768 pixels on either axis are rejected to bound browser working memory.

The model (~8.9 MB) and runtime (~14.9 MB) need an initial network download and
browser memory/CPU. Slow devices can take longer; the operation times out with
feedback. There is no installed/PWA offline guarantee. Weights are publicly
downloadable when the site is published. See `../docs/GITHUB_PAGES.md` for free
hosting limits, deployment steps, and preservation of the Python local version.
