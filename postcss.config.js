/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    // Inlines @import (src/styles/site.css) before Tailwind runs, so rule order is deterministic.
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};

