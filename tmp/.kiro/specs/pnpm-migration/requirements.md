# Requirements Document

## Introduction

This document specifies the requirements for migrating the Jira MCP monorepo workspace from npm to pnpm as the package manager. The workspace currently has partial pnpm setup (pnpm-workspace.yaml exists, packageManager field is configured) but still uses npm commands and has npm-specific artifacts. This migration will complete the transition to pnpm, enabling faster installs, better disk space efficiency, and stricter dependency management.

## Glossary

- **Package_Manager**: The tool used to install, update, and manage project dependencies (npm, pnpm, yarn)
- **Workspace**: A monorepo pattern where multiple packages share a common root and dependency management
- **Lock_File**: A file that records exact dependency versions for reproducible installs (package-lock.json for npm, pnpm-lock.yaml for pnpm)
- **Volta**: A JavaScript toolchain manager that manages Node.js and package manager versions
- **Root_Package**: The top-level package.json in the monorepo that defines workspace configuration
- **Workspace_Package**: Individual packages within the monorepo (in libs/* and servers/* directories)

## Requirements

### Requirement 1: Remove npm Artifacts

**User Story:** As a developer, I want npm-specific files removed from the workspace, so that there is no confusion about which package manager to use.

#### Acceptance Criteria

1. THE Migration_Tool SHALL remove package-lock.json from the root directory
2. THE Migration_Tool SHALL remove .package-lock.json from node_modules if it exists
3. THE Migration_Tool SHALL remove any npm cache directories if present
4. WHEN npm artifacts are removed, THE Migration_Tool SHALL preserve pnpm-lock.yaml

### Requirement 2: Update Root Package Configuration

**User Story:** As a developer, I want the root package.json configured for pnpm, so that the workspace uses pnpm conventions.

#### Acceptance Criteria

1. THE Migration_Tool SHALL remove the "workspaces" field from root package.json
2. THE Migration_Tool SHALL remove the "npm" engine requirement from package.json
3. THE Migration_Tool SHALL remove the "npm" version from the volta configuration
4. THE Migration_Tool SHALL update build script to use "pnpm run build --recursive" instead of "npm run build --workspaces"
5. THE Migration_Tool SHALL update test script to use "pnpm run test --recursive" instead of "npm run test --workspaces"
6. THE Migration_Tool SHALL preserve the existing packageManager field with pnpm version
7. THE Migration_Tool SHALL preserve the volta node version configuration

### Requirement 3: Configure pnpm Workspace

**User Story:** As a developer, I want pnpm-workspace.yaml properly configured, so that pnpm recognizes all workspace packages.

#### Acceptance Criteria

1. THE Migration_Tool SHALL add "packages" field to pnpm-workspace.yaml with patterns ["libs/*", "servers/*"]
2. THE Migration_Tool SHALL preserve the existing "onlyBuiltDependencies" configuration for esbuild
3. WHEN pnpm-workspace.yaml is updated, THE Migration_Tool SHALL validate the YAML syntax

### Requirement 4: Configure pnpm Settings

**User Story:** As a developer, I want pnpm configured with appropriate settings, so that dependency management follows best practices.

#### Acceptance Criteria

1. THE Migration_Tool SHALL create .npmrc file if it does not exist
2. THE Migration_Tool SHALL configure "shamefully-hoist=false" in .npmrc to enforce strict dependency resolution
3. THE Migration_Tool SHALL configure "strict-peer-dependencies=false" in .npmrc to allow flexible peer dependency resolution
4. THE Migration_Tool SHALL configure "auto-install-peers=true" in .npmrc to automatically install peer dependencies
5. WHERE the workspace uses Volta, THE Migration_Tool SHALL configure "use-node-version" in .npmrc to match the volta node version

### Requirement 5: Update Documentation

**User Story:** As a developer, I want documentation updated to reference pnpm commands, so that I know how to work with the project.

#### Acceptance Criteria

1. THE Migration_Tool SHALL update README.md to replace npm commands with pnpm equivalents
2. THE Migration_Tool SHALL update any documentation in docs/ directory that references npm commands
3. THE Migration_Tool SHALL add a section explaining pnpm workspace commands if not present
4. WHEN documentation is updated, THE Migration_Tool SHALL preserve all other content

### Requirement 6: Validate Migration

**User Story:** As a developer, I want the migration validated, so that I can be confident the workspace works correctly with pnpm.

#### Acceptance Criteria

1. WHEN migration is complete, THE Migration_Tool SHALL run "pnpm install" to verify dependency installation
2. WHEN pnpm install succeeds, THE Migration_Tool SHALL run "pnpm run build" to verify build scripts work
3. WHEN pnpm install succeeds, THE Migration_Tool SHALL run "pnpm run test" to verify test scripts work
4. IF any validation step fails, THEN THE Migration_Tool SHALL report the specific failure with actionable guidance
5. WHEN all validation passes, THE Migration_Tool SHALL confirm successful migration

### Requirement 7: Preserve Workspace Structure

**User Story:** As a developer, I want the existing workspace structure preserved, so that no code or configuration is lost during migration.

#### Acceptance Criteria

1. THE Migration_Tool SHALL preserve all workspace packages in libs/* and servers/* directories
2. THE Migration_Tool SHALL preserve all devDependencies, dependencies, and scripts in all package.json files
3. THE Migration_Tool SHALL preserve the biome.json configuration
4. THE Migration_Tool SHALL preserve the tsconfig.json configuration
5. THE Migration_Tool SHALL preserve all .env files and .gitignore patterns
6. THE Migration_Tool SHALL preserve the Volta node version configuration

### Requirement 8: Update CI/CD Configuration

**User Story:** As a developer, I want CI/CD pipelines updated to use pnpm, so that automated builds work correctly.

#### Acceptance Criteria

1. THE Migration_Tool SHALL update .gitlab-ci.yml to use pnpm commands instead of npm
2. THE Migration_Tool SHALL configure pnpm installation in CI pipeline before running commands
3. THE Migration_Tool SHALL configure CI to cache pnpm store for faster builds
4. WHERE Volta is used in CI, THE Migration_Tool SHALL ensure pnpm version matches packageManager field
5. WHEN CI configuration is updated, THE Migration_Tool SHALL validate YAML syntax
