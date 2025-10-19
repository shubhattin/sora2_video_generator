import sharp from 'sharp';

export async function resizeImageFileCoverExact(
  inputFile: File,
  resolution: string,
  options?: {
    format?: 'jpeg' | 'png' | 'webp' | 'avif'; // keep original if omitted
    quality?: number; // for lossy formats
    keepMetadata?: boolean;
    background?: string; // used if you later need flattening for JPEG alpha
  }
): Promise<File> {
  const { width, height } = parseResolution(resolution);
  const buf = Buffer.from(await inputFile.arrayBuffer());

  // cover + position center ensures exact WxH with center crop
  let pipeline = sharp(buf).rotate().resize(width, height, {
    fit: 'cover',
    position: 'centre', // British spelling also ok; "center" works too
    withoutEnlargement: false // allow upscaling like your Pillow code
  });

  if (options?.keepMetadata) {
    pipeline = pipeline.withMetadata();
  }

  let outMime = inputFile.type || 'application/octet-stream';
  if (options?.format) {
    switch (options.format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: options.quality ?? 82, mozjpeg: true });
        outMime = 'image/jpeg';
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9 });
        outMime = 'image/png';
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: options.quality ?? 80 });
        outMime = 'image/webp';
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: options.quality ?? 50 });
        outMime = 'image/avif';
        break;
    }
  } // else, preserve original format

  const outBuffer = await pipeline.toBuffer();
  return new File([new Uint8Array(outBuffer)], inputFile.name || 'resized', {
    type: outMime,
    lastModified: Date.now()
  });
}

function parseResolution(res: string): { width: number; height: number } {
  const m = res.match(/^(\d+)x(\d+)$/);
  if (!m) throw new Error(`Invalid resolution: ${res}`);
  return { width: Number(m[1]), height: Number(m[2]) };
}
