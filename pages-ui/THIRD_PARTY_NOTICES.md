# EcoSort browser deployment attribution

* **ONNX Runtime Web 1.31.1** — Microsoft Corporation, MIT.
  <https://github.com/microsoft/onnxruntime>. The local WASM binary/module must
  match the JavaScript package. See `licenses/ONNX-RUNTIME-MIT.txt` and the
  upstream third-party notices retained here.
* **fast-png 8.0.0** — Michaël Zasso, MIT.
  <https://github.com/image-js/fast-png>. Used for RGB-preserving PNG decoding.
* **Pillow 13.0.0** — Pillow/PIL contributors, MIT-CMU and bundled notices.
  <https://github.com/python-pillow/Pillow>. `src/preprocess.ts` implements a
  compatible separable bilinear filter with 22-bit coefficient precision and
  uint8 rounding. Reference: `src/libImaging/Resample.c` in Pillow 13.0.0.
  The complete installed Pillow license is retained in `licenses/`.
* **React / React DOM** — Meta Platforms and affiliates, MIT. Existing Figma
  React/Vite/Tailwind implementation retained; dependency versions are locked.
* **Torchvision MobileNetV2** — PyTorch contributors, BSD-3-Clause. EcoSort's
  original ImageNet-initialized, TrashNet-trained classifier was exported in
  evaluation mode without retraining or quantization. No broader license for
  upstream ImageNet data or EcoSort's own trained weights is invented here.
* **TrashNet** — Gary Thung and Mindy Yang, Stanford CS229 project.
  <https://github.com/garythung/trashnet>, pinned source commit
  `6fa2b878c6c1b4304b91109070ce0edf9279bb31`. Repository MIT license, copyright
  2017 Gary Thung, retained verbatim. Upstream does not state a separate
  dataset-specific license. No dataset images are included in this repository
  preparation or deployed website.
* Guidance references: [US EPA](https://www.epa.gov/recycle/how-do-i-recycle-common-recyclables)
  and [UN SDG 11](https://sdgs.un.org/goals/goal11). Existing EcoSort wording and
  local acceptance/safety cautions are retained; these organizations do not
  endorse the classifier.
* The original Google Fonts import remains (DM Sans and Manrope). Fonts load
  from Google's service when reachable and fall back to sans-serif otherwise.

Upstream license texts are in `licenses/`; model identity, original checkpoint
hash, validation split hash, class mapping and export method are in
`public/model-manifest.json`. This notice records attribution and does not
assign a new license to the group's original EcoSort code, design or weights.
