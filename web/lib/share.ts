import LZString from 'lz-string';

export enum AnnotationType {
  DELETION = 'DELETION',
  INSERTION = 'INSERTION',
  REPLACEMENT = 'REPLACEMENT',
  COMMENT = 'COMMENT',
  GLOBAL_COMMENT = 'GLOBAL_COMMENT',
}

export interface Annotation {
  id: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  type: AnnotationType;
  text?: string;
  originalText: string;
  createdAt: number;
  author?: string;
  startMeta?: {
    parentTagName: string;
    parentIndex: number;
    textOffset: number;
  };
  endMeta?: {
    parentTagName: string;
    parentIndex: number;
    textOffset: number;
  };
}

export interface ShareableAnnotation extends Annotation {
  authorName: string;
  authorColor?: string;
}

export interface ShareablePlan {
  title: string;
  content: string;
  createdAt: number;
  sharedBy?: string;
  sharedAt?: number;
  annotations: ShareableAnnotation[];
  version: number;
}

export interface AuthorIdentity {
  name: string;
  color: string;
}

export interface Block {
  id: string;
  type: 'paragraph' | 'heading' | 'blockquote' | 'list-item' | 'code' | 'hr' | 'table';
  content: string;
  level?: number;
  language?: string;
  checked?: boolean;
  order: number;
  startLine: number;
}

/**
 * Compress ShareablePlan to URL-safe string using lz-string
 */
export function compressPlan(plan: ShareablePlan): string {
  const json = JSON.stringify(plan);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decompress URL hash back to ShareablePlan using lz-string
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
 * Generate a share URL from a ShareablePlan
 */
export function generateShareUrl(plan: ShareablePlan): string {
  const compressed = compressPlan(plan);
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://heymedusa.net';
  return `${baseUrl}/share#${compressed}`;
}

/**
 * Create a ShareablePlan from content and annotations
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
 * Check if URL length is within safe limits
 */
export function isUrlLengthSafe(plan: ShareablePlan): boolean {
  const compressed = compressPlan(plan);
  return compressed.length < 6000;
}

/**
 * Get random author color
 */
export function getRandomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
