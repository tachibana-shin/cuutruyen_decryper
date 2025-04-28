const DECRYPTION_KEY = "MzE0MTU5MjY1MzU4OTc5Mw++";

const page = {
  id: 1363975,
  order: 0,
  width: 1400,
  height: 575,
  status: "processed",
  image_url: "https://storage-ct.lrclib.net/file/cuutruyen/uploads/page/1363975/image/scrambled-7a23bfd6060d8ff71cb66dd7de68536f.jpg",
  image_path: "/file/cuutruyen/uploads/page/1363975/image/scrambled-7a23bfd6060d8ff71cb66dd7de68536f.jpg",
  image_url_size: 252620,
  drm_data: "EEcATQYJAhsEBgVECRoIBgNNAAQFFAMEAE8EDQkaCAYD\n"
};

// Base64 decode
function decodeBase64(input: string): Uint8Array {
  const binaryString = atob(input.replace(/\n/g, '')); // remove newlines
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// XOR decode
function decodeXorCipher(data: Uint8Array, key: string): Uint8Array {
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

// Rectクラス (矩形を表現)
class Rect {
  constructor(
    public left: number,
    public top: number,
    public right: number,
    public bottom: number
  ) {}

  get width() {
    return this.right - this.left;
  }

  get height() {
    return this.bottom - this.top;
  }
}

// Bitmapクラス (Canvasを使って画像操作する)
class Bitmap {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
  }

  static async fromImageUrl(url: string): Promise<Bitmap> {
    const img = new Image();
    img.crossOrigin = "anonymous"; // CORS対応
    img.src = url;
    await img.decode(); // wait for loading

    const bmp = new Bitmap(img.width, img.height);
    bmp.ctx.drawImage(img, 0, 0);
    return bmp;
  }

  drawBitmap(src: Bitmap, srcRect: Rect, dstRect: Rect) {
    this.ctx.drawImage(
      src.ctx.canvas,
      srcRect.left,
      srcRect.top,
      srcRect.width,
      srcRect.height,
      dstRect.left,
      dstRect.top,
      dstRect.width,
      dstRect.height
    );
  }

  toDataURL() {
    return this.ctx.canvas.toDataURL();
  }

  toCanvas() {
    return this.ctx.canvas;
  }
}

// 画像復元処理
function unscrambleImage(bitmap: Bitmap, drmData: string, decryptionKey: string = atob(DECRYPTION_KEY.slice(0, -2))): Bitmap {
  const data = new TextDecoder()
    .decode(decodeXorCipher(decodeBase64(drmData), decryptionKey));

  if (!data.startsWith("#v4|")) {
    throw new Error(`Invalid DRM data (does not start with expected magic bytes): ${data}`);
  }

  const result = new Bitmap(bitmap.width, bitmap.height);

  let sy = 0;
  const parts = data.split('|').slice(1);
  console.log(parts)
  for (const t of parts) {
    const [dy, height] = t.split('-').map(Number);
    const srcRect = new Rect(0, sy, bitmap.width, sy + height);
    const dstRect = new Rect(0, dy, bitmap.width, dy + height);

    result.drawBitmap(bitmap, srcRect, dstRect);
    sy += height;
  }

  return result;
}// メイン処理
async function main() {
  try {
    const scrambledBitmap = await Bitmap.fromImageUrl(page.image_url);
    const decodedBitmap = unscrambleImage(scrambledBitmap, page.drm_data);

    left.appendChild(scrambledBitmap.toCanvas());

    const decodedTitle = document.createElement('h2');
    
    right.appendChild(decodedBitmap.toCanvas());
  } catch (error) {
    console.error('Failed to decode image:', error);
  }
}

// 実行
main();
