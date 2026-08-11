import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const QR_DARK_COLOR = '#3F060F'; // dark-red
const QR_LIGHT_COLOR = '#FFF9F1'; // cream

export function getProductPublicUrl(slug: string): string {
  return `${window.location.origin}/products/${slug}`;
}

export async function generateProductQRDataUrl(
  slug: string,
  size: number = 320,
): Promise<string> {
  return QRCode.toDataURL(getProductPublicUrl(slug), {
    width: size,
    margin: 1,
    color: { dark: QR_DARK_COLOR, light: QR_LIGHT_COLOR },
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyProductLink(slug: string): Promise<void> {
  await navigator.clipboard.writeText(getProductPublicUrl(slug));
}

interface PrintableProduct {
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  qrDataUrl: string;
}

export function printProductLabel(product: PrintableProduct): void {
  const printWindow = window.open('', '_blank', 'width=420,height=560');
  if (!printWindow) return;

  const price = product.discountPrice ?? product.price;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(product.name)} — Label</title>
        <style>
          @page { size: 90mm 130mm; margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Georgia, 'Times New Roman', serif;
            background: #FFF9F1;
            color: #3F060F;
          }
          .label {
            width: 90mm;
            height: 130mm;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
          }
          .brand {
            font-size: 11px;
            letter-spacing: 3px;
            text-transform: uppercase;
            opacity: 0.7;
          }
          .name {
            font-size: 18px;
            font-weight: bold;
            margin: 6mm 0 2mm;
            line-height: 1.2;
          }
          img { width: 55mm; height: 55mm; }
          .price {
            font-size: 16px;
            font-weight: bold;
            margin-top: 4mm;
          }
          .hint {
            font-size: 10px;
            opacity: 0.6;
            margin-top: 2mm;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="brand">Al Malaki</div>
          <div>
            <div class="name">${escapeHtml(product.name)}</div>
            <img src="${product.qrDataUrl}" alt="QR code" />
            <div class="hint">Scan to view product</div>
          </div>
          <div class="price">${price.toFixed(2)} DT</div>
        </div>
        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

export async function exportAllProductQRCodesZip(
  products: Array<{ name: string; slug: string }>,
): Promise<void> {
  const zip = new JSZip();

  await Promise.all(
    products.map(async (product) => {
      const dataUrl = await generateProductQRDataUrl(product.slug, 480);
      const base64 = dataUrl.split(',')[1];
      const filename = `${product.slug || createFallbackSlug(product.name)}.png`;
      zip.file(filename, base64, { base64: true });
    }),
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `al-malaki-product-qr-codes-${Date.now()}.zip`);
}

function createFallbackSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
