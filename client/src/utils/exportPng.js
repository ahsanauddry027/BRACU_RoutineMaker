import { toPng } from 'html-to-image';

/**
 * Capture a DOM node as a high-resolution PNG and trigger a download.
 * Used by both the desktop grid and the mobile view (which captures a
 * hidden full-week grid so the exported image always looks the same).
 *
 * @param {HTMLElement} node    element to capture
 * @param {string} filename     download filename
 */
export async function exportNodeToPng(node, filename = 'bracu-routine.png') {
  if (!node) return;

  // Warm-up pass: html-to-image sometimes misses fonts on the first render
  await toPng(node, { pixelRatio: 1 }).catch(() => {});

  const dataUrl = await toPng(node, {
    pixelRatio: 4,
    backgroundColor: '#0f172a',
    style: { borderRadius: '0', boxShadow: 'none' },
    filter: (n) => !(n.classList && n.classList.contains('toolbar-buttons')),
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
