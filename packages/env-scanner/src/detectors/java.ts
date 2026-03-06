import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { RuntimeVersion, ScannerOptions } from '../types.js';

const JAVA_CONFIG_FILES = [
  '.sdkmanrc',
  '.java-version',
  '.jabbarc',
  'build.gradle',
  'build.gradle.kts',
  '.tool-versions',
];

export async function detectJavaVersion(
  rootDir: string,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const versions: RuntimeVersion[] = [];
  const searchDir = options.rootDir ?? rootDir;

  for (const file of JAVA_CONFIG_FILES) {
    const filePath = path.join(searchDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = parseJavaVersionFile(file, content, filePath);
      if (detected) {
        versions.push(detected);
      }
    } catch {
      // File doesn't exist
    }
  }

  // Check environment variables
  if (process.env.JENV_VERSION) {
    versions.push({
      runtime: 'java',
      version: process.env.JENV_VERSION,
      source: { type: 'env', description: 'JENV_VERSION environment variable' },
      manager: 'jenv',
    });
  }

  return dedupeVersions(versions);
}

function parseJavaVersionFile(
  fileName: string,
  content: string,
  filePath: string
): RuntimeVersion | null {
  switch (fileName) {
    case '.sdkmanrc': {
      const match = content.match(/^java\s*=\s*(.+)$/m);
      if (match?.[1]) {
        return {
          runtime: 'java',
          version: match[1].trim(),
          source: { type: 'file', description: '.sdkmanrc' },
          configFile: filePath,
          manager: 'sdkman',
        };
      }
      break;
    }

    case '.java-version': {
      const version = content.trim();
      if (version) {
        return {
          runtime: 'java',
          version,
          source: { type: 'file', description: '.java-version' },
          configFile: filePath,
        };
      }
      break;
    }

    case '.jabbarc': {
      const version = content.trim();
      if (version) {
        return {
          runtime: 'java',
          version,
          source: { type: 'file', description: '.jabbarc' },
          configFile: filePath,
          manager: 'jabba',
        };
      }
      break;
    }

    case 'build.gradle':
    case 'build.gradle.kts': {
      const toolchainMatch = content.match(/languageVersion\s*=\s*JavaLanguageVersion\.of\((\d+)\)/);
      if (toolchainMatch?.[1]) {
        return {
          runtime: 'java',
          version: toolchainMatch[1],
          source: { type: 'package', description: `${fileName} toolchain` },
          configFile: filePath,
        };
      }
      const sourceCompatMatch = content.match(/sourceCompatibility\s*=\s*['"]?(\d+|1\.?\d*)['"]?/);
      if (sourceCompatMatch?.[1]) {
        const version = sourceCompatMatch[1].replace('1.', '');
        return {
          runtime: 'java',
          version,
          source: { type: 'package', description: `${fileName} sourceCompatibility` },
          configFile: filePath,
        };
      }
      break;
    }

    case '.tool-versions': {
      const match = content.match(/^java\s+(\S+)/m);
      if (match?.[1]) {
        return {
          runtime: 'java',
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
