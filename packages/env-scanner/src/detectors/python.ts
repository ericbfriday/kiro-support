import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { parse as parseToml } from 'toml';
import type { RuntimeVersion, ScannerOptions } from '../types.js';

const PYTHON_CONFIG_FILES = [
  '.python-version',
  'pyproject.toml',
  'Pipfile',
  'environment.yml',
  '.tool-versions',
];

export async function detectPythonVersion(
  rootDir: string,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const versions: RuntimeVersion[] = [];
  const searchDir = options.rootDir ?? rootDir;

  for (const file of PYTHON_CONFIG_FILES) {
    const filePath = path.join(searchDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = await parsePythonVersionFile(file, content, filePath);
      if (detected) {
        versions.push(detected);
      }
    } catch {
      // File doesn't exist
    }
  }

  // Check environment variables
  if (process.env.PYENV_VERSION) {
    versions.push({
      runtime: 'python',
      version: process.env.PYENV_VERSION,
      source: { type: 'env', description: 'PYENV_VERSION environment variable' },
      manager: 'pyenv',
    });
  }

  return dedupeVersions(versions);
}

async function parsePythonVersionFile(
  fileName: string,
  content: string,
  filePath: string
): Promise<RuntimeVersion | null> {
  switch (fileName) {
    case '.python-version': {
      const version = content.trim();
      if (version) {
        return {
          runtime: 'python',
          version,
          source: { type: 'file', description: '.python-version file' },
          configFile: filePath,
        };
      }
      break;
    }

    case 'pyproject.toml': {
      try {
        const parsed = parseToml(content);
        // Poetry
        if (parsed.tool?.poetry?.dependencies?.python) {
          const versionSpec = parsed.tool.poetry.dependencies.python;
          const version = extractPythonVersion(versionSpec);
          if (version) {
            return {
              runtime: 'python',
              version,
              source: { type: 'package', description: 'pyproject.toml (Poetry)' },
              configFile: filePath,
              manager: 'poetry',
            };
          }
        }
        // PEP 621
        if (parsed.project?.['requires-python']) {
          const version = extractPythonVersion(parsed.project['requires-python']);
          if (version) {
            return {
              runtime: 'python',
              version,
              source: { type: 'package', description: 'pyproject.toml (PEP 621)' },
              configFile: filePath,
            };
          }
        }
      } catch {
        // Invalid TOML
      }
      break;
    }

    case 'Pipfile': {
      try {
        const parsed = parseToml(content);
        if (parsed.requires?.python_version) {
          return {
            runtime: 'python',
            version: parsed.requires.python_version,
            source: { type: 'package', description: 'Pipfile' },
            configFile: filePath,
            manager: 'pipenv',
          };
        }
      } catch {
        // Pipfile might be TOML or might fail
      }
      break;
    }

    case 'environment.yml': {
      try {
        const parsed = parseYaml(content);
        const deps = parsed.dependencies;
        if (Array.isArray(deps)) {
          for (const dep of deps) {
            if (typeof dep === 'string' && dep.startsWith('python=')) {
              const version = dep.replace('python=', '');
              return {
                runtime: 'python',
                version,
                source: { type: 'package', description: 'environment.yml (conda)' },
                configFile: filePath,
                manager: 'conda',
              };
            }
          }
        }
      } catch {
        // Invalid YAML
      }
      break;
    }

    case '.tool-versions': {
      const match = content.match(/^python\s+(\S+)/m);
      if (match?.[1]) {
        return {
          runtime: 'python',
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

function extractPythonVersion(versionSpec: string): string | null {
  const cleaned = versionSpec.replace(/[<>=~^]/g, '').trim();
  return cleaned || null;
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
