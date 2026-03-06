import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';
import type { 
  ContextFile, 
  ContextFormat, 
  MigrationOptions, 
  MigrationResult,
  ParsedContext 
} from './types.js';
import { CONTEXT_FILE_PATTERNS } from './types.js';
import { parseClaudeMd } from './parsers/claude.js';
import { parseCursorRules, parseCursorrulesLegacy } from './parsers/cursor.js';
import { parseCopilotInstructions } from './parsers/copilot.js';
import { parseContinueConfig } from './parsers/continue.js';
import { parseAiderConfig } from './parsers/aider.js';
import { parseWindsurfRules } from './parsers/windsurf.js';
import { parseAgentsMd } from './parsers/agents.js';
import { generateSteeringFile, steeringToMarkdown, type SteeringGeneratorOptions } from '@kiro-transition/steering-generator';

export async function detectContextFiles(rootDir: string): Promise<ContextFile[]> {
  const contextFiles: ContextFile[] = [];

  for (const [format, patterns] of Object.entries(CONTEXT_FILE_PATTERNS)) {
    for (const pattern of patterns) {
      const fullPattern = path.join(rootDir, pattern);
      try {
        const matches = await glob(fullPattern, { nodir: true });
        for (const match of matches) {
          const content = await fs.readFile(match, 'utf-8');
          const parsed = parseContextContent(format as ContextFormat, content, match);
          contextFiles.push({
            format: format as ContextFormat,
            path: match,
            content,
            parsed,
          });
        }
      } catch {
        // Pattern didn't match or file doesn't exist
      }
    }
  }

  return contextFiles;
}

function parseContextContent(format: ContextFormat, content: string, filePath: string): ParsedContext {
  switch (format) {
    case 'claude':
      return parseClaudeMd(content);
    case 'cursor':
      if (filePath.endsWith('.cursorrules')) {
        return parseCursorrulesLegacy(content);
      }
      return parseCursorRules(content);
    case 'copilot':
      return parseCopilotInstructions(content);
    case 'continue':
      return parseContinueConfig(content);
    case 'aider':
      return parseAiderConfig(content);
    case 'windsurf':
      return parseWindsurfRules(content);
    case 'agents':
      return parseAgentsMd(content);
  }
}

export async function migrateToSteering(options: MigrationOptions): Promise<MigrationResult> {
  const sourceFiles = await detectContextFiles(options.rootDir);
  const steeringFiles: MigrationResult['steeringFiles'] = [];
  const warnings: string[] = [];

  for (const source of sourceFiles) {
    try {
const steeringOptions: SteeringGeneratorOptions = {
        projectName: path.basename(options.rootDir),
        techStack: [],
        inclusionMode: options.inclusionMode ?? 'always',
      };
      
      if (source.parsed.globs?.[0]) {
        steeringOptions.fileMatchPattern = source.parsed.globs[0];
      }
      
      const steering = await generateSteeringFile(steeringOptions);

      let content = convertParsedContextToContent(source.parsed, source.format);
      const steeringMarkdown = steeringToMarkdown({
        frontmatter: steering.frontmatter,
        content,
      });

      const outputPath = determineOutputPath(source, options);
      steeringFiles.push({
        path: outputPath,
        content: steeringMarkdown,
        sourceFormat: source.format,
      });
    } catch (error) {
      warnings.push(`Failed to migrate ${source.path}: ${error}`);
    }
  }

  return {
    sourceFiles,
    steeringFiles,
    warnings,
  };
}

function convertParsedContextToContent(parsed: ParsedContext, format: ContextFormat): string {
  const parts: string[] = [];

  if (parsed.sections.length > 0) {
    for (const section of parsed.sections) {
      const heading = '#'.repeat(section.level) + ' ' + section.heading;
      parts.push(heading);
      if (section.content) {
        parts.push(section.content);
      }
      parts.push('');
    }
  }

  if (parsed.rules.length > 0) {
    parts.push('## Rules');
    parts.push('');
    for (const rule of parsed.rules) {
      parts.push(`- ${rule}`);
    }
    parts.push('');
  }

  if (parts.length === 0) {
    parts.push(`Migrated from ${format} format.`);
    parts.push('');
    parts.push('<!-- Add your steering content here -->');
  }

  return parts.join('\n').trim();
}

function determineOutputPath(source: ContextFile, options: MigrationOptions): string {
  const baseName = path.basename(source.path, path.extname(source.path));
  const safeName = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return path.join(options.outputDir, `${safeName}.md`);
}

export async function writeMigrationResult(
  result: MigrationResult,
  options: MigrationOptions
): Promise<void> {
  await fs.mkdir(options.outputDir, { recursive: true });

  for (const steering of result.steeringFiles) {
    await fs.mkdir(path.dirname(steering.path), { recursive: true });
    await fs.writeFile(steering.path, steering.content, 'utf-8');
  }
}
