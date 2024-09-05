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

function makeCommandDocs() {
	const slashCommands = new Map();
	const messageCommands = new Map();

	const loadFiles = (path, collection) => {
		const exists = existsSync(path);
		if (!exists) return;
		const files = readdirSync(path);

		files.forEach((file) => {
			const filePath = join(path, file);
			const stats = statSync(filePath);

			if (stats.isDirectory()) {
				loadFiles(filePath, collection);
			} else if (file.endsWith('.js') || file.endsWith('.ts')) {
				const command = require(filePath);
				collection.set(command.command.data.name, command.command);
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
		let md = `# \`${command.data.name}\` Command\n\n${
			command.data.description
		}${
			command.data.options.length ?
				'\n\n## Options\n\n| Name | Description | Type | Min Length | Max Length | Required | Autocomplete |\n| ---- | ----------- | ---- | ---------- | ---------- | -------- | ------------ |\n'
			:	''
		}`;

		if (command.data.options) {
			command.data.options.forEach((option) => {
				md += `| \`${option.name}\` | ${option.description} | ${
					types[option.type]
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

		md += `\n<div align="center"><sub>Automatically generated at ${new Date().toISOString()}</sub></div>`;

		const filePath = join(docsPaths.commandsSlash, `${command.data.name}.md`);

		if (!existsSync(docsPaths.commandsSlash)) {
			mkdirSync(docsPaths.commandsSlash, { recursive: true });
		}

		writeFileSync(filePath, md);
	});

	console.warn('Message commands are not supported yet!');

	slashCommands.clear();
	messageCommands.clear();
	slashDocs.length = 0;
	messageDocs.length = 0;
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
