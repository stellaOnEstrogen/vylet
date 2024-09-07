import {
  Message,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import IDiscordClient from "~/interfaces/IDiscordClient";
import IMessageCommand from "~/interfaces/IMessageCommand";

export const command: IMessageCommand = {
  name: "kick",
  description: "Kick a user from the server",
  staffOnly: true,
  usage: "kick <user> [reason]",
  execute: async (message: Message, client: IDiscordClient, args: string[]) => {
    try {
      const member = message.mentions.members?.first() as GuildMember;
      const mod = message.member;

      if (!mod?.permissions.has("KickMembers")) {
        return await message.reply("You do not have permission to kick users.");
      }

      if (!member) {
        return await message.reply("You must mention a user to kick.");
      }

      if (member.roles.highest.position >= mod.roles.highest.position) {
        return await message.reply("You cannot kick a user that is above you.");
      }

      if (member?.id === mod.id) {
        return await message.reply("You cannot kick yourself.");
      }

      if (member?.id === client.user?.id) {
        return await message.reply("You cannot kick the bot.");
      }

      let reason = args.slice(1).join(" ");

      if (!reason) {
        reason = "No reason provided";
      }

	  await client.db.queryRaw("DELETE FROM Users WHERE id = ?;", [
		member.id,
	  ]);

      await member.kick(reason);

      const embed = new EmbedBuilder()
        .setTitle("User Kicked")
        .setDescription(`${member.user.tag} has been kicked from the server.`)
        .addFields(
          { name: "Moderator", value: message.author.tag, inline: true },
          { name: "Reason", value: reason, inline: true }
        )
        .setColor("Red")
        .setTimestamp();

      const userEmbed = new EmbedBuilder()
        .setTitle("You have been kicked")
        .setDescription(
          `You have been kicked from the server by ${message.author.tag}`
        )
        .addFields({ name: "Reason", value: reason, inline: true })
        .setColor("Red")
        .setTimestamp();

      await member.send({ embeds: [userEmbed] });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await message.reply("An error occurred while trying to kick the user.");
    }
  },
};

export default command;
