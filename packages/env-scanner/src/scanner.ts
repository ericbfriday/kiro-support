import type { RuntimeInfo, ScannerOptions, RuntimeType, RuntimeVersion } from './types.js';
import { detectNodeVersion } from './detectors/node.js';
import { detectPythonVersion } from './detectors/python.js';
import { detectJavaVersion } from './detectors/java.js';
import { detectRubyVersion, detectGoVersion, detectRustVersion, detectDotnetVersion, detectPhpVersion } from './detectors/ruby-go-rust.js';
import { detectCIEnvironment } from './detectors/ci.js';
import { detectVersionManagers } from './detectors/manager.js';

const ALL_RUNTIMES: RuntimeType[] = ['node', 'python', 'java', 'ruby', 'go', 'rust', 'dotnet', 'php'];

export async function scanEnvironment(options: ScannerOptions = {}): Promise<RuntimeInfo> {
  const rootDir = options.rootDir ?? process.cwd();
  const runtimes = options.runtimes ?? ALL_RUNTIMES;

  const versionPromises: Promise<RuntimeVersion[]>[] = [];

  if (runtimes.includes('node')) {
    versionPromises.push(detectNodeVersion(rootDir, options));
  }
  if (runtimes.includes('python')) {
    versionPromises.push(detectPythonVersion(rootDir, options));
  }
  if (runtimes.includes('java')) {
    versionPromises.push(detectJavaVersion(rootDir, options));
  }
  if (runtimes.includes('ruby')) {
    versionPromises.push(detectRubyVersion(rootDir, options));
  }
  if (runtimes.includes('go')) {
    versionPromises.push(detectGoVersion(rootDir, options));
  }
  if (runtimes.includes('rust')) {
    versionPromises.push(detectRustVersion(rootDir, options));
  }
  if (runtimes.includes('dotnet')) {
    versionPromises.push(detectDotnetVersion(rootDir, options));
  }
  if (runtimes.includes('php')) {
    versionPromises.push(detectPhpVersion(rootDir, options));
  }

  const [versionResults, managers, ciEnvironment] = await Promise.all([
    Promise.all(versionPromises),
    Promise.resolve(detectVersionManagers()),
    detectCIEnvironment(rootDir),
  ]);

  const versions = versionResults.flat();

  const result: RuntimeInfo = {
    versions,
    managers,
  };

  if (ciEnvironment) {
    result.ciEnvironment = ciEnvironment;
  }

  return result;
}

export async function scanRuntime(
  runtime: RuntimeType,
  options: ScannerOptions = {}
): Promise<RuntimeVersion[]> {
  const rootDir = options.rootDir ?? process.cwd();

  switch (runtime) {
    case 'node':
      return detectNodeVersion(rootDir, options);
    case 'python':
      return detectPythonVersion(rootDir, options);
    case 'java':
      return detectJavaVersion(rootDir, options);
    case 'ruby':
      return detectRubyVersion(rootDir, options);
    case 'go':
      return detectGoVersion(rootDir, options);
    case 'rust':
      return detectRustVersion(rootDir, options);
    case 'dotnet':
      return detectDotnetVersion(rootDir, options);
    case 'php':
      return detectPhpVersion(rootDir, options);
  }
}
