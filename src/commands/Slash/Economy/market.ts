import {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
} from 'discord.js';
import ISlashCommand from '~/interfaces/ISlashCommand';
import IDiscordClient from '~/interfaces/IDiscordClient';

// Helper function to create an embed with items
const createItemEmbed = (title: string, description: string, items: any[], page: number, pageSize: number) => {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .addFields(
            items.slice((page - 1) * pageSize, page * pageSize).map(item => ({
                name: item.name.replace(/_/g, ' '),
                value: `$${item.price}`,
            }))
        )
        .setFooter({ text: `Page ${page}` });
    return embed;
};

// Helper function to fetch user data
const getUserData = async (db: any, userId: string) => {
    const user = await db.queryRaw('SELECT * FROM Users WHERE id = ?;', [userId]);
    
    if (!user.length) {
        return null;
    }

    // Format user data
    const userData = user[0];

    for (const key in userData) {
        if (typeof userData[key] === 'string') {
            try {
                const parsed = JSON.parse(userData[key]);
                userData[key] = parsed;
            } catch (e) {
                // Leave it as a string if it's not JSON
            }
        }
    }

    return userData;
};

// Helper function to fetch market items
const getMarketItems = async (db: any, category: string, pageSize: number = 10) => {
    if (category === 'all') {
        return await db.queryRaw('SELECT * FROM Market LIMIT ?;', [pageSize]);
    }
    return null;
};

// Main command object
export const command: ISlashCommand = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Sell, buy, or list items in the market')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all items in the market')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('The category of items you want to see')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Your Items', value: 'user' },
                            { name: 'All Items', value: 'all' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Buy an item from the market')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The item you want to buy')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Sell an item to the market')
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('The item you want to sell')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('price')
                        .setDescription('The price you want to sell the item for')
                        .setRequired(true)
                )
        ),
    
    async execute(interaction: CommandInteraction): Promise<any> {
            //@ts-ignore
        const subcommand = interaction.options.getSubcommand();
        const db = (interaction.client as IDiscordClient).db;
        const MARKET_PAGE_SIZE = 10;


        // Handle 'list' subcommand
        if (subcommand === 'list') {
            //@ts-ignore
            const category = interaction.options.getString('category');
            const user = await getUserData(db, interaction.user.id);

            if (category === 'user') {
                if (!user || !user.market_items || user.market_items === 'null' || !user.market_items.length) {
                    return interaction.reply({
                        content: 'You don’t have any items in your inventory',
                        ephemeral: true,
                    });
                }

                const items = Array.isArray(user.market_items) ? user.market_items : JSON.parse(user.market_items);
                let page = 1;

                const embed = createItemEmbed('Your Items', 'Items in your inventory:', items, page, MARKET_PAGE_SIZE);
                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('next_page')
                            .setLabel('Next Page')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('previous_page')
                            .setLabel('Previous Page')
                            .setStyle(ButtonStyle.Primary)
                    );

                const message = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

                // Pagination handling
                const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                collector.on('collect', async i => {
                    if (i.customId === 'next_page') {
                        if (page * MARKET_PAGE_SIZE >= items.length) {
                            collector.stop();
                            return i.update({ content: 'You have reached the end of your items', components: [] });
                        }
                        page++;
                        const newEmbed = createItemEmbed('Your Items', 'Items in your inventory:', items, page, MARKET_PAGE_SIZE);
                        await i.update({ embeds: [newEmbed] });
                    } else if (i.customId === 'previous_page') {
                        if (page === 1) {
                            return i.update({ content: 'You are already at the first page', components: [] });
                        }
                        page--;
                        const newEmbed = createItemEmbed('Your Items', 'Items in your inventory:', items, page, MARKET_PAGE_SIZE);
                        await i.update({ embeds: [newEmbed] });
                    }
                });

                collector.on('end', () => {
                    message.edit({ components: [] });
                });

                return;
            }

            if (category === 'all') {
                const marketItemsRaw = await getMarketItems(db, 'all');
                if (!marketItemsRaw.length) {
                    return interaction.reply({
                        content: 'No items found in the market.',
                        ephemeral: true,
                    });
                }

                const marketItems = marketItemsRaw.map((item: any) => ({
                    name: item.item_name,
                    price: item.current_price,
                }));

                let page = 1;

                const embed = createItemEmbed('Market Items', 'Here are all the items available in the market:', marketItems, page, MARKET_PAGE_SIZE);
                const row = new ActionRowBuilder<ButtonBuilder>()

                const nextButton = new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Next Page')
                    .setStyle(ButtonStyle.Primary);

                const previousButton = new ButtonBuilder()
                    .setCustomId('previous_page')
                    .setLabel('Previous Page')
                    .setStyle(ButtonStyle.Primary)

                row.addComponents(nextButton, previousButton);

                const message = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

                // Pagination handling
                const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                collector.on('collect', async i => {
                    if (i.customId === 'next_page') {
                        if (page * MARKET_PAGE_SIZE >= marketItems.length) {
                            collector.stop();
                            return i.update({ content: 'You have reached the end of the market items', components: [] });
                        }
                        page++;
  
                        const newEmbed = createItemEmbed('Market Items', 'Here are all the items available in the market:', marketItems, page, MARKET_PAGE_SIZE);
                        await i.update({ embeds: [newEmbed] });
                    } else if (i.customId === 'previous_page') {
                        if (page === 1) {
                            return i.update({ content: 'You are already at the first page', components: [] });
                        }
                        page--;
                        const newEmbed = createItemEmbed('Market Items', 'Here are all the items available in the market:', marketItems, page, MARKET_PAGE_SIZE);
                        await i.update({ embeds: [newEmbed] });
                    }
                });

                collector.on('end', () => {
                    message.edit({ components: [] });
                });

                return;
            }
        }

        // Handle 'buy' subcommand
        if (subcommand === 'buy') {
            //@ts-ignore
            const itemName = interaction.options.getString('item')?.replace(/ /g, '_');
            const itemData = await db.queryRaw('SELECT * FROM Market WHERE lower(item_name) = lower(?);', [itemName]);

            if (!itemData.length) {
                return interaction.reply({
                    content: `Item '${itemName}' not found in the market`,
                    ephemeral: true,
                });
            }

            const item = itemData[0];
            if (item.supply === 0) {
                return interaction.reply({
                    content: 'This item is currently out of stock',
                    ephemeral: true,
                });
            }

            const user = await getUserData(db, interaction.user.id);
            if (!user) {
                return interaction.reply({
                    content: 'You need an account to buy items. Please register first.',
                    ephemeral: true,
                });
            }

            const userBalance = user.balance;
            const itemPrice = item.current_price;

            if (userBalance < itemPrice) {
                return interaction.reply({
                    content: `You don’t have enough balance to buy '${item.item_name.replace(/_/g, ' ')}'`,
                    ephemeral: true,
                });
            }

            const userItems = Array.isArray(user.market_items) ? user.market_items : JSON.parse(user.market_items);
            userItems.push({ name: item.item_name, price: item.current_price });

            // Update the user's items
            await db.queryRaw('UPDATE Users SET market_items = ? WHERE id = ?;', [JSON.stringify(userItems), interaction.user.id]);

            // Update the market (decrease supply)
            await db.queryRaw('UPDATE Market SET demand = demand + 1, supply = supply - 1 WHERE item_id = ?;', [item.item_id]);

            return interaction.reply({
                content: `You successfully bought '${item.item_name.replace(/_/g, ' ')}' for $${item.current_price}`,
            });
        }

        // Handle 'sell' subcommand
        if (subcommand === 'sell') {
            //@ts-ignore
            const itemName = interaction.options.getString('item')?.replace(/ /g, '_');
            //@ts-ignore
            const price = interaction.options.getNumber('price');

            const user = await getUserData(db, interaction.user.id);
            if (!user || !user.market_items || user.market_items === 'null') {
                return interaction.reply({
                    content: 'You don’t have any items to sell',
                    ephemeral: true,
                });
            }

            const userItems = Array.isArray(user.market_items) ? user.market_items : JSON.parse(user.market_items);
            const itemIndex = userItems.findIndex((i: any) => i.name === itemName);

            if (itemIndex === -1) {
                return interaction.reply({
                    content: `You don’t have '${itemName}' in your inventory`,
                    ephemeral: true,
                });
            }

            const [soldItem] = userItems.splice(itemIndex, 1);

            // Update user's inventory
            await db.queryRaw('UPDATE Users SET market_items = ? WHERE id = ?;', [JSON.stringify(userItems), interaction.user.id]);

            // Add item to market
            await db.queryRaw('INSERT INTO Market (item_name, item_id, base_price, current_price, supply) VALUES (?, ?, ?, ?, ?)', [
                soldItem.name, interaction.user.id, price, price, 1,
            ]);

            return interaction.reply({
                content: `You successfully listed '${soldItem.name.replace(/_/g, ' ')}' for $${price}`,
            });
        }
    },
};
