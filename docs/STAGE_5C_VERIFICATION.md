# EcoSort Stage 5C verification

**Ready for the user's manual GitHub Pages deployment. Not published.**

## Retained completed work

The actual validation-selected MobileNetV2 checkpoint was exported as FP32 ONNX
without training, quantization or checkpoint modification. The six-class order,
ImageNet normalization, 224 × 224 Pillow-compatible bilinear resizing, EXIF/RGB
convention, original sorting guidance and exact review threshold
`0.47120377421379084` were retained in the separate `pages-ui/` application.

Native ONNX Runtime parity passed on **25 validation images**. Maximum absolute
score difference: **1.460313797e-06**. Real browser WASM
parity passed on the same 25 images: maximum absolute score difference
**2.05636024475e-06**, approximately 0.000206 percentage points.
All predicted labels and review decisions matched. The 21 decoding fixtures
(derived from one validation image) covered RGB/grayscale/palette/transparent/
binary/16-bit PNG, progressive JPEG and EXIF orientations 2–8 in JPEG and PNG.
All matched the Python labels/review decisions within the declared tolerance.
No unsupported ONNX operations were encountered. The graph uses Add, Clip,
Constant, Conv, Gemm, ReduceMean and Softmax (opset 17, IR 8).

The browser's resize and normalization produced identical tensors from the 25
Pillow-decoded RGB inputs. Four additional resize patterns have committed
Pillow reference hashes. These are implementation checks, **not a new accuracy
evaluation** or a guarantee for every browser/device/input.

## Finished after resuming

* A fresh independent Node-only dependency installation, ten unit tests, TypeScript
  check and Vite production build passed with the explicit **`/EcoSort/` base**.
  The existing relative-base build had already passed. No Python runs in CI.
* **50 final browser checks passed** on that production build, in addition to the
  earlier 43 interface checks. All six real UI classifications, scores, warnings,
  guidance, navigation, repository-root refresh, model reuse and mobile emulation
  worked. Backend/API access was blocked and never attempted. Production assets
  had no failed HTTP responses; there were no browser runtime exceptions.
* Unsupported-browser and tampered-model cases produced clear errors and no
  sample predictions. These were error fixtures, not fabricated successful model
  results. Earlier checks covered invalid/oversized/corrupt/animated files,
  cancellation and recovery from a failed model download.
* Workflow YAML, permissions, `needs`, Pages environment, base-path discovery,
  frozen dependency installation and artifact directory were checked against
  GitHub's official instructions. The build job reads contents/Pages; the deploy
  job receives only `pages: write` and `id-token: write`. **No GitHub Actions run
  has occurred**, because creation/publication is intentionally deferred.
* The source preparation script creates a new clean folder from an allowlist,
  writes per-file SHA-256 hashes and refuses to overwrite a destination. Only
  website source, the selected ONNX asset, static metadata, licenses, workflow
  and these reports are exported. Research data/results, Python checkpoints,
  environments, dependencies, logs and machine settings are excluded.

## Build and preservation evidence

The production output has **21 files, 24,545,464 bytes
(23.41 MiB)**. It contains exactly one ONNX model
(8,902,142 bytes), one version-matched WASM binary and its module,
catalog, manifest, license notices, HTML/CSS/JavaScript and original icons.
The build guard checks model size/hash, mapping, threshold, required runtime
assets, file/site size limits and absence of localhost/API dependencies.

* Original checkpoint SHA-256: `f7b5fca1b392484d58df6e1856a1af0f5d5f9df0dda2ad11805faf2a38a6e4d8`.
* Exported ONNX SHA-256: `36766ac16950a16cdb2d1567e711114cae8d6043add533fa819abc0ac2fcd970`.
* **3082 original files checked: none deleted**. Only the root
  README and `.gitignore` changed; **2909
  dataset/model/result files** and all original application/training/evaluation
  code, configuration, launchers, Figma styles/artwork and saved reports match
  their pre-Stage-5C hashes.
* The existing real-model API suite (8 tests) and legacy application suite (7
  tests) passed after adding the optional ONNX tools. The existing local
  React/FastAPI application was preserved separately.

## Limits and next action

No implementation blocker remains. Physical iOS/Android devices, Safari,
Firefox and Edge engines were not tested; mobile evidence is Chrome touch/
viewport emulation. A public repository and actual GitHub Actions run are still
required before anyone can access a public URL. Weights become publicly
downloadable. Download sizes, device resources and GitHub's free usage limits
apply; literal permanent/unlimited hosting is not promised.

Create/upload only the prepared clean folder, enable **Settings → Pages → GitHub
Actions**, and run **Deploy EcoSort to GitHub Pages**. See
[`GITHUB_PAGES.md`](GITHUB_PAGES.md) for the exact manual instructions and
[`stage5c_verification.json`](stage5c_verification.json) for machine-readable
metrics, per-image numerical differences and build hashes. No training, formal
test evaluation, dataset edits, public deployment or lecturer submission ZIP
was performed.
