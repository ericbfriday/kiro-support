import type { ParsedContext, ContextSection } from '../types.js';

export function parseCopilotInstructions(content: string): ParsedContext {
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
