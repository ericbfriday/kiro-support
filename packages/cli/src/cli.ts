#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { scanEnvironment } from '@kiro-transition/env-scanner';
import { generateSteeringFile, steeringToMarkdown, generateTechStackSteering } from '@kiro-transition/steering-generator';
import { migrateToSteering, writeMigrationResult, detectContextFiles } from '@kiro-transition/context-migrator';
import { getAllTemplates, getTemplatesByCategory, instantiateTemplate, validateHook, writeHookFile, generateHookFileName } from '@kiro-transition/hooks-library';
import { getAllSkillTemplates, getSkillTemplatesByCategory, instantiateSkillTemplate, validateSkill, writeSkillFile } from '@kiro-transition/skills-library';
import { getAllSteeringTemplates, getSteeringTemplatesByCategory, writeSteeringFromTemplate } from '@kiro-transition/steering-library';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import ora from 'ora';

const packageJson = {
  name: '@kiro-transition/cli',
  version: '0.0.1',
};

const program = new Command();

program
  .name('kiro-transition')
  .description('Toolkit for transitioning projects to Kiro format')
  .version(packageJson.version);

program
  .command('scan')
  .description('Scan environment for runtime versions and CI configuration')
  .option('-d, --dir <directory>', 'Directory to scan', process.cwd())
  .option('-r, --runtime <runtimes>', 'Runtimes to detect (comma-separated)', 'node,python,java,ruby,go,rust,dotnet,php')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Scanning environment...').start();
    
    try {
      const runtimes = options.runtime.split(',').map((r: string) => r.trim());
      const result = await scanEnvironment({
        rootDir: options.dir,
        runtimes,
      });
      
      spinner.stop();
      
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      
      console.log(chalk.bold('\n🔍 Environment Scan Results\n'));
      
      if (result.versions.length > 0) {
        console.log(chalk.cyan('Detected Runtimes:'));
        for (const v of result.versions) {
          console.log(`  ${chalk.green(v.runtime)}: ${v.version} (${v.source.description})`);
        }
      } else {
        console.log(chalk.yellow('No runtime versions detected'));
      }
      
      if (result.managers.length > 0) {
        console.log(chalk.cyan('\nVersion Managers:'));
        for (const m of result.managers) {
          console.log(`  ${m.active ? chalk.green('●') : chalk.red('○')} ${m.name}${m.path ? ` (${m.path})` : ''}`);
        }
      }
      
      if (result.ciEnvironment) {
        console.log(chalk.cyan('\nCI Environment:'));
        console.log(`  Platform: ${result.ciEnvironment.platform}`);
        if (result.ciEnvironment.versions.length > 0) {
          for (const v of result.ciEnvironment.versions) {
            console.log(`  ${v.runtime}: ${v.version}`);
          }
        }
      }
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

program
  .command('generate-steering')
  .description('Generate a Kiro steering file')
  .option('-d, --dir <directory>', 'Project directory', process.cwd())
  .option('-o, --output <file>', 'Output file path', '.kiro/steering/main.md')
  .option('-n, --name <name>', 'Project name')
  .option('-i, --inclusion <mode>', 'Inclusion mode (always, fileMatch, manual, auto)', 'always')
  .option('-p, --pattern <pattern>', 'File match pattern (for fileMatch mode)')
  .action(async (options) => {
    const spinner = ora('Generating steering file...').start();
    
    try {
      const steering = await generateSteeringFile({
        projectName: options.name,
        inclusionMode: options.inclusion,
        fileMatchPattern: options.pattern,
      });
      
      const outputPath = path.join(options.dir, options.output);
      const markdown = steeringToMarkdown(steering);
      
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, markdown, 'utf-8');
      
      spinner.succeed(`Steering file created at ${outputPath}`);
    } catch (error) {
      spinner.fail('Failed to generate steering file');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

program
  .command('migrate')
  .description('Migrate AI context files to Kiro steering format')
  .option('-d, --dir <directory>', 'Source directory', process.cwd())
  .option('-o, --output <directory>', 'Output directory', '.kiro/steering')
  .option('-i, --inclusion <mode>', 'Default inclusion mode', 'always')
  .action(async (options) => {
    const spinner = ora('Detecting context files...').start();
    
    try {
      const result = await migrateToSteering({
        rootDir: options.dir,
        outputDir: options.output,
        inclusionMode: options.inclusion,
      });
      
      spinner.text = 'Writing steering files...';
      await writeMigrationResult(result, { rootDir: options.dir, outputDir: options.output });
      
      spinner.succeed(`Migrated ${result.steeringFiles.length} files`);
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        for (const w of result.warnings) {
          console.log(`  ⚠ ${w}`);
        }
      }
      
      console.log(chalk.cyan('\nGenerated files:'));
      for (const f of result.steeringFiles) {
        console.log(`  ${f.path} (from ${f.sourceFormat})`);
      }
    } catch (error) {
      spinner.fail('Migration failed');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

const hooksCommand = program.command('hooks').description('Manage Kiro hooks');

hooksCommand
  .command('list')
  .description('List available hook templates')
  .option('-c, --category <category>', 'Filter by category')
  .action((options) => {
    const templates = options.category 
      ? getTemplatesByCategory(options.category)
      : getAllTemplates();
    
    console.log(chalk.bold('\n🎣 Hook Templates\n'));
    
    for (const t of templates) {
      console.log(`${chalk.green(t.id)} - ${t.name}`);
      console.log(`  ${chalk.gray(t.description)}`);
      console.log(`  Category: ${t.category}`);
      console.log();
    }
  });

hooksCommand
  .command('create <template-id>')
  .description('Create a hook from a template')
  .option('-d, --dir <directory>', 'Output directory', '.kiro/hooks')
  .option('-e, --enabled <boolean>', 'Enable the hook', 'true')
  .action(async (templateId, options) => {
    const hook = instantiateTemplate(templateId);
    if (!hook) {
      console.error(chalk.red(`Template not found: ${templateId}`));
      process.exit(1);
    }
    
    hook.enabled = options.enabled === 'true';
    
    const errors = validateHook(hook);
    if (errors.length > 0) {
      console.error(chalk.red('Invalid hook:'));
      errors.forEach((e) => console.error(`  ${e}`));
      process.exit(1);
    }
    
    const outputPath = path.join(options.dir, generateHookFileName(hook));
    await writeHookFile(hook, outputPath);
    
    console.log(chalk.green(`Hook created at ${outputPath}`));
  });

const skillsCommand = program.command('skills').description('Manage Kiro skills');

skillsCommand
  .command('list')
  .description('List available skill templates')
  .option('-c, --category <category>', 'Filter by category')
  .action((options) => {
    const templates = options.category 
      ? getSkillTemplatesByCategory(options.category)
      : getAllSkillTemplates();
    
    console.log(chalk.bold('\n🎯 Skill Templates\n'));
    
    for (const t of templates) {
      console.log(`${chalk.green(t.id)} - ${t.name}`);
      console.log(`  ${chalk.gray(t.description)}`);
      console.log(`  Category: ${t.category}`);
      console.log();
    }
  });

skillsCommand
  .command('create <template-id>')
  .description('Create a skill from a template')
  .option('-d, --dir <directory>', 'Output directory', '.kiro/skills')
  .action(async (templateId, options) => {
    const skill = instantiateSkillTemplate(templateId);
    if (!skill) {
      console.error(chalk.red(`Template not found: ${templateId}`));
      process.exit(1);
    }
    
    const errors = validateSkill(skill);
    if (errors.length > 0) {
      console.error(chalk.red('Invalid skill:'));
      errors.forEach((e) => console.error(`  ${e}`));
      process.exit(1);
    }
    
    const outputPath = await writeSkillFile(skill, options.dir);
    console.log(chalk.green(`Skill created at ${outputPath}`));
  });

program
  .command('templates')
  .description('List and apply steering templates')
  .option('-c, --category <category>', 'Filter by category')
  .option('-a, --apply <template-id>', 'Apply a template')
  .option('-d, --dir <directory>', 'Output directory', '.kiro/steering')
  .action(async (options) => {
    if (options.apply) {
      const outputPath = await writeSteeringFromTemplate(options.apply, options.dir);
      if (!outputPath) {
        console.error(chalk.red(`Template not found: ${options.apply}`));
        process.exit(1);
      }
      console.log(chalk.green(`Steering file created at ${outputPath}`));
      return;
    }
    
    const templates = options.category 
      ? getSteeringTemplatesByCategory(options.category)
      : getAllSteeringTemplates();
    
    console.log(chalk.bold('\n📝 Steering Templates\n'));
    
    for (const t of templates) {
      console.log(`${chalk.green(t.id)} - ${t.name}`);
      console.log(`  ${chalk.gray(t.description)}`);
      console.log(`  Category: ${t.category}`);
      console.log();
    }
  });

program
  .command('init')
  .description('Initialize a complete Kiro setup for the project')
  .option('-d, --dir <directory>', 'Project directory', process.cwd())
  .option('-n, --name <name>', 'Project name')
  .option('--skip-scan', 'Skip environment scan')
  .option('--skip-migrate', 'Skip context migration')
  .action(async (options) => {
    console.log(chalk.bold.cyan('\n🚀 Initializing Kiro setup...\n'));
    
    const kiroDir = path.join(options.dir, '.kiro');
    
    if (!options.skipScan) {
      const spinner = ora('Scanning environment...').start();
      const env = await scanEnvironment({ rootDir: options.dir });
      spinner.succeed(`Found ${env.versions.length} runtime versions`);
      
      if (env.versions.length > 0) {
        const steering = await generateTechStackSteering(env.versions, {
          projectName: options.name,
        });
        const outputPath = path.join(kiroDir, 'steering', 'tech-stack.md');
        const markdown = steeringToMarkdown(steering);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, markdown, 'utf-8');
        console.log(chalk.gray(`  Created ${outputPath}`));
      }
    }
    
    if (!options.skipMigrate) {
      const spinner = ora('Detecting existing AI context files...').start();
      const contextFiles = await detectContextFiles(options.dir);
      
      if (contextFiles.length > 0) {
        spinner.text = `Migrating ${contextFiles.length} context files...`;
        const result = await migrateToSteering({
          rootDir: options.dir,
          outputDir: path.join(kiroDir, 'steering'),
        });
        await writeMigrationResult(result, { 
          rootDir: options.dir, 
          outputDir: path.join(kiroDir, 'steering') 
        });
        spinner.succeed(`Migrated ${result.steeringFiles.length} context files`);
      } else {
        spinner.succeed('No existing context files found');
      }
    }
    
    const spinner = ora('Creating Kiro directory structure...').start();
    await fs.mkdir(path.join(kiroDir, 'steering'), { recursive: true });
    await fs.mkdir(path.join(kiroDir, 'hooks'), { recursive: true });
    await fs.mkdir(path.join(kiroDir, 'skills'), { recursive: true });
    await fs.mkdir(path.join(kiroDir, 'specs'), { recursive: true });
    spinner.succeed('Created .kiro directory structure');
    
    console.log(chalk.bold.green('\n✅ Kiro setup complete!\n'));
    console.log('Next steps:');
    console.log('  1. Review generated steering files in .kiro/steering/');
    console.log('  2. Add project-specific hooks: kiro-transition hooks list');
    console.log('  3. Add skills: kiro-transition skills list');
    console.log('  4. Create specs: kiro spec init <feature-name>');
  });

program.parse();
