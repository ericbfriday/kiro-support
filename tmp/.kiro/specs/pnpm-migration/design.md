# Design Document: pnpm Migration

## Overview

This design specifies the implementation of a complete migration from npm to pnpm for the Jira MCP monorepo workspace. The workspace currently has partial pnpm setup (pnpm-workspace.yaml exists, packageManager field is configured) but still uses npm commands and artifacts. This migration will complete the transition to pnpm, enabling faster installs, better disk space efficiency through content-addressable storage, and stricter dependency management.

The migration will be implemented as an automated script that:
1. Removes npm-specific artifacts (package-lock.json, npm cache)
2. Updates root package.json to use pnpm conventions
3. Configures pnpm workspace and settings files
4. Updates all documentation to reference pnpm commands
5. Updates CI/CD pipelines to use pnpm
6. Validates the migration through install, build, and test execution

The migration preserves all existing workspace structure, dependencies, and configurations while ensuring compatibility with Volta toolchain management.

## Architecture

### Migration Script Architecture

The migration will be implemented as a single Node.js script (`tools/scripts/migrate-to-pnpm.js`) that executes the following phases:

```
┌─────────────────────────────────────────────────────────────┐
│                    Migration Script                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Phase 1: Cleanup                                            │
│  ├─ Remove package-lock.json                                 │
│  ├─ Remove .package-lock.json from node_modules              │
│  └─ Remove npm cache directories                             │
│                                                               │
│  Phase 2: Package Configuration                              │
│  ├─ Update root package.json                                 │
│  │  ├─ Remove "workspaces" field                             │
│  │  ├─ Remove "npm" from engines                             │
│  │  ├─ Remove "npm" from volta                               │
│  │  ├─ Update build script to pnpm                           │
│  │  └─ Update test script to pnpm                            │
│  └─ Preserve packageManager and volta.node                   │
│                                                               │
│  Phase 3: Workspace Configuration                            │
│  ├─ Update pnpm-workspace.yaml                               │
│  │  ├─ Add packages: ["libs/*", "servers/*"]                 │
│  │  └─ Preserve onlyBuiltDependencies                        │
│  └─ Create/update .npmrc                                     │
│     ├─ shamefully-hoist=false                                │
│     ├─ strict-peer-dependencies=false                        │
│     ├─ auto-install-peers=true                               │
│     └─ use-node-version=<volta-node-version>                 │
│                                                               │
│  Phase 4: Documentation Updates                              │
│  ├─ Update README.md                                         │
│  │  ├─ Replace "npm install" → "pnpm install"                │
│  │  ├─ Replace "npm run" → "pnpm run"                        │
│  │  └─ Replace "npm run build -w" → "pnpm run build -r"     │
│  └─ Update docs/*.md files                                   │
│                                                               │
│  Phase 5: CI/CD Updates                                      │
│  ├─ Update .gitlab-ci.yml                                    │
│  │  ├─ Add pnpm installation step                            │
│  │  ├─ Replace npm commands with pnpm                        │
│  │  └─ Configure pnpm store caching                          │
│  └─ Validate YAML syntax                                     │
│                                                               │
│  Phase 6: Validation                                         │
│  ├─ Run pnpm install                                         │
│  ├─ Run pnpm run build                                       │
│  └─ Run pnpm run test                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### File Modification Strategy

The script will use a safe file modification approach:
1. Read existing file content
2. Parse as JSON/YAML where applicable
3. Apply transformations programmatically
4. Validate syntax before writing
5. Write atomically (write to temp file, then rename)
6. Preserve file permissions and timestamps where possible

### Volta Integration

The migration maintains full compatibility with Volta:
- Volta's experimental pnpm support (VOLTA_FEATURE_PNPM=1) is already enabled in the environment
- The packageManager field in package.json pins the pnpm version
- The .npmrc file will include use-node-version to match Volta's node version
- Volta's shims will route pnpm commands to the correct version

## Components and Interfaces

### Migration Script Module Structure

```typescript
// tools/scripts/migrate-to-pnpm.js

interface MigrationConfig {
  rootDir: string;
  dryRun: boolean;
  verbose: boolean;
}

interface MigrationResult {
  success: boolean;
  phase: string;
  errors: string[];
  warnings: string[];
}

// Main entry point
async function migrate(config: MigrationConfig): Promise<MigrationResult>

// Phase implementations
async function cleanupNpmArtifacts(rootDir: string): Promise<void>
async function updatePackageJson(rootDir: string): Promise<void>
async function configureWorkspace(rootDir: string): Promise<void>
async function updateDocumentation(rootDir: string): Promise<void>
async function updateCICD(rootDir: string): Promise<void>
async function validateMigration(rootDir: string): Promise<void>

// Utility functions
function readJsonFile(path: string): Promise<any>
function writeJsonFile(path: string, data: any): Promise<void>
function readYamlFile(path: string): Promise<any>
function writeYamlFile(path: string, data: any): Promise<void>
function replaceInFile(path: string, replacements: Array<[RegExp, string]>): Promise<void>
function fileExists(path: string): Promise<boolean>
function removeFile(path: string): Promise<void>
```

### Package.json Transformations

**Before:**
```json
{
  "workspaces": ["libs/*", "servers/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces"
  },
  "engines": {
    "node": ">=24.8.0",
    "npm": ">=11.6.0"
  },
  "volta": {
    "node": "24.8.0",
    "npm": "11.6.0"
  }
}
```

**After:**
```json
{
  "scripts": {
    "build": "pnpm run build --recursive",
    "test": "pnpm run test --recursive"
  },
  "engines": {
    "node": ">=24.8.0"
  },
  "volta": {
    "node": "24.8.0"
  },
  "packageManager": "pnpm@10.25.0+sha512.5e82639027af37cf832061bcc6d639c219634488e0f2baebe785028a793de7b525ffcd3f7ff574f5e9860654e098fe852ba8ac5dd5cefe1767d23a020a92f501"
}
```

### pnpm-workspace.yaml Configuration

**Before:**
```yaml
onlyBuiltDependencies:
  - esbuild
```

**After:**
```yaml
packages:
  - 'libs/*'
  - 'servers/*'

onlyBuiltDependencies:
  - esbuild
```

### .npmrc Configuration

**New file:**
```ini
# Strict dependency resolution (no hoisting)
shamefully-hoist=false

# Allow flexible peer dependencies
strict-peer-dependencies=false

# Automatically install peer dependencies
auto-install-peers=true

# Use Node version from Volta
use-node-version=24.8.0
```

### CI/CD Pipeline Updates

**Before (.gitlab-ci.yml):**
```yaml
stages:
  - test
  - secret-detection

variables:
  SECRET_DETECTION_ENABLED: 'true'

secret_detection:
  stage: secret-detection

include:
  - template: Security/Secret-Detection.gitlab-ci.yml
```

**After (.gitlab-ci.yml):**
```yaml
stages:
  - test
  - secret-detection

variables:
  SECRET_DETECTION_ENABLED: 'true'
  PNPM_VERSION: '10.25.0'

# Install pnpm before any job that needs it
.pnpm-setup:
  before_script:
    - corepack enable
    - corepack prepare pnpm@${PNPM_VERSION} --activate
    - pnpm config set store-dir .pnpm-store

# Cache pnpm store for faster builds
cache:
  key:
    files:
      - pnpm-lock.yaml
  paths:
    - .pnpm-store

test:
  stage: test
  extends: .pnpm-setup
  script:
    - pnpm install --frozen-lockfile
    - pnpm run build
    - pnpm run test

secret_detection:
  stage: secret-detection

include:
  - template: Security/Secret-Detection.gitlab-ci.yml
```

## Data Models

### Migration State Tracking

The script will maintain state during execution to enable rollback on failure:

```typescript
interface MigrationState {
  phase: MigrationPhase;
  completedSteps: string[];
  backups: Map<string, string>; // filepath -> backup content
  timestamp: Date;
}

enum MigrationPhase {
  NOT_STARTED = 'not_started',
  CLEANUP = 'cleanup',
  PACKAGE_CONFIG = 'package_config',
  WORKSPACE_CONFIG = 'workspace_config',
  DOCUMENTATION = 'documentation',
  CICD = 'cicd',
  VALIDATION = 'validation',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

interface FileBackup {
  path: string;
  content: string;
  timestamp: Date;
}
```

### Configuration Models

```typescript
interface PackageJson {
  name: string;
  version: string;
  type?: string;
  private?: boolean;
  workspaces?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  volta?: {
    node?: string;
    npm?: string;
  };
  packageManager?: string;
}

interface PnpmWorkspace {
  packages?: string[];
  onlyBuiltDependencies?: string[];
}

interface NpmrcConfig {
  'shamefully-hoist'?: boolean;
  'strict-peer-dependencies'?: boolean;
  'auto-install-peers'?: boolean;
  'use-node-version'?: string;
}
```

### Documentation Update Patterns

```typescript
interface DocumentationReplacement {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const DOC_REPLACEMENTS: DocumentationReplacement[] = [
  {
    pattern: /npm install(?!\-)/g,
    replacement: 'pnpm install',
    description: 'Replace npm install with pnpm install'
  },
  {
    pattern: /npm run build --workspaces/g,
    replacement: 'pnpm run build --recursive',
    description: 'Replace npm workspace build with pnpm recursive'
  },
  {
    pattern: /npm run test --workspaces/g,
    replacement: 'pnpm run test --recursive',
    description: 'Replace npm workspace test with pnpm recursive'
  },
  {
    pattern: /npm run build -w (@[\w-]+\/[\w-]+)/g,
    replacement: 'pnpm run build --filter $1',
    description: 'Replace npm workspace filter with pnpm filter'
  },
  {
    pattern: /npm run (\w+) -w (@[\w-]+\/[\w-]+)/g,
    replacement: 'pnpm run $1 --filter $2',
    description: 'Replace npm workspace commands with pnpm filter'
  }
];
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Preservation Invariant

*For any* migration execution, all files and configuration fields that are not explicitly targeted for modification SHALL remain unchanged, including:
- pnpm-lock.yaml content
- packageManager field in root package.json
- volta.node field in root package.json
- onlyBuiltDependencies in pnpm-workspace.yaml
- All workspace package directories (libs/*, servers/*)
- All dependencies, devDependencies, and scripts in workspace package.json files
- biome.json configuration
- tsconfig.json configuration
- .env files
- .gitignore patterns

**Validates: Requirements 1.4, 2.6, 2.7, 3.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 2: YAML Validity

*For any* YAML file modified by the migration tool (pnpm-workspace.yaml, .gitlab-ci.yml), the resulting file SHALL be valid YAML that can be successfully parsed without errors.

**Validates: Requirements 3.3, 8.5**

### Property 3: Safe Text Replacement

*For any* text file updated by the migration tool (README.md, docs/*.md, .gitlab-ci.yml), all content that does not match the replacement patterns SHALL be preserved exactly, and all instances of npm-specific commands SHALL be replaced with their pnpm equivalents.

**Validates: Requirements 5.1, 5.2, 5.4, 8.1**

### Property 4: Configuration Consistency

*For any* configuration value that is derived from another configuration source (such as use-node-version in .npmrc derived from volta.node, or pnpm version in CI derived from packageManager field), the derived value SHALL match the source value exactly.

**Validates: Requirements 4.5, 8.4**

### Property 5: Error Reporting Quality

*For any* validation step that fails during migration, the error message SHALL include both the specific failure reason and actionable guidance for resolution.

**Validates: Requirements 6.4**

## Error Handling

### Error Categories

The migration script will handle errors in the following categories:

#### 1. File System Errors
- **Missing files**: If expected files (package.json, pnpm-workspace.yaml) are missing
- **Permission errors**: If files cannot be read or written
- **Disk space errors**: If insufficient space for operations

**Handling Strategy:**
- Fail fast with clear error message
- Indicate which file caused the issue
- Suggest corrective action (check permissions, free space, etc.)

#### 2. Parse Errors
- **Invalid JSON**: If package.json cannot be parsed
- **Invalid YAML**: If pnpm-workspace.yaml or .gitlab-ci.yml cannot be parsed

**Handling Strategy:**
- Report the specific syntax error and line number
- Suggest manual inspection and correction
- Do not proceed with migration if parse fails

#### 3. Validation Errors
- **pnpm install fails**: Dependencies cannot be installed
- **pnpm run build fails**: Build scripts fail
- **pnpm run test fails**: Tests fail

**Handling Strategy:**
- Report the specific command that failed
- Include the error output from the command
- Suggest checking pnpm-lock.yaml and workspace configuration
- Offer rollback option

#### 4. Configuration Errors
- **Missing Volta configuration**: No volta.node field found
- **Invalid packageManager field**: Cannot parse pnpm version
- **Workspace mismatch**: Packages in pnpm-workspace.yaml don't match actual directories

**Handling Strategy:**
- Report the specific configuration issue
- Suggest the expected format or value
- Provide example of correct configuration

### Rollback Mechanism

The migration script will implement a rollback mechanism:

1. **Backup Phase**: Before any modifications, create backups of all files to be modified
2. **State Tracking**: Track which phase is currently executing
3. **Failure Detection**: If any phase fails, immediately stop execution
4. **Rollback Execution**: Restore all backed-up files to their original state
5. **Cleanup**: Remove temporary files and backups after successful migration

```typescript
interface RollbackState {
  backups: Map<string, string>; // filepath -> original content
  modifiedFiles: string[];
  phase: MigrationPhase;
}

async function rollback(state: RollbackState): Promise<void> {
  console.log(`Rolling back migration from phase: ${state.phase}`);
  
  for (const [filepath, originalContent] of state.backups) {
    await fs.writeFile(filepath, originalContent, 'utf-8');
    console.log(`Restored: ${filepath}`);
  }
  
  console.log('Rollback complete. Workspace restored to pre-migration state.');
}
```

### Error Message Format

All error messages will follow this format:

```
[ERROR] <Phase>: <Specific Error>

Details:
<Error details and context>

Suggested Action:
<Actionable guidance for resolution>

Example:
<Example of correct configuration or command if applicable>
```

**Example Error Messages:**

```
[ERROR] Package Configuration: Failed to parse package.json

Details:
Unexpected token } in JSON at position 245
File: /path/to/package.json

Suggested Action:
Validate your package.json syntax using a JSON validator.
Check for missing commas, extra brackets, or trailing commas.

Example:
{
  "name": "my-package",
  "version": "1.0.0"
}
```

```
[ERROR] Validation: pnpm install failed

Details:
Command: pnpm install
Exit code: 1
Output: ERR_PNPM_NO_MATCHING_VERSION No matching version found for @jira-mcp/shared@workspace:*

Suggested Action:
1. Verify that pnpm-workspace.yaml includes the correct package patterns
2. Check that all workspace packages have valid package.json files
3. Run 'pnpm install' manually to see detailed error output

Example pnpm-workspace.yaml:
packages:
  - 'libs/*'
  - 'servers/*'
```

### Logging

The migration script will provide detailed logging:

- **INFO**: Normal progress messages (phase start/complete, file modifications)
- **WARN**: Non-fatal issues (optional files not found, skipped operations)
- **ERROR**: Fatal errors that stop migration
- **DEBUG**: Detailed operation information (enabled with --verbose flag)

**Log Format:**
```
[TIMESTAMP] [LEVEL] [PHASE] Message
```

**Example Log Output:**
```
[2026-03-02T22:30:00.000Z] [INFO] [CLEANUP] Starting npm artifact cleanup
[2026-03-02T22:30:00.100Z] [INFO] [CLEANUP] Removed package-lock.json
[2026-03-02T22:30:00.150Z] [WARN] [CLEANUP] .package-lock.json not found in node_modules (skipping)
[2026-03-02T22:30:00.200Z] [INFO] [CLEANUP] Cleanup phase complete
[2026-03-02T22:30:00.250Z] [INFO] [PACKAGE_CONFIG] Starting package.json updates
[2026-03-02T22:30:00.300Z] [INFO] [PACKAGE_CONFIG] Removed workspaces field
[2026-03-02T22:30:00.350Z] [INFO] [PACKAGE_CONFIG] Updated build script to use pnpm
[2026-03-02T22:30:00.400Z] [INFO] [PACKAGE_CONFIG] Package configuration complete
```

## Testing Strategy

### Dual Testing Approach

The migration tool will be validated using both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

### Unit Testing

Unit tests will focus on:

1. **Specific File Operations**
   - Test removal of package-lock.json
   - Test creation of .npmrc with correct content
   - Test update of specific package.json fields
   - Test update of pnpm-workspace.yaml

2. **Edge Cases**
   - Missing optional files (.npmrc doesn't exist)
   - Empty documentation directories
   - Workspace packages with no scripts
   - CI configuration without test stage

3. **Error Conditions**
   - Invalid JSON in package.json
   - Invalid YAML in pnpm-workspace.yaml
   - Permission denied errors
   - Disk space errors

4. **Integration Points**
   - Volta configuration extraction
   - YAML parsing and generation
   - File system operations
   - Command execution (mocked)

**Example Unit Tests:**

```typescript
describe('cleanupNpmArtifacts', () => {
  it('should remove package-lock.json from root', async () => {
    // Arrange
    const testDir = await createTestWorkspace();
    await fs.writeFile(path.join(testDir, 'package-lock.json'), '{}');
    
    // Act
    await cleanupNpmArtifacts(testDir);
    
    // Assert
    const exists = await fileExists(path.join(testDir, 'package-lock.json'));
    expect(exists).toBe(false);
  });

  it('should preserve pnpm-lock.yaml during cleanup', async () => {
    // Arrange
    const testDir = await createTestWorkspace();
    const pnpmLockContent = 'lockfileVersion: 9.0';
    await fs.writeFile(path.join(testDir, 'pnpm-lock.yaml'), pnpmLockContent);
    await fs.writeFile(path.join(testDir, 'package-lock.json'), '{}');
    
    // Act
    await cleanupNpmArtifacts(testDir);
    
    // Assert
    const content = await fs.readFile(path.join(testDir, 'pnpm-lock.yaml'), 'utf-8');
    expect(content).toBe(pnpmLockContent);
  });
});

describe('updatePackageJson', () => {
  it('should remove workspaces field', async () => {
    // Arrange
    const testDir = await createTestWorkspace();
    const packageJson = {
      name: 'test',
      workspaces: ['libs/*', 'servers/*']
    };
    await writeJsonFile(path.join(testDir, 'package.json'), packageJson);
    
    // Act
    await updatePackageJson(testDir);
    
    // Assert
    const updated = await readJsonFile(path.join(testDir, 'package.json'));
    expect(updated.workspaces).toBeUndefined();
  });

  it('should update build script to use pnpm', async () => {
    // Arrange
    const testDir = await createTestWorkspace();
    const packageJson = {
      name: 'test',
      scripts: {
        build: 'npm run build --workspaces'
      }
    };
    await writeJsonFile(path.join(testDir, 'package.json'), packageJson);
    
    // Act
    await updatePackageJson(testDir);
    
    // Assert
    const updated = await readJsonFile(path.join(testDir, 'package.json'));
    expect(updated.scripts.build).toBe('pnpm run build --recursive');
  });
});

describe('error handling', () => {
  it('should provide actionable error message for invalid JSON', async () => {
    // Arrange
    const testDir = await createTestWorkspace();
    await fs.writeFile(path.join(testDir, 'package.json'), '{invalid json}');
    
    // Act & Assert
    await expect(updatePackageJson(testDir)).rejects.toThrow(/Failed to parse package.json/);
  });

  it('should rollback on validation failure', async () => {
    // Arrange
    const testDir = await createTestWorkspace();
    const originalContent = JSON.stringify({ name: 'test' }, null, 2);
    await fs.writeFile(path.join(testDir, 'package.json'), originalContent);
    
    // Mock pnpm install to fail
    mockExec.mockRejectedValueOnce(new Error('pnpm install failed'));
    
    // Act
    const result = await migrate({ rootDir: testDir, dryRun: false, verbose: false });
    
    // Assert
    expect(result.success).toBe(false);
    const content = await fs.readFile(path.join(testDir, 'package.json'), 'utf-8');
    expect(content).toBe(originalContent);
  });
});
```

### Property-Based Testing

Property tests will verify universal properties across many generated inputs using a property-based testing library (fast-check for JavaScript/TypeScript).

Each property test will run a minimum of 100 iterations with randomized inputs.

**Property Test Configuration:**
- Library: fast-check
- Iterations: 100 minimum per test
- Tagging: Each test references its design document property

**Example Property Tests:**

```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  /**
   * Feature: pnpm-migration, Property 1: Preservation Invariant
   * 
   * For any migration execution, all files and configuration fields that are not 
   * explicitly targeted for modification SHALL remain unchanged.
   */
  it('Property 1: preserves non-targeted files and fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          packageJson: fc.record({
            name: fc.string(),
            version: fc.string(),
            packageManager: fc.string(),
            volta: fc.record({ node: fc.string() }),
            dependencies: fc.dictionary(fc.string(), fc.string()),
            devDependencies: fc.dictionary(fc.string(), fc.string())
          }),
          pnpmWorkspace: fc.record({
            onlyBuiltDependencies: fc.array(fc.string())
          }),
          otherFiles: fc.dictionary(fc.string(), fc.string())
        }),
        async (testData) => {
          // Arrange
          const testDir = await createTestWorkspace(testData);
          const beforeState = await captureWorkspaceState(testDir);
          
          // Act
          await migrate({ rootDir: testDir, dryRun: false, verbose: false });
          
          // Assert
          const afterState = await captureWorkspaceState(testDir);
          
          // Verify preservation
          expect(afterState.pnpmLockYaml).toBe(beforeState.pnpmLockYaml);
          expect(afterState.packageJson.packageManager).toBe(beforeState.packageJson.packageManager);
          expect(afterState.packageJson.volta.node).toBe(beforeState.packageJson.volta.node);
          expect(afterState.pnpmWorkspace.onlyBuiltDependencies).toEqual(beforeState.pnpmWorkspace.onlyBuiltDependencies);
          expect(afterState.biomeJson).toBe(beforeState.biomeJson);
          expect(afterState.tsconfigJson).toBe(beforeState.tsconfigJson);
          
          // Verify workspace packages unchanged
          for (const pkg of beforeState.workspacePackages) {
            const afterPkg = afterState.workspacePackages.find(p => p.name === pkg.name);
            expect(afterPkg.dependencies).toEqual(pkg.dependencies);
            expect(afterPkg.devDependencies).toEqual(pkg.devDependencies);
            expect(afterPkg.scripts).toEqual(pkg.scripts);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: pnpm-migration, Property 2: YAML Validity
   * 
   * For any YAML file modified by the migration tool, the resulting file 
   * SHALL be valid YAML that can be successfully parsed without errors.
   */
  it('Property 2: produces valid YAML files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pnpmWorkspace: fc.record({
            onlyBuiltDependencies: fc.array(fc.string())
          }),
          gitlabCI: fc.record({
            stages: fc.array(fc.string()),
            variables: fc.dictionary(fc.string(), fc.string())
          })
        }),
        async (testData) => {
          // Arrange
          const testDir = await createTestWorkspace(testData);
          
          // Act
          await migrate({ rootDir: testDir, dryRun: false, verbose: false });
          
          // Assert - YAML files can be parsed without errors
          const pnpmWorkspaceContent = await fs.readFile(
            path.join(testDir, 'pnpm-workspace.yaml'),
            'utf-8'
          );
          expect(() => yaml.parse(pnpmWorkspaceContent)).not.toThrow();
          
          const gitlabCIContent = await fs.readFile(
            path.join(testDir, '.gitlab-ci.yml'),
            'utf-8'
          );
          expect(() => yaml.parse(gitlabCIContent)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: pnpm-migration, Property 3: Safe Text Replacement
   * 
   * For any text file updated by the migration tool, all content that does not 
   * match the replacement patterns SHALL be preserved exactly, and all instances 
   * of npm-specific commands SHALL be replaced with their pnpm equivalents.
   */
  it('Property 3: safely replaces npm commands while preserving other content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          readme: fc.string(),
          docs: fc.array(fc.record({
            filename: fc.string(),
            content: fc.string()
          }))
        }),
        async (testData) => {
          // Arrange
          const testDir = await createTestWorkspace();
          
          // Add npm commands to test content
          const readmeWithNpm = testData.readme + '\n\n```bash\nnpm install\nnpm run build --workspaces\n```\n';
          await fs.writeFile(path.join(testDir, 'README.md'), readmeWithNpm);
          
          // Act
          await migrate({ rootDir: testDir, dryRun: false, verbose: false });
          
          // Assert
          const updatedReadme = await fs.readFile(path.join(testDir, 'README.md'), 'utf-8');
          
          // No npm commands should remain
          expect(updatedReadme).not.toMatch(/npm install(?!\-)/);
          expect(updatedReadme).not.toMatch(/npm run build --workspaces/);
          
          // pnpm commands should be present
          expect(updatedReadme).toMatch(/pnpm install/);
          expect(updatedReadme).toMatch(/pnpm run build --recursive/);
          
          // Original content should be preserved
          expect(updatedReadme).toContain(testData.readme);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: pnpm-migration, Property 4: Configuration Consistency
   * 
   * For any configuration value that is derived from another configuration source, 
   * the derived value SHALL match the source value exactly.
   */
  it('Property 4: maintains configuration consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          nodeVersion: fc.string({ minLength: 5, maxLength: 10 }).filter(s => /^\d+\.\d+\.\d+$/.test(s)),
          pnpmVersion: fc.string({ minLength: 5, maxLength: 10 }).filter(s => /^\d+\.\d+\.\d+$/.test(s))
        }),
        async (testData) => {
          // Arrange
          const testDir = await createTestWorkspace();
          const packageJson = {
            name: 'test',
            volta: { node: testData.nodeVersion },
            packageManager: `pnpm@${testData.pnpmVersion}+sha512.abc123`
          };
          await writeJsonFile(path.join(testDir, 'package.json'), packageJson);
          
          // Act
          await migrate({ rootDir: testDir, dryRun: false, verbose: false });
          
          // Assert
          const npmrcContent = await fs.readFile(path.join(testDir, '.npmrc'), 'utf-8');
          expect(npmrcContent).toContain(`use-node-version=${testData.nodeVersion}`);
          
          const gitlabCI = await fs.readFile(path.join(testDir, '.gitlab-ci.yml'), 'utf-8');
          expect(gitlabCI).toContain(`PNPM_VERSION: '${testData.pnpmVersion}'`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: pnpm-migration, Property 5: Error Reporting Quality
   * 
   * For any validation step that fails during migration, the error message 
   * SHALL include both the specific failure reason and actionable guidance.
   */
  it('Property 5: provides actionable error messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'invalid-json',
          'invalid-yaml',
          'missing-volta',
          'install-failure',
          'build-failure'
        ),
        async (errorType) => {
          // Arrange
          const testDir = await createTestWorkspace();
          
          // Inject specific error condition
          switch (errorType) {
            case 'invalid-json':
              await fs.writeFile(path.join(testDir, 'package.json'), '{invalid}');
              break;
            case 'invalid-yaml':
              await fs.writeFile(path.join(testDir, 'pnpm-workspace.yaml'), 'invalid: [yaml');
              break;
            case 'missing-volta':
              const pkg = await readJsonFile(path.join(testDir, 'package.json'));
              delete pkg.volta;
              await writeJsonFile(path.join(testDir, 'package.json'), pkg);
              break;
            case 'install-failure':
              mockExec.mockRejectedValueOnce(new Error('pnpm install failed'));
              break;
            case 'build-failure':
              mockExec.mockResolvedValueOnce({ stdout: '', stderr: '' }); // install succeeds
              mockExec.mockRejectedValueOnce(new Error('pnpm run build failed'));
              break;
          }
          
          // Act
          const result = await migrate({ rootDir: testDir, dryRun: false, verbose: false });
          
          // Assert
          expect(result.success).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          const errorMessage = result.errors[0];
          
          // Error message should contain specific failure reason
          expect(errorMessage).toMatch(/ERROR/);
          expect(errorMessage.length).toBeGreaterThan(50); // Substantial message
          
          // Error message should contain actionable guidance
          expect(errorMessage).toMatch(/Suggested Action|Example|Check|Verify|Run/i);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Unit test coverage**: 80%+ for core logic
- **Property test coverage**: All 5 correctness properties
- **Integration test coverage**: End-to-end migration scenarios
- **Error path coverage**: All error categories tested

### Testing Tools

- **Test Framework**: Vitest
- **Property Testing**: fast-check
- **Mocking**: Vitest mocks for file system and command execution
- **Assertions**: Vitest expect API

### CI Integration

Tests will run in the CI pipeline:

```yaml
test:
  stage: test
  extends: .pnpm-setup
  script:
    - pnpm install --frozen-lockfile
    - pnpm run build
    - pnpm run test
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
```

## Implementation Notes

### Execution Order

The migration phases must execute in strict order:

1. **Cleanup** (remove npm artifacts)
2. **Package Configuration** (update root package.json)
3. **Workspace Configuration** (update pnpm-workspace.yaml and .npmrc)
4. **Documentation** (update README.md and docs/)
5. **CI/CD** (update .gitlab-ci.yml)
6. **Validation** (run pnpm install, build, test)

Each phase must complete successfully before the next phase begins. If any phase fails, the migration stops and rolls back.

### Dry Run Mode

The migration script will support a `--dry-run` flag that:
- Performs all analysis and validation
- Reports what changes would be made
- Does not modify any files
- Does not execute validation commands

This allows users to preview the migration before committing to it.

### Verbose Mode

The migration script will support a `--verbose` flag that:
- Enables DEBUG level logging
- Shows detailed file operations
- Displays full command output
- Helps troubleshoot issues

### Script Invocation

```bash
# Standard migration
node tools/scripts/migrate-to-pnpm.js

# Dry run to preview changes
node tools/scripts/migrate-to-pnpm.js --dry-run

# Verbose output for debugging
node tools/scripts/migrate-to-pnpm.js --verbose

# Combination
node tools/scripts/migrate-to-pnpm.js --dry-run --verbose
```

### Dependencies

The migration script will use:
- **Node.js built-in modules**: fs, path, child_process
- **yaml**: For YAML parsing and generation
- **No external dependencies** for the core migration logic

This ensures the script can run immediately without additional installation.

### Post-Migration Steps

After successful migration, users should:

1. **Verify the changes**: Review modified files in git diff
2. **Commit the changes**: Commit all modified files
3. **Update local environment**: Ensure VOLTA_FEATURE_PNPM=1 is set
4. **Clean install**: Run `pnpm install` to verify
5. **Run tests**: Run `pnpm run test` to verify
6. **Update team documentation**: Inform team members of the migration

### Volta Configuration

The workspace already has Volta configured with experimental pnpm support. The migration maintains this configuration:

- `packageManager` field pins pnpm version
- Volta's shims route pnpm commands to the correct version
- `VOLTA_FEATURE_PNPM=1` must be set in the environment
- `.npmrc` includes `use-node-version` to match Volta's node version

### Workspace Structure Compatibility

The migration maintains full compatibility with the existing monorepo structure:

- Workspace packages in `libs/*` and `servers/*` remain unchanged
- Shared library (`@jira-mcp/shared`) continues to work
- Build and test scripts continue to work with `--recursive` flag
- MCP server configurations remain valid

### Documentation Updates

The migration updates documentation to reflect pnpm usage:

**Command Replacements:**
- `npm install` → `pnpm install`
- `npm run build --workspaces` → `pnpm run build --recursive`
- `npm run test --workspaces` → `pnpm run test --recursive`
- `npm run build -w <package>` → `pnpm run build --filter <package>`
- `npm run <script> -w <package>` → `pnpm run <script> --filter <package>`

**New Documentation Sections:**
- pnpm workspace commands
- pnpm filtering syntax
- pnpm configuration options
- Troubleshooting pnpm issues

### CI/CD Integration

The migration updates GitLab CI to use pnpm:

1. **Install pnpm**: Use corepack to install pnpm
2. **Cache pnpm store**: Cache `.pnpm-store` directory
3. **Frozen lockfile**: Use `--frozen-lockfile` for reproducible builds
4. **Version consistency**: Extract pnpm version from packageManager field

### Success Criteria

The migration is considered successful when:

1. All npm artifacts are removed
2. All configuration files are updated correctly
3. All documentation references pnpm
4. CI/CD pipeline uses pnpm
5. `pnpm install` completes successfully
6. `pnpm run build` completes successfully
7. `pnpm run test` completes successfully
8. All workspace packages build and test correctly

### Rollback Procedure

If the migration fails or needs to be reverted:

1. The script automatically rolls back on failure
2. Manual rollback: `git checkout -- .` (if changes not committed)
3. Restore from backup: The script creates backups before modification
4. Re-run npm install: `npm install` to restore npm state

### Future Enhancements

Potential future improvements to the migration tool:

- **Interactive mode**: Prompt user for confirmation at each phase
- **Selective migration**: Allow migrating specific phases only
- **Configuration validation**: Pre-flight checks before migration
- **Migration report**: Generate detailed report of all changes
- **Backup management**: Automatic backup creation and restoration
