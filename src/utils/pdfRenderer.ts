import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined') {
  try {
    if (pdfjsWorker) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    } else {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
  }
}

/**
 * Render all pages of a PDF (base64 data URL, blob URL, or raw url) into high-resolution image data URLs
 * @param pdfSource string data URL or URL or ArrayBuffer
 * @param scale resolution multiplier (2.0 for razor-sharp 300dpi print quality)
 * @returns Array of image data URLs (one per page)
 */
export async function renderPdfToPageImages(
  pdfSource: string | ArrayBuffer | Uint8Array,
  scale = 2.0
): Promise<string[]> {
  try {
    let loadingTask;

    if (typeof pdfSource === 'string' && pdfSource.startsWith('data:application/pdf')) {
      // Base64 data URL - convert base64 to Uint8Array safely
      const commaIndex = pdfSource.indexOf(',');
      const base64Data = commaIndex !== -1 ? pdfSource.substring(commaIndex + 1) : pdfSource;
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      loadingTask = pdfjsLib.getDocument({ data: bytes });
    } else if (typeof pdfSource === 'string') {
      // If it's a relative/absolute URL, verify it exists before passing to PDF.js
      if (pdfSource.startsWith('/') || pdfSource.startsWith('http')) {
        try {
          const res = await fetch(pdfSource, { method: 'HEAD' });
          if (!res.ok) {
            console.warn(`PDF file not found at ${pdfSource} (HTTP ${res.status})`);
            return [];
          }
        } catch {
          // fetch HEAD might fail on some CORS, proceed to getDocument
        }
      }
      loadingTask = pdfjsLib.getDocument({ url: pdfSource });
    } else {
      loadingTask = pdfjsLib.getDocument({ data: pdfSource });
    }

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageImages: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // @ts-ignore
      await page.render(renderContext).promise;
      const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
      pageImages.push(imageUrl);
    }

    return pageImages;
  } catch (error) {
    console.error('Error rendering PDF to images via PDF.js:', error);
    return [];
  }
}
