import type { SteeringFrontmatter, InclusionMode } from './types.js';
import { stringify as yamlStringify } from 'yaml';

export function generateFrontmatter(frontmatter: SteeringFrontmatter): string {
  const yamlObj: Record<string, unknown> = {
    inclusion: frontmatter.inclusion,
  };

  if (frontmatter.inclusion === 'fileMatch' && frontmatter.fileMatchPattern) {
    yamlObj.fileMatchPattern = frontmatter.fileMatchPattern;
  }

  if (frontmatter.inclusion === 'auto') {
    if (frontmatter.name) yamlObj.name = frontmatter.name;
    if (frontmatter.description) yamlObj.description = frontmatter.description;
  }

  const yaml = yamlStringify(yamlObj).trim();
  return `---\n${yaml}\n---`;
}

export function parseFrontmatter(content: string): { frontmatter: SteeringFrontmatter | null; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  
  if (!match?.[1]) {
    return { frontmatter: null, body: content };
  }

  try {
    const lines = match[1].split('\n');
    const frontmatter: SteeringFrontmatter = {
      inclusion: 'always',
    };

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      
      if (key === 'inclusion') {
        frontmatter.inclusion = value as InclusionMode;
      } else if (key === 'fileMatchPattern') {
        frontmatter.fileMatchPattern = value;
      } else if (key === 'name') {
        frontmatter.name = value;
      } else if (key === 'description') {
        frontmatter.description = value;
      }
    }

    return { frontmatter, body: match[2] ?? '' };
  } catch {
    return { frontmatter: null, body: content };
  }
}

export function validateFrontmatter(frontmatter: SteeringFrontmatter): string[] {
  const errors: string[] = [];

  const validModes: InclusionMode[] = ['always', 'fileMatch', 'manual', 'auto'];
  if (!validModes.includes(frontmatter.inclusion)) {
    errors.push(`Invalid inclusion mode: ${frontmatter.inclusion}`);
  }

  if (frontmatter.inclusion === 'fileMatch' && !frontmatter.fileMatchPattern) {
    errors.push('fileMatch mode requires fileMatchPattern');
  }

  if (frontmatter.inclusion === 'auto') {
    if (!frontmatter.name) {
      errors.push('auto mode requires name');
    }
    if (!frontmatter.description) {
      errors.push('auto mode requires description');
    }
  }

  return errors;
}
