import LZString from 'lz-string';
import { ShareablePlan, ShareableAnnotation, Annotation } from '../types';

/**
 * Compress ShareablePlan to URL-safe string
 */
export function compressPlan(plan: ShareablePlan): string {
  const json = JSON.stringify(plan);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decompress URL hash back to ShareablePlan
 */
export function decompressPlan(compressed: string): ShareablePlan | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return JSON.parse(json) as ShareablePlan;
  } catch {
    return null;
  }
}

/**
 * Base URL for sharing - use web app URL
 */
const SHARE_BASE_URL = import.meta.env.VITE_SHARE_URL || 'http://localhost:3001';

/**
 * Generate a share URL from a ShareablePlan
 */
export function generateShareUrl(plan: ShareablePlan): string {
  const compressed = compressPlan(plan);
  return `${SHARE_BASE_URL}/share#${compressed}`;
}

/**
 * Convert Plan content + annotations to ShareablePlan
 */
export function createShareablePlan(
  content: string,
  title: string,
  annotations: Annotation[],
  sharedBy?: string,
  authorColor?: string
): ShareablePlan {
  return {
    title,
    content,
    createdAt: Date.now(),
    sharedBy,
    sharedAt: Date.now(),
    annotations: annotations.map(ann => ({
      ...ann,
      authorName: ann.author || sharedBy || 'Anonymous',
      authorColor: authorColor,
    })) as ShareableAnnotation[],
    version: 1,
  };
}

/**
 * Merge new annotations with existing ones from a shared plan
 */
export function mergeAnnotations(
  existing: ShareableAnnotation[],
  newAnnotations: Annotation[],
  authorName: string,
  authorColor: string
): ShareableAnnotation[] {
  const merged = [...existing];

  for (const ann of newAnnotations) {
    // Check if this annotation already exists (by id)
    if (!merged.find(e => e.id === ann.id)) {
      merged.push({
        ...ann,
        author: authorName,
        authorName,
        authorColor,
      });
    }
  }

  return merged;
}

/**
 * Estimate the URL length for a plan
 * Returns true if likely within safe browser limits
 */
export function isUrlLengthSafe(plan: ShareablePlan): boolean {
  const compressed = compressPlan(plan);
  // Safe limit is around 2000 chars, but modern browsers support ~8000
  return compressed.length < 6000;
}

/**
 * Get the compressed size of a plan in bytes
 */
export function getCompressedSize(plan: ShareablePlan): number {
  return compressPlan(plan).length;
}
