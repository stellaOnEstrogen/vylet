const { execSync } = require('child_process');

const rawArgs = process.argv;
const args = rawArgs.slice(2);

const commands = [
	{
		name: 'format',
		description: 'Format the codebase using prettier',
		command: 'npm run format',
	},
	{
		name: 'tsc',
		description: 'Compile the TypeScript codebase',
		command: 'tsc',
	},
	{
		name: 'tsc-alias',
		description: 'Compile the TypeScript codebase with alias support',
		command: 'tsc-alias',
	},
	{
		name: 'deploy-commands',
		description: 'Deploy the commands to the Discord API',
		command: 'npm run deploy-commands',
	},
	{
		name: 'docs',
		description: 'Generate the documentation for the commands',
		command: 'npm run docs',
	},
];

if (args.includes('-h') || args.includes('--help')) {
	console.log('Usage: npm run build [options]');
	console.log('Options:');
	console.log('  -h, --help     Display this help message');
	console.log('  --silent, -s   Run the commands silently');
	console.log('  --skip         Skip the specified commands');
	console.log('Commands:');
	commands.forEach((command) => {
		console.log(`  ${command.name} - ${command.description}`);
	});
	process.exit(0);
}

const isSilent = args.includes('--silent') || args.includes('-s');

commands.forEach((command) => {
	if (args.includes('--skip') && args.includes(command.name)) {
		console.log(`[BUILDER] Skipping ${command.name} command`);
		return;
	}
	console.log(
		`[BUILDER] Running ${command.name} command ${isSilent ? 'silently' : ''}`,
	);

	if (isSilent) {
		execSync(command.command, { stdio: 'ignore' });
		return;
	}

	execSync(command.command, { stdio: 'inherit' });
});
