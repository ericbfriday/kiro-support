import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { parse as parseToml } from 'toml';
import type { RuntimeVersion, ScannerOptions } from '../types.js';

const RUBY_CONFIG_FILES = ['.ruby-version', '.rvmrc', '.tool-versions', 'Gemfile'];
const GO_CONFIG_FILES = ['go.mod', 'go.work', '.tool-versions'];
const RUST_CONFIG_FILES = ['rust-toolchain.toml', 'rust-toolchain', '.tool-versions'];
const DOTNET_CONFIG_FILES = ['global.json', '.tool-versions'];
const PHP_CONFIG_FILES = ['.php-version', 'composer.json', '.tool-versions'];

export async function detectRubyVersion(
  rootDir: string,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const versions: RuntimeVersion[] = [];
  const searchDir = options.rootDir ?? rootDir;

  for (const file of RUBY_CONFIG_FILES) {
    const filePath = path.join(searchDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = parseRubyVersionFile(file, content, filePath);
      if (detected) versions.push(detected);
    } catch {}
  }

  if (process.env.RBENV_VERSION) {
    versions.push({
      runtime: 'ruby',
      version: process.env.RBENV_VERSION,
      source: { type: 'env', description: 'RBENV_VERSION' },
      manager: 'rbenv',
    });
  }

  return dedupeVersions(versions);
}

export async function detectGoVersion(
  rootDir: string,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const versions: RuntimeVersion[] = [];
  const searchDir = options.rootDir ?? rootDir;

  for (const file of GO_CONFIG_FILES) {
    const filePath = path.join(searchDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = parseGoVersionFile(file, content, filePath);
      if (detected) versions.push(detected);
    } catch {}
  }

  return dedupeVersions(versions);
}

export async function detectRustVersion(
  rootDir: string,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const versions: RuntimeVersion[] = [];
  const searchDir = options.rootDir ?? rootDir;

  for (const file of RUST_CONFIG_FILES) {
    const filePath = path.join(searchDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = parseRustVersionFile(file, content, filePath);
      if (detected) versions.push(detected);
    } catch {}
  }

if (process.env.RUSTUP_TOOLCHAIN) {
    const match = process.env.RUSTUP_TOOLCHAIN.match(/(\d+\.\d+\.\d+)/);
    if (match?.[1]) {
      versions.push({
        runtime: 'rust',
        version: match[1],
        source: { type: 'env', description: 'RUSTUP_TOOLCHAIN' },
        manager: 'rustup',
      });
    }
  }

  return dedupeVersions(versions);
}

export async function detectDotnetVersion(
  rootDir: string,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const versions: RuntimeVersion[] = [];
  const searchDir = options.rootDir ?? rootDir;

  for (const file of DOTNET_CONFIG_FILES) {
    const filePath = path.join(searchDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = parseDotnetVersionFile(file, content, filePath);
      if (detected) versions.push(detected);
    } catch {}
  }

  return dedupeVersions(versions);
}

export async function detectPhpVersion(
  rootDir: string,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const versions: RuntimeVersion[] = [];
  const searchDir = options.rootDir ?? rootDir;

  for (const file of PHP_CONFIG_FILES) {
    const filePath = path.join(searchDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const detected = parsePhpVersionFile(file, content, filePath);
      if (detected) versions.push(detected);
    } catch {}
  }

  if (process.env.PHPENV_VERSION) {
    versions.push({
      runtime: 'php',
      version: process.env.PHPENV_VERSION,
      source: { type: 'env', description: 'PHPENV_VERSION' },
      manager: 'phpenv',
    });
  }

  return dedupeVersions(versions);
}

// Parsing functions

function parseRubyVersionFile(
  fileName: string,
  content: string,
  filePath: string
): RuntimeVersion | null {
  switch (fileName) {
    case '.ruby-version':
    case '.rvmrc': {
      const version = content.trim().replace(/^ruby-/, '');
      if (version) {
        return {
          runtime: 'ruby',
          version,
          source: { type: 'file', description: fileName },
          configFile: filePath,
        };
      }
      break;
    }
    case '.tool-versions': {
      const match = content.match(/^ruby\s+(\S+)/m);
      if (match?.[1]) {
        return {
          runtime: 'ruby',
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

function parseGoVersionFile(
  fileName: string,
  content: string,
  filePath: string
): RuntimeVersion | null {
  switch (fileName) {
    case 'go.mod': {
      const match = content.match(/^go\s+(\d+\.\d+(?:\.\d+)?)/m);
      if (match?.[1]) {
        return {
          runtime: 'go',
          version: match[1],
          source: { type: 'file', description: 'go.mod' },
          configFile: filePath,
        };
      }
      break;
    }
    case 'go.work': {
      const match = content.match(/^go\s+(\d+\.\d+(?:\.\d+)?)/m);
      if (match?.[1]) {
        return {
          runtime: 'go',
          version: match[1],
          source: { type: 'file', description: 'go.work' },
          configFile: filePath,
        };
      }
      break;
    }
    case '.tool-versions': {
      const match = content.match(/^golang\s+(\S+)/m);
      if (match?.[1]) {
        return {
          runtime: 'go',
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

function parseRustVersionFile(
  fileName: string,
  content: string,
  filePath: string
): RuntimeVersion | null {
  switch (fileName) {
    case 'rust-toolchain.toml': {
      try {
        const parsed = parseToml(content);
        if (parsed.toolchain?.channel) {
          return {
            runtime: 'rust',
            version: parsed.toolchain.channel,
            source: { type: 'file', description: 'rust-toolchain.toml' },
            configFile: filePath,
            manager: 'rustup',
          };
        }
      } catch {}
      break;
    }
    case 'rust-toolchain': {
      const version = content.trim();
      if (version) {
        return {
          runtime: 'rust',
          version,
          source: { type: 'file', description: 'rust-toolchain' },
          configFile: filePath,
          manager: 'rustup',
        };
      }
      break;
    }
    case '.tool-versions': {
      const match = content.match(/^rust\s+(\S+)/m);
      if (match?.[1]) {
        return {
          runtime: 'rust',
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

function parseDotnetVersionFile(
  fileName: string,
  content: string,
  filePath: string
): RuntimeVersion | null {
  switch (fileName) {
    case 'global.json': {
      try {
        const parsed = JSON.parse(content);
        if (parsed.sdk?.version) {
          return {
            runtime: 'dotnet',
            version: parsed.sdk.version,
            source: { type: 'file', description: 'global.json' },
            configFile: filePath,
          };
        }
      } catch {}
      break;
    }
    case '.tool-versions': {
      const match = content.match(/^dotnet-core\s+(\S+)/m);
      if (match?.[1]) {
        return {
          runtime: 'dotnet',
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

function parsePhpVersionFile(
  fileName: string,
  content: string,
  filePath: string
): RuntimeVersion | null {
  switch (fileName) {
    case '.php-version': {
      const version = content.trim();
      if (version) {
        return {
          runtime: 'php',
          version,
          source: { type: 'file', description: '.php-version' },
          configFile: filePath,
        };
      }
      break;
    }
    case 'composer.json': {
      try {
        const parsed = JSON.parse(content);
        if (parsed.require?.php) {
          const version = parsed.require.php.replace(/[<>=~^]/g, '').trim();
          if (version) {
            return {
              runtime: 'php',
              version,
              source: { type: 'package', description: 'composer.json require.php' },
              configFile: filePath,
            };
          }
        }
      } catch {}
      break;
    }
    case '.tool-versions': {
      const match = content.match(/^php\s+(\S+)/m);
      if (match?.[1]) {
        return {
          runtime: 'php',
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
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
