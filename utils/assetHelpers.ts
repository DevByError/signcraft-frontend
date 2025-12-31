import type { Asset } from '../types/assets';

export const registerCanvasDropTarget = (
  el: HTMLElement,
  onInsert: (assetId: string) => void
) => {
  const onDragOver = (e: DragEvent) => {
    if (e.dataTransfer?.types.includes('application/asset')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };
  const onDrop = (e: DragEvent) => {
    const dt = e.dataTransfer;
    if (!dt) return;
    const data = dt.getData('application/asset');
    if (data) {
      try {
        const { assetId } = JSON.parse(data);
        if (assetId) onInsert(assetId);
      } catch {}
    }
  };
  el.addEventListener('dragover', onDragOver);
  el.addEventListener('drop', onDrop);
  return () => {
    el.removeEventListener('dragover', onDragOver);
    el.removeEventListener('drop', onDrop);
  };
};
