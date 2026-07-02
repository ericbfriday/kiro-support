# kiro-transition-toolkit

A scaffolding toolkit that generates Kiro configuration from environment detection, template libraries, and AI context file migration.

## Language

### Kiro Artifacts

**Steering File**:
A markdown document with YAML front-matter that instructs an AI agent on how to behave when working in a project. Carries an inclusion mode and body content describing conventions, constraints, or architectural context.
_Avoid_: rules file, config file, instruction file

**Inclusion Mode**:
The rule in a steering file's front-matter that determines when Kiro loads it into an agent's context. `always` = every interaction; `fileMatch` = when active files match a glob; `manual` = user invokes explicitly; `auto` = when the user's request matches the file's description.
_Avoid_: activation mode, trigger

**Hook**:
An event-driven automation rule that Kiro executes in response to file changes or agent lifecycle events. Defined by a trigger condition (`when`) and a reaction (`then`) — either a shell command or an agent prompt.
_Avoid_: git hook, pre-commit hook

**Skill**:
A modular instruction package that gives an agent specialized capability for a domain or workflow. The canonical format is a `SKILL.md` directory with front-matter and optional resource files. This toolkit generates simplified scaffolds that users expand into full skills.
_Avoid_: plugin, extension, tool

**Kiro Directory**:
The `.kiro/` directory at a project root containing all Kiro configuration — steering files, hooks, skills, settings, and specs. The primary output artifact this toolkit exists to scaffold.
_Avoid_: workspace config, kiro config

### Toolkit Concepts

**Template**:
A catalog entry in a library package — carries metadata (id, name, description, category) and wraps a definition. Templates are how users browse and select pre-built starting points.
_Avoid_: preset, blueprint

**Definition**:
The inner payload of a template — the actual hook, skill, or steering file content that gets written to disk when a template is instantiated. A definition becomes a file in the user's Kiro Directory.
_Avoid_: config, schema, spec

**Context File**:
A project-level file that instructs an AI coding assistant on conventions, patterns, and constraints. Each tool has its own format (`.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.windsurfrules`, etc.). These are the inputs that this toolkit converts to steering files.
_Avoid_: config file, rules file

**Context Migration**:
The process of converting context files from other AI tools into Kiro steering format. The conversion preserves intent but restructures content. Source files are not deleted.
_Avoid_: import, translation

**Runtime**:
A language toolchain detected by the env-scanner — the interpreter, compiler, or platform and its pinned version. Includes the version manager that controls it.
_Avoid_: language, toolchain, environment

**Environment Scan**:
The process of detecting which runtimes, version managers, and CI systems are configured in a project directory. Produces structured data used by the steering generator to document the project's tech stack.
_Avoid_: audit, discovery

**Steering Template**:
A pre-built steering file for a common scenario (language, framework, tool). One of three production pathways into a steering file — alongside generation (from env-scan data) and migration (from context files). Once applied, indistinguishable from hand-written steering.
_Avoid_: boilerplate, starter
