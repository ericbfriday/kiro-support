import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { SteeringFile, SteeringGeneratorOptions } from './types.js';
import { generateFrontmatter } from './frontmatter.js';
import { generateLiveReference, isValidReferencePath, isWithinSizeLimit } from './references.js';
import type { RuntimeVersion } from '@kiro-transition/env-scanner';

export async function generateSteeringFile(
  options: SteeringGeneratorOptions
): Promise<SteeringFile> {
  const frontmatter = {
    inclusion: options.inclusionMode ?? 'always',
    ...(options.fileMatchPattern ? { fileMatchPattern: options.fileMatchPattern } : {}),
  };

  const content = await generateSteeringContent(options);
  const refs = options.includeReferences !== false 
    ? await generateReferences()
    : [];

  const result: SteeringFile = {
    frontmatter,
    content,
  };

  if (refs.length > 0) {
    result.references = refs;
  }

  return result;
}

async function generateSteeringContent(options: SteeringGeneratorOptions): Promise<string> {
  const sections: string[] = [];

  if (options.projectName) {
    sections.push(`# ${options.projectName}`);
    sections.push('');
  }

  if (options.techStack && options.techStack.length > 0) {
    sections.push('## Tech Stack');
    sections.push('');
    for (const tech of options.techStack) {
      sections.push(`- ${tech}`);
    }
    sections.push('');
  }

  sections.push('## Build Commands');
  sections.push('');
  sections.push('```bash');
  sections.push('# Add project-specific build commands');
  sections.push('```');
  sections.push('');

  sections.push('## Code Style');
  sections.push('');
  sections.push('<!-- Add code style guidelines here -->');
  sections.push('');

  sections.push('## Testing');
  sections.push('');
  sections.push('```bash');
  sections.push('# Add test commands');
  sections.push('```');
  sections.push('');

  return sections.join('\n');
}

async function generateReferences(): Promise<string[]> {
  const refs: string[] = [];
  const rootDir = process.cwd();

  const commonConfigFiles = [
    '.nvmrc',
    '.node-version',
    'package.json',
    'tsconfig.json',
    'pyproject.toml',
    'go.mod',
    'Cargo.toml',
  ];

  for (const configFile of commonConfigFiles) {
    const filePath = path.join(rootDir, configFile);
    try {
      const stats = await fs.stat(filePath);
      if (isWithinSizeLimit(stats.size) && isValidReferencePath(configFile)) {
        refs.push(configFile);
      }
    } catch {
      // File doesn't exist
    }
  }

  return refs;
}

export async function generateTechStackSteering(
  runtimeVersions: RuntimeVersion[],
  options: SteeringGeneratorOptions = {}
): Promise<SteeringFile> {
  const techStack: string[] = [];

  const runtimeToTech: Record<string, string> = {
    node: 'Node.js',
    python: 'Python',
    java: 'Java',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    dotnet: '.NET',
    php: 'PHP',
  };

  for (const rv of runtimeVersions) {
    const tech = runtimeToTech[rv.runtime] ?? rv.runtime;
    techStack.push(`${tech} ${rv.version}`);
  }

  return generateSteeringFile({
    ...options,
    techStack: [...techStack, ...(options.techStack ?? [])],
  });
}

export function steeringToMarkdown(steering: SteeringFile): string {
  const frontmatterStr = generateFrontmatter(steering.frontmatter);
  let content = steering.content;

  if (steering.references && steering.references.length > 0) {
    content += '\n\n## Configuration References\n\n';
    for (const ref of steering.references) {
      content += `${generateLiveReference(ref)}\n`;
    }
  }

  return `${frontmatterStr}\n\n${content}`;
}

export async function writeSteeringFile(
  steering: SteeringFile,
  outputPath: string
): Promise<void> {
  const markdown = steeringToMarkdown(steering);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, markdown, 'utf-8');
}
