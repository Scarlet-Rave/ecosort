# EcoSort

**Machine Learning-Based Waste Classification for Sustainable Waste Management**

The original Figma React interface classifies images entirely in the visitor's
browser using the project's real validation-selected MobileNetV2, exported to
FP32 ONNX. It supports cardboard, glass, metal, paper, plastic and trash.

The browser version needs no Python server, paid inference service or visitor
installation. Photos are not uploaded for classification. Scores remain
uncalibrated; sorting advice depends on local rules and item condition. A model
prediction never proves recyclability or safe disposal.

This source folder is prepared for GitHub Pages but has not been published.
Follow [the deployment instructions](docs/GITHUB_PAGES.md) to create your own
public repository, enable Pages with GitHub Actions, and obtain the actual URL.

```powershell
pnpm.cmd --dir pages-ui install --frozen-lockfile
pnpm.cmd --dir pages-ui test
pnpm.cmd --dir pages-ui build
pnpm.cmd --dir pages-ui preview
```

Maintainer tools: Node 24.19.0 and pnpm 11.25.0. Visitors only need a modern
browser. The GitHub workflow supplies the deployment base path automatically.

* [Browser application and inference contract](pages-ui/README.md)
* [Numerical and browser verification](docs/STAGE_5C_VERIFICATION.md)
* [Machine-readable verification](docs/stage5c_verification.json)
* [Attribution and licenses](pages-ui/THIRD_PARTY_NOTICES.md)
* [Selected model provenance](pages-ui/public/model-manifest.json)
* `SOURCE_INVENTORY.json`: source hashes captured when this clean folder was made.

Datasets, original PyTorch checkpoints, Python environments and experimental
results remain in the preserved research project. Only the selected exported
ONNX model is included here. No training or formal test evaluation runs in CI.
