# Image-Resize

A small client-side web app to resize, compress and (experimental) remove backgrounds from images(not implemented yet). The app is built with React, Vite and TypeScript and performs all processing in the browser (no server required).

Features
--------

- Resize images using ready-made presets or custom sizes (pixels or percent of original).
- Compress images with an adjustable quality slider and download as JPEG.
- Experimental client-side background removal that exports PNG with transparency.
 - Export / convert images to other formats (PNG, JPEG, WEBP) when downloading.
 - Client-side upload limit: 10 MB per file (checked in the browser).
 - Export / convert images to other formats (PNG, JPEG, WEBP) when downloading. There's also an "IO (.io)" option which is an alias for PNG (the file is a PNG but will be named with the .io extension).

Quick start (PowerShell)
------------------------

1. Install dependencies:

	npm install

2. Start dev server:

	npm run dev

The Vite dev server typically runs at http://localhost:5173

Build and preview:

	npm run build
	npm run preview

Project structure (important files)
----------------------------------

- src/App.tsx            - main UI and controls
- src/utils/imageProcessor.ts - image processing helpers (resize, compress, remove background)
- src/components/*       - Header and Footer
- package.json           - scripts and dependencies

Notes
-----

- This app runs entirely in the browser. It does not upload images to a server.
- Large images may be slow or memory intensive in the browser.
<!-- - Background removal is heuristic-based and may not work on complex backgrounds. -->


