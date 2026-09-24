# liquid-glass-js (vendored)

- Upstream: https://github.com/dashersw/liquid-glass-js
- Commit: 78cb6ccb0b9987bb60a88b14ccbd13a9e6e8ab2a (2025-06-12)
- License: MIT (see `LICENSE`)
- Files: `container.js`, `button.js`, `glass.css`, copied unmodified. The demo and controls files were left out.

It is not published on npm. The scripts define the global classes `Container` and `Button`, and they need `html2canvas` on `window`.
`html2canvas` is already a dependency. Before this code is used in the app, it needs wrapping as a client component.
