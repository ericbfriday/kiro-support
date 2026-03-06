import type { SteeringFrontmatter } from '@kiro-transition/steering-generator';

export interface SteeringTemplate {
  id: string;
  name: string;
  description: string;
  category: 'language' | 'framework' | 'tool' | 'platform' | 'custom';
  frontmatter: SteeringFrontmatter;
  contentTemplate: string;
}

export const STEERING_TEMPLATES: SteeringTemplate[] = [
  {
    id: 'typescript-general',
    name: 'TypeScript General',
    description: 'General TypeScript project steering with best practices',
    category: 'language',
    frontmatter: {
      inclusion: 'always',
    },
    contentTemplate: `# TypeScript Project

## Build Commands
\`\`\`bash
npm run build
npm run typecheck
\`\`\`

## Code Style
- Use strict mode
- Prefer interfaces over type aliases for object shapes
- Use const assertions for literal types
- Avoid \`any\` - use \`unknown\` when type is truly unknown

## Testing
\`\`\`bash
npm test
npm run test:coverage
\`\`\`

## Key Patterns
- Use discriminated unions for state management
- Prefer composition over inheritance
- Use utility types (Pick, Omit, Partial) for type transformations
`,
  },
  {
    id: 'python-general',
    name: 'Python General',
    description: 'General Python project steering with best practices',
    category: 'language',
    frontmatter: {
      inclusion: 'always',
    },
    contentTemplate: `# Python Project

## Build Commands
\`\`\`bash
pip install -e .
python -m build
\`\`\`

## Code Style
- Follow PEP 8 conventions
- Use type hints for all public functions
- Use f-strings for string formatting
- Prefer dataclasses for simple data containers

## Testing
\`\`\`bash
pytest
pytest --cov
\`\`\`

## Key Patterns
- Use context managers for resource handling
- Prefer composition over inheritance
- Use pathlib for file paths
`,
  },
  {
    id: 'react-components',
    name: 'React Components',
    description: 'React component development steering',
    category: 'framework',
    frontmatter: {
      inclusion: 'fileMatch',
      fileMatchPattern: ['**/*.tsx', '**/components/**'],
    },
    contentTemplate: `# React Components

## Component Guidelines
- Use functional components with hooks
- Prefer composition over prop drilling
- Keep components small and focused
- Use TypeScript for prop types

## State Management
- Use useState for local state
- Use useReducer for complex state
- Consider context for shared state

## Styling
- Use CSS modules or styled-components
- Follow BEM naming if using plain CSS

## Testing
\`\`\`bash
npm run test:components
\`\`\`
`,
  },
  {
    id: 'api-routes',
    name: 'API Routes',
    description: 'REST API development steering',
    category: 'framework',
    frontmatter: {
      inclusion: 'fileMatch',
      fileMatchPattern: ['**/routes/**', '**/api/**'],
    },
    contentTemplate: `# API Routes

## Design Principles
- Follow REST conventions
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Version your APIs

## Request/Response
- Validate all input
- Use consistent response format
- Include error details in error responses

## Security
- Authenticate all non-public endpoints
- Validate and sanitize input
- Use rate limiting

## Documentation
- Document all endpoints
- Include request/response examples
`,
  },
  {
    id: 'git-workflow',
    name: 'Git Workflow',
    description: 'Git commit and branch conventions',
    category: 'tool',
    frontmatter: {
      inclusion: 'always',
    },
    contentTemplate: `# Git Workflow

## Commit Messages
- Use conventional commits format
- Keep first line under 50 characters
- Reference issues when applicable

## Branch Naming
- feature/description
- fix/description
- refactor/description

## Pull Requests
- Small, focused changes
- Clear description of changes
- All tests passing
`,
  },
  {
    id: 'docker-setup',
    name: 'Docker Setup',
    description: 'Docker configuration best practices',
    category: 'platform',
    frontmatter: {
      inclusion: 'fileMatch',
      fileMatchPattern: ['Dockerfile*', 'docker-compose*.yml'],
    },
    contentTemplate: `# Docker Configuration

## Best Practices
- Use multi-stage builds
- Minimize layer count
- Use .dockerignore
- Don't run as root

## Security
- Scan images for vulnerabilities
- Use specific version tags
- Keep base images updated

## Optimization
- Order layers by change frequency
- Use build cache effectively
`,
  },
];

export function getSteeringTemplateById(id: string): SteeringTemplate | undefined {
  return STEERING_TEMPLATES.find((t) => t.id === id);
}

export function getSteeringTemplatesByCategory(category: SteeringTemplate['category']): SteeringTemplate[] {
  return STEERING_TEMPLATES.filter((t) => t.category === category);
}

export function getAllSteeringTemplates(): SteeringTemplate[] {
  return [...STEERING_TEMPLATES];
}
