# Host EcoSort on GitHub Pages without a server bill

The Pages version lives in `pages-ui/`. It is separate from the existing
`figma-ui/` + FastAPI + PyTorch application, which keeps its original launcher,
checkpoint and Python preprocessing. Do not replace that local version with a
static build or point its API configuration at GitHub Pages.

## What is ready

The actual selected MobileNetV2 has been exported to fixed-shape FP32 ONNX
(8,902,142 bytes). The static frontend downloads that model and its locally
hosted WASM runtime, then classifies images entirely inside a browser worker.
It retains the six classes, original guidance, exact validation-only uncertainty
threshold, interface layout, artwork, styling and navigation. Only the Pages
copy's photo-privacy wording changes to describe browser-local classification.

No Python/FastAPI service, inference subscription, external model API, paid
domain, CDN account or visitor software installation is required. The complete
production output is about 23 MiB; see the verification report for measured
sizes and numerical parity. Nothing has been published or uploaded by this task.

## Create your public repository manually

Use the **prepared clean source folder** supplied with this stage, rather than
uploading the research project. It contains `pages-ui/`, `.github/workflows/`,
documentation, license notices and a SHA-256 inventory. It contains no dataset
images, PyTorch checkpoints, Python environments, experimental result files,
Node dependencies, builds, local settings or temporary verification photos.

1. Sign into GitHub. Select **New repository**, name it (for example `ecosort`),
   select **Public**, and create an empty repository without an initial README.
   Public repositories support Pages on GitHub Free.
2. In the empty repository choose **uploading an existing file** (or **Add file →
   Upload files**). Drag the **contents** of the prepared clean folder into the
   upload area, not the enclosing folder. Include the `.github` directory; it
   contains the deployment workflow. Commit the uploaded files to `main`.
3. Confirm the repository root contains `pages-ui/`, `docs/`, `README.md`, and
   `.github/workflows/pages.yml`. The model is below the web uploader's file-size
   limit, so no Git LFS or local Git installation is needed for this upload.
4. On GitHub, open **Settings → Pages → Build and deployment → Source** and select
   **GitHub Actions**. Public visibility is needed for the completely free path.
5. Open **Actions → Deploy EcoSort to GitHub Pages → Run workflow → main**.
   Later pushes affecting `pages-ui/` automatically rebuild and deploy.
6. Wait for both **build** and **deploy** to pass. The deployment job supplies
   the actual URL, normally `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
   Open that URL on desktop and a phone, classify a photo, and confirm the
   sorting guidance and review warning before sharing it.

Visitors need no installation. Maintainers can alternatively use GitHub Desktop
or existing Git from PowerShell **inside the clean folder**:

```powershell
git init -b main
git add .
git commit -m "Prepare EcoSort browser inference and GitHub Pages deployment"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

These commands are instructions for you to run after creating the repository;
they have not been executed here. Use your own real repository URL. Keep the
ONNX file tracked normally; it is below GitHub's normal Git file-size limit and
does not require Git LFS. The exported weights will be public and downloadable.

## Build and preview before publishing

Maintainers need Node 24.19.0 and pnpm 11.25.0; GitHub Actions installs those
versions automatically. From the clean folder:

```powershell
pnpm.cmd --dir pages-ui install --frozen-lockfile
pnpm.cmd --dir pages-ui test
pnpm.cmd --dir pages-ui build
pnpm.cmd --dir pages-ui preview
```

Visit the address printed by Vite, normally `http://127.0.0.1:5174`. This is only
a local static preview; Python and FastAPI are not used. Do not double-click
`dist/index.html`; workers/WASM require HTTP(S). Stop preview with Ctrl+C.

The workflow gets the base path from `actions/configure-pages`, so it works with
repository sites and user sites without hardcoding an account or repository
name. Local builds use relative asset URLs. The original React navigation does
not create deep URL routes; refreshing the site root is supported without
server-side rewrites. Serve the trailing-slash repository URL.

The model, catalog and provenance manifest are tracked in `pages-ui/public`.
The build copies pinned ONNX runtime binaries and license notices into `public`,
then Vite includes them in `dist`. Generated runtime assets and `dist` are ignored
by Git. A post-build guard verifies required assets, the ONNX hash, class mapping,
threshold, file/site sizes and absence of localhost/API dependencies. CI does not
download datasets, export models, train, or evaluate any split.

## Free hosting and browser limitations

* GitHub Pages is free for public repositories on GitHub Free. A GitHub-provided
  `github.io` URL avoids domain fees. Paid private-repository plans are unnecessary.
* GitHub currently limits published Pages sites to 1 GB, with a soft bandwidth
  limit of 100 GB/month. Large numbers of first-time model/runtime downloads can
  reach that bandwidth limit. It is not an unlimited inference-hosting promise.
* The URL remains shareable while the repository/account/site stay available and
  comply with GitHub's policies. No host can guarantee literal permanence.
* The first classification downloads roughly 24 MB of uncompressed model/runtime
  assets plus application files; transfer compression/caching depends on the
  host/browser. The model/session is reused during that page session. Browser
  cache reuse across visits is host-controlled, not a guaranteed offline mode.
* Visitors supply the CPU and memory. Older or low-memory phones may be slow or
  unsupported. Single-threaded WASM requires no special response headers or GPU.
  WebAssembly SIMD, module workers, OffscreenCanvas, createImageBitmap and Web
  Crypto support are required. Errors are shown instead of sample predictions.
* Windows Chrome desktop and Chrome touch/mobile emulation were tested. Physical
  iOS/Android devices, Safari, Firefox and Edge engines were not tested. Browser
  image decoding/numerical differences may affect borderline decisions on other
  devices. See the actual measured parity coverage; no cross-device bit-exact
  guarantee is made.
* Photos remain in browser memory. Original Google Fonts requests remain; font
  fallback works if Google's font service is unreachable. No external inference
  or runtime CDN is used. GitHub itself receives normal website asset requests.
* This remains a six-material educational classifier. Model scores are
  uncalibrated, minority trash results are weaker, and out-of-scope, hazardous,
  mixed or dirty items can be misclassified. Local collection rules and item
  condition determine acceptance and disposal routes.

## Restore or re-export later

The research project retains `scripts/run_ecosort.ps1` for the local React/API
application and its standalone external Python environment. The Pages frontend
can be built without installing any Python dependencies.

For a deliberate new export in the full research project only, install the
additional pinned `requirements-onnx.txt` into its configured environment, then
run `scripts/export_browser_model.py` with a **fresh** `--output-dir` and
`--verification-dir`. The exporter refuses to overwrite an existing ONNX file,
loads and checks the pinned checkpoint/configuration, verifies validation-only
native ONNX parity, and records SHA-256 provenance. Browser parity must also be
rechecked before replacing published assets. Never recalibrate the existing
threshold or use test photos to develop the port.

To prepare another clean source directory from the full research project:

```powershell
$ecoPython = (Get-Content -Raw '.ecosort-environment.local.json' | ConvertFrom-Json).python
& $ecoPython -B scripts\prepare_pages_repository.py --output 'C:\path\to\a-new-EcoSort-Pages-folder'
```

The exporter uses an allowlist, refuses an existing destination, writes a hash
inventory and creates no Git repository or remote. Do not generate a final
academic submission ZIP as part of website deployment.

Sources: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits),
[custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site),
[ONNX Runtime Web deployment](https://onnxruntime.ai/docs/tutorials/web/deploy.html).
