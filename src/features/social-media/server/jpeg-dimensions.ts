/**
 * Minimal JPEG SOF dimension reader + Instagram feed aspect validation.
 */

import "server-only";

const JPEG_SOI0 = 0xff;
const JPEG_SOI1 = 0xd8;
const MIN_FEED_WIDTH = 320;
const MAX_FEED_WIDTH = 1440;
const MIN_ASPECT = 4 / 5;
const MAX_ASPECT = 1.91;

export type JpegDimensions = {
  width: number;
  height: number;
};

export function isJpegMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 2 && bytes[0] === JPEG_SOI0 && bytes[1] === JPEG_SOI1
  );
}

/**
 * Read width/height from the first SOF0/SOF2 marker.
 * Returns null when the buffer is not a parseable baseline/progressive JPEG.
 */
export function readJpegDimensions(bytes: Uint8Array): JpegDimensions | null {
  if (!isJpegMagic(bytes) || bytes.length < 4) {
    return null;
  }

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === undefined) {
      return null;
    }
    // Soft markers without length
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
      offset += 2;
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      offset += 2;
      continue;
    }
    if (offset + 3 >= bytes.length) {
      return null;
    }
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    if (length < 2 || offset + 2 + length > bytes.length) {
      return null;
    }
    // SOF0 / SOF2 (baseline / progressive)
    if (marker === 0xc0 || marker === 0xc2) {
      if (length < 7) {
        return null;
      }
      const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!;
      const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!;
      if (width <= 0 || height <= 0) {
        return null;
      }
      return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

export function isValidInstagramFeedImageDimensions(
  width: number,
  height: number,
): boolean {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < MIN_FEED_WIDTH ||
    width > MAX_FEED_WIDTH ||
    height <= 0
  ) {
    return false;
  }
  const aspect = width / height;
  return aspect + Number.EPSILON >= MIN_ASPECT && aspect - Number.EPSILON <= MAX_ASPECT;
}

export function isValidInstagramStoryImagePixelSize(
  width: number,
  height: number,
): boolean {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width > 0 &&
    height > 0
  );
}
