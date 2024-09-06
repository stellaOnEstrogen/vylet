import {
  Message,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  TextChannel
} from "discord.js";
import IDiscordClient from "~/interfaces/IDiscordClient";
import IMessageCommand from "~/interfaces/IMessageCommand";
import { uuid } from "~/utils/uuid";
import { config } from "~/config";


export const command: IMessageCommand = {
  name: "market",
  description: "Add, remove, or list items in the market",
  staffOnly: true,
  usage: "market [add|remove|list|stock] (item) (price) (supply)",
  execute: async (message: Message, client: IDiscordClient, args: string[]) => {
    let action = args[0];
    const itemId = args[1];
    const curentChannel = (message.channel as TextChannel);

    if (!action) action = "list";

    if (action === "add") {
      if (!itemId) {
        return await message.reply(`You must provide an item to add to the market. Example: \`${config.prefix}market add Pookie_Bear 1000\` or \`${config.prefix}market add Pookie_Bear 1000.00\``)
      }

      const price = args[2];
      const supply = args[3];

      if (!price) {
        return await message.reply(`You must provide a price for the item. Example: \`${config.prefix}market add ${itemId} 1000\` or \`${config.prefix}market add ${itemId} 1000.00\``)
      }

      if (!price.match(/^[0-9]+(\.[0-9]{1,2})?$/)) {
        return await message.reply(`Invalid price. Example: \`${config.prefix}market add ${itemId} 1000\` or \`${config.prefix}market add ${itemId} 1000.00\``)
      }

      if (!supply || isNaN(parseInt(supply))) {
        return await message.reply(`You must provide a supply for the item. Example: \`${config.prefix}market add ${itemId} ${price} 100\``)
      }


      const itemUUID = uuid({ version: 4 });

      const market = await client.db.queryRaw("SELECT * FROM Market WHERE lower(item_name) = lower(?);", [itemId]);

      if (market.length > 0) {
        return await message.reply(`Item already exists in the market. You can remove it with: \`${config.prefix}market remove ${market[0].item_id}\``);
      }

      await client.db.queryRaw("INSERT INTO Market (item_name, item_id, base_price, current_price, supply, owner_id) VALUES (?, ?, ?, ?, ?, ?);", [itemId, itemUUID, price, price, supply, message.author.id]);

      return await message.reply(`Item added to market: ${itemId.replace(/_/g, " ")} for $${price}`);
    } else if (action === "remove") {
      const market = await client.db.queryRaw("SELECT * FROM Market WHERE item_id = ?;", [itemId]);

      if (market.length === 0) {
        return await message.reply(`Item not found in the market.`);
      }

      await client.db.queryRaw("DELETE FROM Market WHERE item_id = ?;", [itemId]);

      return await message.reply(`Item removed from market: ${market[0].item_name.replace(/_/g, " ")}`);
    } else if (action === "list") {
      const market = await client.db.queryRaw("SELECT * FROM Market;");

      if (market.length === 0) {
        return await message.reply(`No items in the market.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`Market Items (${market.length})`)
        .setColor("Blue")
        .addFields(market.map((item) => {
          return {
            name: item.item_name.replace(/_/g, " "),
            value: `Price: $${item.current_price}, Demand: ${item.demand}, Supply: ${item.supply}`,
            inline: true
          }
        }))
        .setTimestamp();

      return await message.reply({ embeds: [embed] });

    } else if (action === "stock") {
      const market = await client.db.queryRaw("SELECT * FROM Market WHERE item_id = ?;", [itemId]);

      if (market.length === 0) {
        return await message.reply(`Item not found in the market.`);
      }

      const supply = args[2];

      if (!supply || isNaN(parseInt(supply))) {
        return await message.reply(`You must provide a supply for the item. Example: \`${config.prefix}market stock ${itemId} 100\``)
      }

      await client.db.queryRaw("UPDATE Market SET supply = ? WHERE item_id = ?;", [supply, itemId]);

      return await message.reply(`Item supply updated: ${market[0].item_name.replace(/_/g, " ")} now has a supply of ${supply}`);
    } else {
      return await message.reply(`Invalid action. Example: \`${config.prefix}market add Pookie_Bear 1000\`, \`${config.prefix}market remove Pookie_Bear\`, \`${config.prefix}market list\`, \`${config.prefix}market stock Pookie_Bear 100\``);
    }
  },
};

export default command;
