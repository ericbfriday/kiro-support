import type { HookTemplate } from './types.js';

export const HOOK_TEMPLATES: HookTemplate[] = [
  {
    id: 'typescript-lint',
    name: 'TypeScript Lint Check',
    description: 'Run ESLint on TypeScript file changes',
    category: 'linting',
    template: {
      enabled: true,
      name: 'TypeScript Lint',
      description: 'Check TypeScript files for linting issues',
      version: '1',
      when: {
        type: 'fileEdited',
        patterns: ['**/*.ts', '**/*.tsx'],
      },
      then: {
        type: 'shellCommand',
        command: 'npx eslint --fix ${file} --silent',
      },
    },
    variables: {
      file: 'Path to the edited file',
    },
  },
  {
    id: 'prettier-format',
    name: 'Prettier Format',
    description: 'Auto-format files with Prettier',
    category: 'formatting',
    template: {
      enabled: true,
      name: 'Prettier Format',
      description: 'Format files using Prettier',
      version: '1',
      when: {
        type: 'fileEdited',
        patterns: ['**/*.{js,ts,tsx,json,md,css,scss}'],
      },
      then: {
        type: 'shellCommand',
        command: 'npx prettier --write ${file} --silent',
      },
    },
    variables: {
      file: 'Path to the edited file',
    },
  },
  {
    id: 'test-related',
    name: 'Run Related Tests',
    description: 'Run tests when source files change',
    category: 'testing',
    template: {
      enabled: true,
      name: 'Run Related Tests',
      description: 'Execute tests related to changed files',
      version: '1',
      when: {
        type: 'fileEdited',
        patterns: ['src/**/*.ts'],
      },
      then: {
        type: 'shellCommand',
        command: 'npm test -- --findRelatedTests ${file} --silent',
      },
    },
    variables: {
      file: 'Path to the edited file',
    },
  },
  {
    id: 'todo-check',
    name: 'TODO Check',
    description: 'Remind about TODOs when editing files',
    category: 'documentation',
    template: {
      enabled: true,
      name: 'TODO Check',
      description: 'Check for TODOs and remind to address them',
      version: '1',
      when: {
        type: 'fileEdited',
        patterns: ['**/*.{ts,tsx,js,jsx}'],
      },
      then: {
        type: 'askAgent',
        prompt: 'Check the edited file for TODO comments. If found, suggest whether they should be addressed now or converted to issues.',
      },
    },
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    description: 'Check for security issues in dependency changes',
    category: 'security',
    template: {
      enabled: true,
      name: 'Security Audit',
      description: 'Run security audit when package files change',
      version: '1',
      when: {
        type: 'fileEdited',
        patterns: ['package.json', 'package-lock.json', 'pnpm-lock.yaml'],
      },
      then: {
        type: 'shellCommand',
        command: 'npm audit --silent || true',
      },
    },
  },
  {
    id: 'python-lint',
    name: 'Python Lint Check',
    description: 'Run Ruff on Python file changes',
    category: 'linting',
    template: {
      enabled: true,
      name: 'Python Lint',
      description: 'Check Python files with Ruff',
      version: '1',
      when: {
        type: 'fileEdited',
        patterns: ['**/*.py'],
      },
      then: {
        type: 'shellCommand',
        command: 'ruff check ${file} --fix --quiet',
      },
    },
    variables: {
      file: 'Path to the edited file',
    },
  },
  {
    id: 'rust-clippy',
    name: 'Rust Clippy',
    description: 'Run Clippy on Rust file changes',
    category: 'linting',
    template: {
      enabled: true,
      name: 'Rust Clippy',
      description: 'Check Rust files with Clippy',
      version: '1',
      when: {
        type: 'fileEdited',
        patterns: ['**/*.rs'],
      },
      then: {
        type: 'shellCommand',
        command: 'cargo clippy --quiet 2>/dev/null || true',
      },
    },
  },
  {
    id: 'prereview',
    name: 'Pre-Review Check',
    description: 'Ask agent to review changes before task completion',
    category: 'custom',
    template: {
      enabled: true,
      name: 'Pre-Review Check',
      description: 'Review changes before marking task complete',
      version: '1',
      when: {
        type: 'PostTaskExecution',
      },
      then: {
        type: 'askAgent',
        prompt: 'Review the changes made in this task. Check for: 1) Code quality, 2) Test coverage, 3) Documentation. Suggest improvements if needed.',
      },
    },
  },
];

export function getTemplateById(id: string): HookTemplate | undefined {
  return HOOK_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: HookTemplate['category']): HookTemplate[] {
  return HOOK_TEMPLATES.filter((t) => t.category === category);
}

export function getAllTemplates(): HookTemplate[] {
  return [...HOOK_TEMPLATES];
}
