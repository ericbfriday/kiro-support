import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { RuntimeVersion, ScannerOptions } from '../types.js';

const NODE_CONFIG_FILES = ['.nvmrc', '.node-version', 'package.json', '.tool-versions'];

export async function detectNodeVersion(
  rootDir: string,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const versions: RuntimeVersion[] = [];
  const searchDir = options.rootDir ?? rootDir;

  for (const file of NODE_CONFIG_FILES) {
    const filePath = path.join(searchDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = await parseNodeVersionFile(file, content, filePath);
      if (detected) {
        versions.push(detected);
      }
    } catch {
      // File doesn't exist, continue
    }
  }

  // Check environment variable
  if (process.env.NODE_VERSION) {
    versions.push({
      runtime: 'node',
      version: process.env.NODE_VERSION,
      source: { type: 'env', description: 'NODE_VERSION environment variable' },
    });
  }

  return dedupeVersions(versions);
}

async function parseNodeVersionFile(
  fileName: string,
  content: string,
  filePath: string
): Promise<RuntimeVersion | null> {
  switch (fileName) {
    case '.nvmrc': {
      const version = content.trim().replace(/^v/, '');
      if (version && version !== 'lts/*' && version !== 'node') {
        return {
          runtime: 'node',
          version,
          source: { type: 'file', description: '.nvmrc file' },
          configFile: filePath,
        };
      }
      break;
    }

    case '.node-version': {
      const version = content.trim().replace(/^v/, '');
      if (version) {
        return {
          runtime: 'node',
          version,
          source: { type: 'file', description: '.node-version file' },
          configFile: filePath,
        };
      }
      break;
    }

    case 'package.json': {
      try {
        const pkg = JSON.parse(content);
        // Volta
        if (pkg.volta?.node) {
          return {
            runtime: 'node',
            version: pkg.volta.node,
            source: { type: 'package', description: 'package.json volta.node' },
            configFile: filePath,
            manager: 'volta',
          };
        }
        // engines
        if (pkg.engines?.node) {
          const versionSpec = pkg.engines.node;
          const version = extractMinVersion(versionSpec);
          if (version) {
            return {
              runtime: 'node',
              version,
              source: { type: 'package', description: 'package.json engines.node' },
              configFile: filePath,
            };
          }
        }
      } catch {
        // Invalid JSON
      }
      break;
    }

    case '.tool-versions': {
      const match = content.match(/^nodejs\s+(\S+)/m);
      if (match?.[1]) {
        return {
          runtime: 'node',
          version: match[1],
          source: { type: 'file', description: '.tool-versions (asdf)' },
          configFile: filePath,
          manager: 'asdf',
        };
      }
      break;
    }
  }

  return null;
}

function extractMinVersion(versionSpec: string): string | null {
  const cleaned = versionSpec
    .replace(/[<>=~^]/g, '')
    .replace(/\s*x\s*/g, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts[0] ?? null;
}

function dedupeVersions(versions: RuntimeVersion[]): RuntimeVersion[] {
  const seen = new Set<string>();
  return versions.filter((v) => {
    const key = `${v.runtime}:${v.version}:${v.source.type}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
