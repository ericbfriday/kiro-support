# kiro-transition-toolkit

Toolkit for transitioning projects to Kiro format.

## Installation

```bash
pnpm add -D @kiro-transition/cli
```

## Quick Start

Initialize Kiro for your project:

```bash
npx kiro-transition init
```

This will:
1. Scan your environment for runtime versions
2. Detect and migrate existing AI context files (CLAUDE.md, .cursorrules, etc.)
3. Create the `.kiro/` directory structure

## CLI Commands

### `kiro-transition init`

Initialize a complete Kiro setup for the project.

```bash
kiro-transition init [options]

Options:
  -d, --dir <directory>     Project directory (default: current directory)
  -n, --name <name>         Project name
  --skip-scan              Skip environment scan
  --skip-migrate           Skip context migration
```

### `kiro-transition scan`

Scan environment for runtime versions and CI configuration.

```bash
kiro-transition scan [options]

Options:
  -d, --dir <directory>     Directory to scan
  -r, --runtime <runtimes>  Runtimes to detect (comma-separated)
  -j, --json                Output as JSON
```

### `kiro-transition generate-steering`

Generate a Kiro steering file.

```bash
kiro-transition generate-steering [options]

Options:
  -d, --dir <directory>     Project directory
  -o, --output <file>       Output file path (default: .kiro/steering/main.md)
  -n, --name <name>         Project name
  -i, --inclusion <mode>    Inclusion mode (always, fileMatch, manual, auto)
  -p, --pattern <pattern>   File match pattern (for fileMatch mode)
```

### `kiro-transition migrate`

Migrate AI context files to Kiro steering format.

```bash
kiro-transition migrate [options]

Options:
  -d, --dir <directory>     Source directory
  -o, --output <directory>  Output directory (default: .kiro/steering)
  -i, --inclusion <mode>    Default inclusion mode
```

### `kiro-transition hooks`

Manage Kiro hooks.

```bash
kiro-transition hooks list [options]
kiro-transition hooks create <template-id> [options]

Options:
  -c, --category <category>  Filter by category
  -d, --dir <directory>      Output directory (default: .kiro/hooks)
```

### `kiro-transition skills`

Manage Kiro skills.

```bash
kiro-transition skills list [options]
kiro-transition skills create <template-id> [options]

Options:
  -c, --category <category>  Filter by category
  -d, --dir <directory>      Output directory (default: .kiro/skills)
```

### `kiro-transition templates`

List and apply steering templates.

```bash
kiro-transition templates [options]

Options:
  -c, --category <category>  Filter by category
  -a, --apply <template-id>  Apply a template
  -d, --dir <directory>      Output directory (default: .kiro/steering)
```

## Supported AI Context Formats

The toolkit can migrate from these formats:

- **Claude Code**: `CLAUDE.md`, `.claude/CLAUDE.md`
- **Cursor**: `.cursorrules`, `.cursor/rules/*.mdc`
- **GitHub Copilot**: `.github/copilot-instructions.md`
- **Continue**: `.continue/config.yaml`
- **Aider**: `.aider.conf.yml`
- **Windsurf**: `.windsurfrules`
- **AGENTS.md**: Cross-platform format

## Runtime Detection

The env-scanner package detects versions for:

- **Node.js**: nvm, fnm, Volta, asdf, nodenv, n
- **Python**: pyenv, asdf, conda, Poetry, pipenv, uv
- **Java/JVM**: SDKMAN!, asdf, jenv, Jabba, Gradle, Maven
- **Ruby**: rbenv, rvm, asdf
- **Go**: go.mod, go.work, asdf
- **Rust**: rustup, rust-toolchain.toml
- **.NET**: global.json
- **PHP**: phpenv, composer.json

## CI/CD Detection

Detects CI configuration from:

- GitHub Actions
- GitLab CI
- CircleCI
- Azure Pipelines
- Bitbucket Pipelines
- Docker
- Jenkins

## Hook Templates

Available hook templates:

| ID | Name | Category |
|----|------|----------|
| `typescript-lint` | TypeScript Lint Check | linting |
| `prettier-format` | Prettier Format | formatting |
| `test-related` | Run Related Tests | testing |
| `todo-check` | TODO Check | documentation |
| `security-audit` | Security Audit | security |
| `python-lint` | Python Lint Check | linting |
| `rust-clippy` | Rust Clippy | linting |
| `prereview` | Pre-Review Check | custom |

## Skill Templates

Available skill templates:

| ID | Name | Category |
|----|------|----------|
| `code-reviewer` | Code Reviewer | development |
| `test-writer` | Test Writer | testing |
| `doc-writer` | Documentation Writer | documentation |
| `refactorer` | Refactorer | refactoring |
| `security-auditor` | Security Auditor | security |
| `api-designer` | API Designer | development |

## Steering Templates

Available steering templates:

| ID | Name | Category |
|----|------|----------|
| `typescript-general` | TypeScript General | language |
| `python-general` | Python General | language |
| `react-components` | React Components | framework |
| `api-routes` | API Routes | framework |
| `git-workflow` | Git Workflow | tool |
| `docker-setup` | Docker Setup | platform |

## Programmatic API

### env-scanner

```typescript
import { scanEnvironment, scanRuntime } from '@kiro-transition/env-scanner';

const env = await scanEnvironment({
  rootDir: process.cwd(),
  runtimes: ['node', 'python'],
});

console.log(env.versions);     // Detected runtime versions
console.log(env.managers);     // Detected version managers
console.log(env.ciEnvironment); // CI configuration
```

### steering-generator

```typescript
import { 
  generateSteeringFile, 
  steeringToMarkdown,
  generateTechStackSteering 
} from '@kiro-transition/steering-generator';

const steering = await generateSteeringFile({
  projectName: 'my-project',
  techStack: ['TypeScript', 'React'],
  inclusionMode: 'always',
});

const markdown = steeringToMarkdown(steering);
```

### context-migrator

```typescript
import { 
  detectContextFiles, 
  migrateToSteering 
} from '@kiro-transition/context-migrator';

const result = await migrateToSteering({
  rootDir: process.cwd(),
  outputDir: '.kiro/steering',
});

console.log(result.steeringFiles); // Generated steering files
console.log(result.warnings);      // Any migration warnings
```

### hooks-library

```typescript
import { 
  getAllTemplates, 
  instantiateTemplate, 
  validateHook 
} from '@kiro-transition/hooks-library';

const templates = getAllTemplates();
const hook = instantiateTemplate('typescript-lint', { file: 'src/index.ts' });
const errors = validateHook(hook);
```

### skills-library

```typescript
import { 
  getAllSkillTemplates, 
  instantiateSkillTemplate, 
  validateSkill 
} from '@kiro-transition/skills-library';

const templates = getAllSkillTemplates();
const skill = instantiateSkillTemplate('code-reviewer');
const errors = validateSkill(skill);
```

### steering-library

```typescript
import { 
  getAllSteeringTemplates, 
  writeSteeringFromTemplate 
} from '@kiro-transition/steering-library';

const templates = getAllSteeringTemplates();
await writeSteeringFromTemplate('typescript-general', '.kiro/steering');
```

## License

MIT
