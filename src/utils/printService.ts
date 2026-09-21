/**
 * Layanan Pencetakan Dokumen Fisik & Digital (Print Service)
 * Mengintegrasikan pencetakan langsung ke perangkat keras cetak (printer fisik USB/WiFi/Network/Bluetooth)
 * dengan isolasi iframe untuk menjamin dokumen bersih dari elemen antarmuka web/modal.
 */

export interface PrintOptions {
  documentTitle?: string;
  landscape?: boolean;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Mencetak elemen tertentu secara langsung ke perangkat cetak yang tersambung
 */
export const printElementDirectly = (
  elementId: string,
  options: PrintOptions = {}
): boolean => {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.warn(`Elemen cetak dengan ID "${elementId}" tidak ditemukan. Menggunakan window.print().`);
    window.print();
    return false;
  }

  try {
    // 1. Hapus iframe cetak sebelumnya jika masih ada
    const oldIframe = document.getElementById('siperditan-print-frame');
    if (oldIframe) {
      oldIframe.remove();
    }

    // 2. Buat iframe tersembunyi khusus untuk spooling cetak
    const printIframe = document.createElement('iframe');
    printIframe.id = 'siperditan-print-frame';
    printIframe.setAttribute('aria-hidden', 'true');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.style.visibility = 'hidden';
    printIframe.style.zIndex = '-9999';

    document.body.appendChild(printIframe);

    const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (!iframeDoc) {
      window.print();
      return false;
    }

    // 3. Salin semua styles dari dokumen induk (Tailwind CSS, fonts, inline styles)
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((tag) => tag.outerHTML)
      .join('\n');

    const title = options.documentTitle || 'Dokumen Dinas Persuratan - Disperakim Prov. Jateng';

    // 4. Susun template HTML mandiri dengan format halaman A4 standar kedinasan
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${title}</title>
          ${styleTags}
          <style>
            @page {
              size: ${options.landscape ? 'A4 landscape' : 'A4 portrait'};
              margin: 8mm 10mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              background-color: #ffffff !important;
              color: #000000 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, serif;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, [data-no-print="true"] {
              display: none !important;
            }
            .print-page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
              image-rendering: -webkit-optimize-contrast;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            /* Menghilangkan scrollbar dan border modal */
            .overflow-hidden, .overflow-y-auto {
              overflow: visible !important;
            }
          </style>
        </head>
        <body class="bg-white text-black p-0 m-0">
          <div id="print-content-wrapper" class="w-full">
            ${targetElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // 5. Tunggu rendering font & gambar selesai lalu kirim perintah cetak ke perangkat
    setTimeout(() => {
      try {
        if (options.onBeforePrint) options.onBeforePrint();

        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();

        if (options.onAfterPrint) options.onAfterPrint();
      } catch (err) {
        console.warn('Gagal mencetak melalui iframe terisolasi, mengalihkan ke window.print():', err);
        window.print();
      } finally {
        // Hapus iframe setelah dialog cetak tertutup
        setTimeout(() => {
          try {
            printIframe.remove();
          } catch {
            // ignore
          }
        }, 3000);
      }
    }, 400);

    return true;
  } catch (error) {
    console.error('Kesalahan saat memproses pencetakan dokumen:', error);
    window.print();
    return false;
  }
};

/**
 * Membuka dokumen dalam jendela khusus cetak untuk perangkat dengan pembatasan iframe
 */
export const openPrintableWindow = (elementId: string, title?: string) => {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank', 'width=840,height=900,menubar=yes,toolbar=yes');
  if (!printWindow) {
    // Jika popup diblokir, fallback ke printElementDirectly
    printElementDirectly(elementId, { documentTitle: title });
    return;
  }

  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((tag) => tag.outerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${title || 'Cetak Naskah Dokumen Persuratan'}</title>
        ${styleTags}
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { background: #fff; margin: 0; padding: 20px; font-family: serif; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; padding: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background: #1e3a8a; color: white; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">
            🖨️ Cetak Sekarang ke Perangkat Printer
          </button>
          <span style="margin-left: 12px; font-size: 12px; color: #475569;">Atau tekan Ctrl+P pada keyboard Anda</span>
        </div>
        ${targetElement.outerHTML}
        <script>
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
