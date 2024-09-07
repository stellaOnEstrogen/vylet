const { execSync } = require('child_process');
const readline = require('readline');

const rawArgs = process.argv.slice(2);
const isSilent = rawArgs.includes('--silent') || rawArgs.includes('-s');
const skipArgs = rawArgs.includes('--skip') || rawArgs.includes('-sk');
const specArgs = rawArgs.includes('--spec') || rawArgs.includes('-sp');
const isVerbose = rawArgs.includes('--verbose') || rawArgs.includes('-v');
const confirmEach = rawArgs.includes('--confirm') || rawArgs.includes('-c');
const listCommands = rawArgs.includes('--list') || rawArgs.includes('-l');
const runInParallel = rawArgs.includes('--parallel') || rawArgs.includes('-p');

// Command definitions
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
		description: 'Compile TypeScript with alias support',
		command: 'tsc-alias',
	},
	{
		name: 'deploy-commands',
		description: 'Deploy commands to Discord API',
		command: 'npm run deploy-commands',
	},
	{
		name: 'docs',
		description: 'Generate documentation for commands',
		command: 'npm run docs',
	},
];

// Helper to display usage
const displayHelp = () => {
	console.log('Usage: npm run build [options]');
	console.log('Options:');
	console.log('  -h, --help       Display this help message');
	console.log('  -l, --list       List available commands');
	console.log('  -c, --confirm    Confirm before running each command');
	console.log('  -p, --parallel   Run commands in parallel');
	console.log('  -v, --verbose    Show detailed output');
	console.log('  -s, --silent     Run commands silently');
	console.log('  -sk, --skip      Skip the specified command');
	console.log('  -sp, --spec      Run the specified command');
	console.log(
		'\nIf no options are provided, all commands will be run in sequence.\n',
	);
	process.exit(0);
};

// Helper to list commands
const listAvailableCommands = () => {
	console.log('Available Commands:');
	commands.forEach(({ name, description }) =>
		console.log(`  ${name} - ${description}`),
	);
	process.exit(0);
};

// Helper to confirm execution
const confirmCommand = (name) =>
	new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question(
			`[BUILDER] Are you sure you want to run "${name}"? (y/n) `,
			(answer) => {
				rl.close();
				resolve(answer.toLowerCase() === 'y');
			},
		);
	});

// Helper to execute a command
const runCommand = async (command) => {
	const { name, command: cmd } = command;
	if (confirmEach) {
		const confirmed = await confirmCommand(name);
		if (!confirmed) {
			console.log(`[BUILDER] Skipped ${name}`);
			return;
		}
	}

	console.log(
		`[BUILDER] Running ${name} command ${isSilent ? 'silently' : ''}`,
	);
	execSync(cmd, { stdio: isSilent ? 'ignore' : 'inherit' });
};

// Filter and run specified commands or all commands if none specified
const processCommands = async () => {
	const selectedCommands = commands.filter((command) => {
		if (skipArgs && rawArgs.includes(command.name)) return false;
		if (specArgs && !rawArgs.includes(command.name)) return false;
		return true;
	});

	if (runInParallel) {
		await Promise.all(selectedCommands.map((command) => runCommand(command)));
	} else {
		for (const command of selectedCommands) {
			await runCommand(command);
		}
	}
};

// Handle --help or --list flags
if (rawArgs.includes('-h') || rawArgs.includes('--help')) displayHelp();
if (listCommands) listAvailableCommands();

// Execute the command processing
processCommands();
