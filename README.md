<h1 align="center">Vylet (Violet)</h1>

Vylet is a [Discord](https://discord.com/) bot that I made for my [Community Server](https://discord.gg/tf73bchpqT) to help me with moderation and other tasks. It is written in [TypeScript](https://www.typescriptlang.org/) and uses [Discord.js](https://discord.js.org/) to interact with the Discord API.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Commands](#commands)
- [Contributing](#contributing)
- [License](#license)
- [Frequently Asked Questions](#frequently-asked-questions)
  - [Why is the bot named Vylet?](#why-is-the-bot-named-vylet)
  - [How can I contact the developer?](#how-can-i-contact-the-developer)
  - [How can I keep the bot running 24/7?](#how-can-i-keep-the-bot-running-247)


## Features

- **Fun Games**: Play games like Fishing, and Mining.
- **Leveling System**: Earn XP and level up by chatting.
- **Economy System**: Earn coins by chatting and playing games, this also includes Tax, Inflation, and economy crashs and booms.
- **Moderation**: Kick, ban, mute, and warn users.

## Installation

To install Vylet, you need to have [Node.js](https://nodejs.org/) installed on your machine. You can install Vylet by following these steps:

1. Clone the repository.

You must have [Git](https://git-scm.com/) installed on your machine to clone the repository.

```bash
git clone https://github.com/stellaOnEstrogen/vylet/
```

2. Install the dependencies.

```bash
npm install
```

3. Create a `.env` file in the root directory of the project and add the following environment variables:

```env
DISCORD_BOT_TOKEN = YOUR_DISCORD_BOT_TOKEN
DISCORD_GUILD_ID = YOUR_DISCORD_GUILD_ID
DISCORD_CLIENT_ID = YOUR_DISCORD_CLIENT_ID
```

4. Start the bot.

```bash
npm run build && npm start
```

## Usage

The bot uses the [Interactions API](https://discord.com/developers/docs/interactions/slash-commands) to interact with users. 
The interactions are used by typing `/` in the chat and selecting the command you want to use.

### Commands

You can check the list of commands by looking at the [docs/commands](/docs/commands) directory.

## Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes.
4. Commit your changes (`git commit -m "feat(feature-name): add new feature"'`).
5. Push to the branch (`git push origin feature/YourFeature`).
6. Create a new Pull Request.

Please ensure your pull request adheres to the [Code of Conduct](./.github/CODE_OF_CONDUCT.md).

## License

This project is licensed under the CC0 1.0 License. See the [LICENSE](./LICENSE) file for details.

## Frequently Asked Questions

### Why is the bot named Vylet?

The bot is named Vylet because it is a play on the word "Violet". The name "Violet" is derived from the flower of the same name, which is known for its beauty and fragrance. The bot is designed to be a helpful and friendly presence in the server, much like the flower.

### How can I contact the developer?

You can contact the developer by joining the [Community Server](https://discord.gg/tf73bchpqT) and sending a message to the developer. The developer's username is [stellaonestrogen](https://discord.com/users/1248626823638552701).

### How can I keep the bot running 24/7?

Please click the section below to see the answer for this question.

<details><summary>Using a Hosting Service</summary>

You can keep the bot running 24/7 by using a hosting service like [Heroku](https://www.heroku.com/), [Repl.it](https://repl.it/), or [Glitch](https://glitch.com/). These services allow you to host your bot for free or at a low cost. You can follow the instructions provided by the hosting service to deploy your bot.
</details>

<details><summary>Local Hosting</summary>

You can keep the bot running 24/7 by hosting it on your local machine. You can use tools like [PM2](https://pm2.keymetrics.io/) to keep the bot running in the background. PM2 is a process manager for Node.js applications that allows you to keep your bot running even when you close the terminal.

To install PM2, run the following command:

```bash
npm install pm2 -g
```

To start the bot using PM2, run the following command:

```bash
pm2 start npm --name "vylet" -- start
```

To stop the bot using PM2, run the following command:

```bash
pm2 stop vylet
```
</details>

<div align="center">
  <sub>Built with ❤︎ by <a href="https://www.0x7ffed9b08230.dev/">stellaonestrogen</a></sub>
</div>