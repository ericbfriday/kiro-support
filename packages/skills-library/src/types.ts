export interface SkillDefinition {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  allowedTools?: string[];
  toolAliases?: Record<string, string>;
  model?: string;
}

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'testing' | 'documentation' | 'refactoring' | 'security' | 'custom';
  template: SkillDefinition;
}

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Expert at reviewing code for quality, security, and best practices',
    category: 'development',
    template: {
      name: 'code-reviewer',
      description: 'Reviews code changes for quality, security, and adherence to best practices',
      prompt: 'You are an expert code reviewer. Analyze code changes for: 1) Bugs and logic errors, 2) Security vulnerabilities, 3) Performance issues, 4) Code style and readability, 5) Test coverage. Provide actionable feedback with specific line references.',
      tools: ['read', 'grep', 'lsp_diagnostics'],
    },
  },
  {
    id: 'test-writer',
    name: 'Test Writer',
    description: 'Generates comprehensive test suites for code',
    category: 'testing',
    template: {
      name: 'test-writer',
      description: 'Generates unit tests, integration tests, and e2e tests',
      prompt: 'You are an expert test engineer. Generate comprehensive tests following TDD principles. Include: 1) Unit tests for all public functions, 2) Edge cases and error conditions, 3) Integration tests for APIs, 4) Mock external dependencies. Use the projects testing framework.',
      tools: ['read', 'write', 'grep', 'bash'],
    },
  },
  {
    id: 'doc-writer',
    name: 'Documentation Writer',
    description: 'Creates clear, comprehensive documentation',
    category: 'documentation',
    template: {
      name: 'doc-writer',
      description: 'Writes API docs, README files, and code comments',
      prompt: 'You are a technical writer specializing in developer documentation. Create clear, concise documentation including: 1) API reference with examples, 2) Installation and setup guides, 3) Usage examples with code snippets, 4) Troubleshooting sections. Follow documentation best practices.',
      tools: ['read', 'write', 'grep'],
    },
  },
  {
    id: 'refactorer',
    name: 'Refactorer',
    description: 'Safely refactors code while preserving behavior',
    category: 'refactoring',
    template: {
      name: 'refactorer',
      description: 'Refactors code for improved maintainability without changing behavior',
      prompt: 'You are an expert at refactoring code. Apply design patterns, reduce complexity, and improve code organization while preserving exact behavior. Always: 1) Run tests before and after changes, 2) Make incremental changes, 3) Document what changed and why. Never change behavior, only structure.',
      tools: ['read', 'write', 'edit', 'bash', 'lsp_diagnostics', 'lsp_rename'],
    },
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Identifies and fixes security vulnerabilities',
    category: 'security',
    template: {
      name: 'security-auditor',
      description: 'Audits code for security issues and suggests fixes',
      prompt: 'You are a security expert. Analyze code for: 1) Injection vulnerabilities (SQL, XSS, command), 2) Authentication and authorization issues, 3) Data exposure risks, 4) Dependency vulnerabilities, 5) Cryptographic weaknesses. Provide specific remediation steps.',
      tools: ['read', 'grep', 'bash'],
    },
  },
  {
    id: 'api-designer',
    name: 'API Designer',
    description: 'Designs RESTful and GraphQL APIs',
    category: 'development',
    template: {
      name: 'api-designer',
      description: 'Designs well-structured APIs following best practices',
      prompt: 'You are an API design expert. Create APIs that are: 1) RESTful or GraphQL compliant, 2) Consistent with proper naming conventions, 3) Versioned appropriately, 4) Well-documented with OpenAPI/GraphQL schemas, 5) Including proper error handling and status codes.',
      tools: ['read', 'write', 'grep'],
    },
  },
];

export function getSkillTemplateById(id: string): SkillTemplate | undefined {
  return SKILL_TEMPLATES.find((t) => t.id === id);
}

export function getSkillTemplatesByCategory(category: SkillTemplate['category']): SkillTemplate[] {
  return SKILL_TEMPLATES.filter((t) => t.category === category);
}

export function getAllSkillTemplates(): SkillTemplate[] {
  return [...SKILL_TEMPLATES];
}
