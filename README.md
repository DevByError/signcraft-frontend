<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Asset Manager (UI-only)

The app includes a frontend-only Asset Manager to upload, organize, preview, and drag assets onto the canvas. Assets are stored in in-memory state with optional localStorage persistence. No backend or network required.

- Supported types: images (PNG/JPG/SVG/WebP), videos (MP4/WebM), audio (MP3/WAV), icons/SVG
- Panel: render `AssetManagerPanel` from `components/AssetManagerPanel.tsx`
- Drag: each asset supports drag; consumers read `dataTransfer` with type `application/asset` to get `{ assetId }`
- Canvas references: `CanvasElement` supports `assetId` for linking; do not duplicate `src`
- JSON import/export: use panel buttons to export/import assets as JSON

Example canvas drop integration:

```tsx
import { useEffect, useRef } from 'react';
import { registerCanvasDropTarget } from './utils/assetHelpers';

function Canvas() {
   const ref = useRef<HTMLDivElement>(null);
   useEffect(() => {
      if (!ref.current) return;
      return registerCanvasDropTarget(ref.current, (assetId) => {
         // Create a new canvas element linked to assetId
         // addElement({ type: 'IMAGE', assetId, x: 100, y: 100, width: 200, height: 200, opacity: 1, rotation: 0, zIndex: 1, visible: true, locked: false, content: '' });
      });
   }, []);
   return <div ref={ref} className="canvas" />;
}
```
