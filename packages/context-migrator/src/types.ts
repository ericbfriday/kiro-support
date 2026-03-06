export type ContextFormat = 
  | 'claude'
  | 'cursor'
  | 'copilot'
  | 'continue'
  | 'aider'
  | 'windsurf'
  | 'agents';

export interface ContextFile {
  format: ContextFormat;
  path: string;
  content: string;
  parsed: ParsedContext;
}

export interface ParsedContext {
  sections: ContextSection[];
  rules: string[];
  globs?: string[];
  metadata?: Record<string, unknown>;
}

export interface ContextSection {
  heading: string;
  content: string;
  level: number;
}

export interface MigrationOptions {
  rootDir: string;
  outputDir: string;
  inclusionMode?: 'always' | 'fileMatch' | 'auto';
  preserveStructure?: boolean;
}

export interface MigrationResult {
  sourceFiles: ContextFile[];
  steeringFiles: Array<{
    path: string;
    content: string;
    sourceFormat: ContextFormat;
  }>;
  warnings: string[];
}

export const CONTEXT_FILE_PATTERNS: Record<ContextFormat, string[]> = {
  claude: ['CLAUDE.md', '.claude/CLAUDE.md'],
  cursor: ['.cursorrules', '.cursor/rules/*.mdc'],
  copilot: ['.github/copilot-instructions.md', '.github/instructions/**/*.instructions.md'],
  continue: ['.continue/config.yaml', '.continue/config.json'],
  aider: ['.aider.conf.yml'],
  windsurf: ['.windsurfrules', '.windsurf/rules/*.md'],
  agents: ['AGENTS.md'],
};
