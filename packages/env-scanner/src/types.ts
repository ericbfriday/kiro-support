/**
 * Core types for environment scanning
 */

export interface RuntimeVersion {
  /** Runtime name (node, python, java, etc.) */
  runtime: string;
  /** Detected version string */
  version: string;
  /** Source of the version detection */
  source: VersionSource;
  /** Path to the config file (if applicable) */
  configFile?: string;
  /** Version manager that manages this runtime (if any) */
  manager?: string;
}

export interface VersionSource {
  /** Type of source */
  type: 'env' | 'file' | 'package' | 'manager';
  /** Human-readable description */
  description: string;
}

export interface RuntimeInfo {
  /** Detected runtime versions */
  versions: RuntimeVersion[];
  /** Detected version managers */
  managers: DetectedManager[];
  /** CI/CD environment (if detected) */
  ciEnvironment?: CIEnvironment;
}

export interface DetectedManager {
  /** Manager name (nvm, pyenv, etc.) */
  name: string;
  /** Whether the manager is active in current environment */
  active: boolean;
  /** Path to manager installation (if detectable) */
  path?: string;
  /** Environment variable that indicates manager presence */
  envVar?: string;
}

export interface CIEnvironment {
  /** CI platform name */
  platform: 'github' | 'gitlab' | 'jenkins' | 'circleci' | 'azure' | 'bitbucket' | 'docker' | 'unknown';
  /** Detected CI-specific versions */
  versions: RuntimeVersion[];
  /** Path to CI config file */
  configFile?: string;
}

export interface ScannerOptions {
  /** Root directory to scan (defaults to cwd) */
  rootDir?: string;
  /** Runtimes to detect (defaults to all) */
  runtimes?: RuntimeType[];
  /** Whether to search parent directories */
  searchParentDirs?: boolean;
  /** Maximum parent directories to search */
  maxParentDepth?: number;
}

export type RuntimeType = 
  | 'node' 
  | 'python' 
  | 'java' 
  | 'ruby' 
  | 'go' 
  | 'rust' 
  | 'dotnet' 
  | 'php';

export const RUNTIME_CONFIG_FILES: Record<RuntimeType, string[]> = {
  node: ['.nvmrc', '.node-version', 'package.json', '.tool-versions'],
  python: ['.python-version', 'pyproject.toml', 'Pipfile', 'environment.yml', '.tool-versions'],
  java: ['.sdkmanrc', '.java-version', '.jabbarc', 'build.gradle', 'build.gradle.kts', '.tool-versions'],
  ruby: ['.ruby-version', '.rvmrc', '.tool-versions', 'Gemfile'],
  go: ['go.mod', 'go.work', '.tool-versions'],
  rust: ['rust-toolchain.toml', 'rust-toolchain', '.tool-versions'],
  dotnet: ['global.json', '.tool-versions'],
  php: ['.php-version', 'composer.json', '.tool-versions'],
};

export const VERSION_MANAGER_ENV_VARS: Record<string, string> = {
  // Node.js
  nvm: 'NVM_DIR',
  fnm: 'FNM_DIR',
  volta: 'VOLTA_HOME',
  nodenv: 'NODENV_ROOT',
  // Python
  pyenv: 'PYENV_VERSION',
  conda: 'CONDA_PREFIX',
  // Java
  sdkman: 'SDKMAN_DIR',
  jenv: 'JENV_VERSION',
  jabba: 'JABBA_HOME',
  // Ruby
  rbenv: 'RBENV_VERSION',
  rvm: 'rvm_path',
  // Go
  gvm: 'GVM_ROOT',
  // PHP
  phpenv: 'PHPENV_VERSION',
  // Universal
  asdf: 'ASDF_DIR',
};
