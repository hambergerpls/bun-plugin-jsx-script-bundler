---
"bun-plugin-jsx-script-bundler": minor
---

fix: remove /js parent path to respect outDir config

Some developers may want to use a different outDir than the default /js. This change allows the outDir to be respected when bundling scripts.
