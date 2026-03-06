import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const MAX_FILE_SIZE = 250 * 1024; // 250KB

export interface LiveReference {
  path: string;
  type: 'file';
  exists: boolean;
  size?: number;
}

export function parseLiveReferences(content: string): string[] {
  const pattern = /#\[\[file:([^\]]+)\]\]/g;
  const references: string[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    references.push(match[1]!);
  }

  return references;
}

export function generateLiveReference(filePath: string): string {
  return `#[[file:${filePath}]]`;
}

export async function resolveLiveReference(
  refPath: string,
  rootDir: string
): Promise<LiveReference> {
  const fullPath = path.join(rootDir, refPath);
  
  try {
    const stats = await fs.stat(fullPath);
    return {
      path: refPath,
      type: 'file',
      exists: true,
      size: stats.size,
    };
  } catch {
    return {
      path: refPath,
      type: 'file',
      exists: false,
    };
  }
}

export async function resolveAllReferences(
  content: string,
  rootDir: string
): Promise<LiveReference[]> {
  const refPaths = parseLiveReferences(content);
  return Promise.all(refPaths.map((p) => resolveLiveReference(p, rootDir)));
}

export function isValidReferencePath(refPath: string): boolean {
  if (refPath.includes('..')) return false;
  if (refPath.startsWith('/')) return false;
  if (refPath.startsWith('~')) return false;
  return true;
}

export function isWithinSizeLimit(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}
