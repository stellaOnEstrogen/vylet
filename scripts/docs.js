const {
	readdirSync,
	statSync,
	existsSync,
	mkdirSync,
	writeFileSync,
} = require('fs');
const { join } = require('path');

const docsPath = join(__dirname, '..', 'docs');
const docsPaths = {
	commands: join(docsPath, 'commands'),
	commandsSlash: join(docsPath, 'commands', 'slash'),
	commandsMessage: join(docsPath, 'commands', 'message'),
};

if (!existsSync(docsPath)) {
	mkdirSync(docsPath, { recursive: true });
}

function timeConverter() {
	const options = {
		timeZone: 'Asia/Tokyo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: true,
	};

	const date = new Intl.DateTimeFormat('en-US', options).format(new Date());
	return `${date} JST (GMT+9, Tokyo)`;
}

const currentTime = timeConverter();

function makeCommandDocs() {
	const slashCommands = new Map();
	const messageCommands = new Map();

	if (!existsSync(docsPaths.commandsMessage)) {
		mkdirSync(docsPaths.commandsMessage, { recursive: true });
	}

	if (!existsSync(docsPaths.commandsSlash)) {
		mkdirSync(docsPaths.commandsSlash, { recursive: true });
	}

	const loadFiles = (path, collection) => {
		const files = readdirSync(path);

		files.forEach((file) => {
			const filePath = join(path, file);
			const stats = statSync(filePath);

			if (stats.isDirectory()) {
				loadFiles(filePath, collection);
			} else if (file.endsWith('.js') || file.endsWith('.ts')) {
				const command = require(filePath);

				// Handle commands with different structures
				if (command.command && command.command.data) {
					collection.set(command.command.data.name, command.command);
				} else if (command.command) {
					collection.set(command.command.name, command.command);
				}
			}
		});
	};

	const distCommandsPath = join(__dirname, '..', 'dist', 'commands');
	loadFiles(join(distCommandsPath, 'Slash'), slashCommands);
	loadFiles(join(distCommandsPath, 'Message'), messageCommands);

	const types = {
		1: 'Sub command',
		2: 'Sub command group',
		3: 'String',
		4: 'Integer',
		5: 'Boolean',
		6: 'User',
		7: 'Channel',
		8: 'Role',
		9: 'Mentionable',
		10: 'Number',
		11: 'Attachment',
	};

	const slashDocs = Array.from(slashCommands.values());
	const messageDocs = Array.from(messageCommands.values());

	slashDocs.forEach((command) => {
		console.log(`[SLASH] Generating docs for ${command.data.name} command`);
		let md = `# \`${command.data.name}\` Command\n\n${command.data.description}\n`;

		if (command.data.options && command.data.options.length) {
			md += '\n## Options\n\n| Name | Description | Type | Min Length | Max Length | Required | Autocomplete |\n| ---- | ----------- | ---- | ---------- | ---------- | -------- | ------------ |\n';
			command.data.options.forEach((option) => {
				md += `| \`${option.name}\` | ${option.description} | ${
					types[option.type] || 'Sub command or group'
				} | ${option.min_length || 'N/A'} | ${option.max_length || 'N/A'} | ${
					option.required ? 'Yes' : 'No'
				} | ${option.autocomplete ? 'Yes' : 'No'} |\n`;
			});

			const choices = command.data.options.filter((option) => option.choices);

			if (choices.length) {
				md += '\n\n## Choices\n\n';

				choices.forEach((option) => {
					md += `<div align="center">\n\n### ${option.name}\n\n| Name | Value |\n| ---- | ----- |\n`;

					option.choices.forEach((choice) => {
						md += `| ${choice.name} | ${choice.value} |\n`;
					});

					md += '</div>\n\n';
				});
			}
		}

		md += `\n<div align="center"><sub>Automatically generated at ${currentTime}</sub></div>`;

		const filePath = join(docsPaths.commandsSlash, `${command.data.name}.md`);

		writeFileSync(filePath, md);
	});

	messageDocs.forEach((command) => {
		const { name, description, staffOnly, usage, execute } = command;

		console.log(`[MESSAGE] Generating docs for ${name} command`);

		let md = `# \`${name}\` Command\n\n${description}\n\n`;

		if (usage) {
			md += `## Usage\n\n\`\`\`\n${usage}\n\`\`\`\n`;
		}

		if (staffOnly) {
			md += '\n\n**Staff Only**';
		}

		const isAsync = execute.constructor.name === 'AsyncFunction';

		md += `\n\n## Implementation\n\n${
			isAsync ? 'Async function' : 'Function'
		}`;

		md += `\n\n<div align="center"><sub>Automatically generated at ${currentTime}</sub></div>`;

		const filePath = join(docsPaths.commandsMessage, `${name}.md`);

		writeFileSync(filePath, md);
	});

	// Optional cleanup if necessary
	slashCommands.clear();
	messageCommands.clear();
}

async function generateDocs() {
	if (!existsSync(join(__dirname, '..', 'dist'))) {
		console.error(
			'The dist folder does not exist. Please build the project first by running `npm run build`',
		);
		process.exit(1);
	}
	makeCommandDocs();
}

(async () => {
	await generateDocs();
})();
