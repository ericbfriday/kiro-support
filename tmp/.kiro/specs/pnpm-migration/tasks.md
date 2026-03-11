# Implementation Plan: pnpm Migration

## Overview

This plan implements an automated migration script that transitions the Jira MCP monorepo from npm to pnpm. The script executes six phases: cleanup of npm artifacts, package configuration updates, workspace configuration, documentation updates, CI/CD pipeline updates, and validation. The implementation includes comprehensive error handling with rollback capabilities and is validated through both unit tests and property-based tests.

## Tasks

- [x] 1. Set up migration script structure and utilities
  - Create `tools/scripts/migrate-to-pnpm.ts` with TypeScript configuration
  - Implement file operation utilities (readJsonFile, writeJsonFile, readYamlFile, writeYamlFile, fileExists, removeFile)
  - Implement atomic file write with temp file and rename
  - Add command-line argument parsing for --dry-run and --verbose flags
  - Set up logging infrastructure with INFO, WARN, ERROR, DEBUG levels
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3_

- [x] 1.1 Write unit tests for file utilities
  - Test JSON read/write with valid and invalid data
  - Test YAML read/write with valid and invalid data
  - Test atomic file write operations
  - Test file existence checks
  - Test file removal operations
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3_

- [x] 2. Implement backup and rollback mechanism
  - Create MigrationState interface with phase tracking and backup storage
  - Implement backup creation before file modifications
  - Implement rollback function to restore all backed-up files
  - Add state persistence to track migration progress
  - _Requirements: 6.4_

- [x] 2.1 Write unit tests for backup and rollback
  - Test backup creation for multiple files
  - Test rollback restores original content
  - Test state persistence and recovery
  - _Requirements: 6.4_

- [x] 3. Implement Phase 1: Cleanup npm artifacts
  - Implement cleanupNpmArtifacts function
  - Remove package-lock.json from root directory
  - Remove .package-lock.json from node_modules if exists
  - Remove npm cache directories if present
  - Verify pnpm-lock.yaml is preserved
  - Add logging for each cleanup operation
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3.1 Write unit tests for cleanup phase
  - Test removal of package-lock.json
  - Test preservation of pnpm-lock.yaml
  - Test handling of missing files (no error)
  - Test cleanup with various directory structures
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Implement Phase 2: Update package.json configuration
  - Implement updatePackageJson function
  - Remove "workspaces" field from root package.json
  - Remove "npm" from engines field
  - Remove "npm" from volta configuration
  - Update build script to "pnpm run build --recursive"
  - Update test script to "pnpm run test --recursive"
  - Preserve packageManager field
  - Preserve volta.node field
  - Validate JSON syntax before writing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 4.1 Write unit tests for package.json updates
  - Test removal of workspaces field
  - Test removal of npm engine
  - Test removal of npm from volta
  - Test script updates (build and test)
  - Test preservation of packageManager and volta.node
  - Test handling of missing optional fields
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 5. Implement Phase 3: Configure pnpm workspace
  - Implement configureWorkspace function
  - Update pnpm-workspace.yaml to add packages: ["libs/*", "servers/*"]
  - Preserve onlyBuiltDependencies configuration
  - Validate YAML syntax after modification
  - Create .npmrc file with pnpm settings
  - Set shamefully-hoist=false in .npmrc
  - Set strict-peer-dependencies=false in .npmrc
  - Set auto-install-peers=true in .npmrc
  - Extract node version from volta configuration and set use-node-version in .npmrc
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.1 Write unit tests for workspace configuration
  - Test pnpm-workspace.yaml updates
  - Test preservation of onlyBuiltDependencies
  - Test .npmrc creation with all settings
  - Test use-node-version matches volta.node
  - Test YAML validation
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.2 Write property test for workspace configuration
  - **Property 2: YAML Validity**
  - **Validates: Requirements 3.3, 8.5**
  - Test that pnpm-workspace.yaml is valid YAML after modification
  - Run with 100+ iterations with varied onlyBuiltDependencies configurations

- [x] 6. Checkpoint - Ensure configuration phase tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Phase 4: Update documentation
  - Implement updateDocumentation function
  - Define documentation replacement patterns (npm install → pnpm install, etc.)
  - Update README.md with pnpm command replacements
  - Update all files in docs/ directory with pnpm command replacements
  - Replace "npm install" with "pnpm install"
  - Replace "npm run build --workspaces" with "pnpm run build --recursive"
  - Replace "npm run test --workspaces" with "pnpm run test --recursive"
  - Replace "npm run <script> -w <package>" with "pnpm run <script> --filter <package>"
  - Preserve all other content in documentation files
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 7.1 Write unit tests for documentation updates
  - Test README.md command replacements
  - Test preservation of non-command content
  - Test handling of multiple npm commands in one file
  - Test docs/ directory file updates
  - Test handling of missing docs directory
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 7.2 Write property test for documentation updates
  - **Property 3: Safe Text Replacement**
  - **Validates: Requirements 5.1, 5.2, 5.4, 8.1**
  - Test that npm commands are replaced while preserving other content
  - Run with 100+ iterations with varied documentation content

- [x] 8. Implement Phase 5: Update CI/CD configuration
  - Implement updateCICD function
  - Update .gitlab-ci.yml to add pnpm installation step using corepack
  - Extract pnpm version from packageManager field
  - Add PNPM_VERSION variable to .gitlab-ci.yml
  - Add .pnpm-setup job template with corepack and pnpm config
  - Configure pnpm store caching with .pnpm-store directory
  - Add cache configuration keyed on pnpm-lock.yaml
  - Update test job to extend .pnpm-setup and use pnpm commands
  - Replace npm commands with pnpm equivalents in CI scripts
  - Validate YAML syntax after modification
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.1 Write unit tests for CI/CD updates
  - Test pnpm installation step addition
  - Test PNPM_VERSION variable extraction from packageManager
  - Test cache configuration
  - Test .pnpm-setup template creation
  - Test npm command replacement in CI scripts
  - Test YAML validation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.2 Write property test for CI/CD configuration
  - **Property 4: Configuration Consistency**
  - **Validates: Requirements 4.5, 8.4**
  - Test that pnpm version in CI matches packageManager field
  - Test that use-node-version in .npmrc matches volta.node
  - Run with 100+ iterations with varied version strings

- [x] 9. Implement Phase 6: Validation
  - Implement validateMigration function
  - Execute "pnpm install" and capture output
  - Execute "pnpm run build" and capture output
  - Execute "pnpm run test" and capture output
  - Handle command failures with detailed error messages
  - Report specific failure reason and actionable guidance
  - Skip validation in dry-run mode
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.1 Write unit tests for validation phase
  - Test successful validation flow
  - Test pnpm install failure handling
  - Test pnpm build failure handling
  - Test pnpm test failure handling
  - Test error message format and content
  - Test dry-run mode skips validation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.2 Write property test for error reporting
  - **Property 5: Error Reporting Quality**
  - **Validates: Requirements 6.4**
  - Test that all error messages include failure reason and actionable guidance
  - Run with 100+ iterations with varied error conditions

- [x] 10. Implement main migration orchestration
  - Implement migrate function as main entry point
  - Parse command-line arguments (--dry-run, --verbose)
  - Initialize migration state and backup system
  - Execute phases in order: cleanup, package config, workspace config, documentation, CI/CD, validation
  - Handle phase failures with rollback
  - Log progress at each phase
  - Report final migration result
  - _Requirements: All requirements_

- [x] 10.1 Write integration tests for full migration
  - Test successful end-to-end migration
  - Test rollback on phase failure
  - Test dry-run mode (no file modifications)
  - Test verbose mode logging
  - _Requirements: All requirements_

- [x] 10.2 Write property test for preservation invariant
  - **Property 1: Preservation Invariant**
  - **Validates: Requirements 1.4, 2.6, 2.7, 3.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
  - Test that non-targeted files and fields remain unchanged
  - Verify pnpm-lock.yaml, packageManager, volta.node, onlyBuiltDependencies, workspace packages, biome.json, tsconfig.json, .env files are preserved
  - Run with 100+ iterations with varied workspace configurations

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Add TypeScript build configuration
  - Create tsconfig.json for tools/scripts if not exists
  - Configure TypeScript compiler options (target: ES2022, module: ESNext, moduleResolution: node)
  - Add build script to compile migration script
  - _Requirements: All requirements_

- [x] 13. Update project documentation
  - Add migration guide to README.md explaining how to run the script
  - Document command-line flags (--dry-run, --verbose)
  - Document what the migration does and what it preserves
  - Add troubleshooting section for common migration issues
  - _Requirements: 5.3_

- [x] 14. Final validation and cleanup
  - Run the migration script in dry-run mode to verify it works
  - Review all generated files for correctness
  - Ensure all tests pass
  - Verify TypeScript compilation succeeds
  - _Requirements: All requirements_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- The migration script uses TypeScript for type safety and maintainability
- All file operations use atomic writes to prevent corruption
- The rollback mechanism ensures safe recovery from failures
- Validation phase confirms the migration works correctly before completion
