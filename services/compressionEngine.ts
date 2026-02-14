
import { FileCategory, CompressionStrategy } from "../types";
import { PDFDocument } from 'pdf-lib';

/**
 * Main entry point for compression. 
 * Note: Video/Audio compression in pure client-side JS is limited.
 * Production apps would use ffmpeg.wasm or a server-side FFmpeg worker.
 */
export async function compressFile(
  file: File,
  category: FileCategory,
  strategy: CompressionStrategy
): Promise<Blob> {
  switch (category) {
    case FileCategory.IMAGE:
      return compressImage(file, strategy);
    case FileCategory.TEXT:
      return compressWithGzip(file);
    case FileCategory.PDF:
      return compressPDF(file, strategy);
    case FileCategory.ARCHIVE:
      return compressWithGzip(file);
    default:
      // Best effort for other types
      return file;
  }
}

async function compressImage(file: File, strategy: CompressionStrategy): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas creation failed'));

      // Apply resolution scaling
      const scale = strategy.scale || 1.0;
      canvas.width = Math.max(1, img.width * scale);
      canvas.height = Math.max(1, img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Intelligent format switching: Prefer WebP for high compression
      let format = file.type;
      if (strategy.quality < 0.85) {
        format = 'image/webp';
      } else if (file.type === 'image/png') {
        format = 'image/png'; // Keep PNG if quality is high
      } else {
        format = 'image/jpeg';
      }

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Image encoding failed'));
        },
        format,
        strategy.quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image source'));
    };
  });
}

/**
 * Uses the native CompressionStream API (GZIP) for text/generic data.
 */
async function compressWithGzip(file: File): Promise<Blob> {
  const ds = new CompressionStream("gzip");
  const writer = ds.writable.getWriter();
  writer.write(await file.arrayBuffer());
  writer.close();
  
  const response = new Response(ds.readable);
  const buffer = await response.arrayBuffer();
  return new Blob([buffer], { type: "application/gzip" });
}

async function compressPDF(file: File, strategy: CompressionStrategy): Promise<Blob> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Stripping metadata is the most accessible browser-side PDF optimization
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
    
    // Note: Advanced PDF compression (resampling images) requires a heavier engine.
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (e) {
    console.warn("PDF optimization limited on client:", e);
    return file;
  }
}
