import matter from 'gray-matter';
import type { ParsedContext, ContextSection } from '../types.js';

export function parseCursorRules(content: string): ParsedContext {
  const parsed = matter(content);
  const globs: string[] = [];
  const metadata: Record<string, unknown> = {};

  if (parsed.data) {
    if (parsed.data.globs) {
      globs.push(...(Array.isArray(parsed.data.globs) ? parsed.data.globs : [parsed.data.globs]));
    }
    if (parsed.data.description) {
      metadata.description = parsed.data.description;
    }
    if (parsed.data.alwaysApply) {
      metadata.alwaysApply = parsed.data.alwaysApply;
    }
  }

  const sections = extractMarkdownSections(parsed.content);
  const rules = extractRulesFromContent(parsed.content);

const result: ParsedContext = {
    sections,
    rules,
  };

  if (globs.length > 0) {
    (result as ParsedContext & { globs: string[] }).globs = globs;
  }
  if (Object.keys(metadata).length > 0) {
    (result as ParsedContext & { metadata: Record<string, unknown> }).metadata = metadata;
  }

  return result;
}

export function parseCursorrulesLegacy(content: string): ParsedContext {
  const sections = extractMarkdownSections(content);
  const rules = extractRulesFromContent(content);

  return {
    sections,
    rules,
  };
}

function extractMarkdownSections(content: string): ContextSection[] {
  const sections: ContextSection[] = [];
  const lines = content.split('\n');
  let currentSection: ContextSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }
      
      currentSection = {
        heading: headingMatch[2]!.trim(),
        content: '',
        level: headingMatch[1]!.length,
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

function extractRulesFromContent(content: string): string[] {
  const rules: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const rule = trimmed.slice(2).trim();
      if (rule) rules.push(rule);
    }
  }
  
  return rules;
}
