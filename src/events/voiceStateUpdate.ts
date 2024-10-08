import { ChannelType, Events, Message, VoiceState } from 'discord.js';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { config } from '~/config';

const CREATE_VC = config.createVoice.channelId;
const VOICE_CATEGORY = config.createVoice.categoryId;
const NO_DELETE = config.createVoice.noDelete;

module.exports = {
	name: Events.VoiceStateUpdate,
	once: false,
	async execute(
		oldState: VoiceState,
		newState: VoiceState,
		client: IDiscordClient,
	) {
		if (!newState.guild) return;
		if (!newState.member) return;
		if (newState.member.user.bot) return;

		if (!oldState.channelId && newState.channelId === CREATE_VC) {
			const channel = await newState.guild.channels.create({
				name: `︱🍓∷･${newState.member.user.username}'s Channel･୨ω୧`,
				type: ChannelType.GuildVoice,
				parent: VOICE_CATEGORY,
			});
			await newState.setChannel(channel);
		}

		if (
			oldState.channelId &&
			oldState.channelId !== CREATE_VC &&
			oldState.channelId !== VOICE_CATEGORY &&
			oldState.channel?.members.size === 0 &&
			!NO_DELETE.includes(oldState.channelId)
		) {
			await oldState.channel.delete();
		}
	},
};
