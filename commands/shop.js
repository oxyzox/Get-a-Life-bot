const { EmbedBuilder } = require('discord.js');
const { ensureUser, formatMoney } = require('../utils/gameUtils');
const { updateUser, addInventoryItem } = require('../database/database');
const { shopItems } = require('../data/gameData');

module.exports = {
    name: 'shop',
    description: 'Browse and buy items from the shop',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        if (args.length === 0) {
            // Show shop categories
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🛒 Life Shop')
                .setDescription('Welcome to the shop! Choose a category to browse items.\n\n**Categories:**\n🍎 `!shop food` - Food and consumables\n📱 `!shop items` - Personal items\n💊 `!shop medicine` - Health items\n\n**Usage:** `!shop buy <item_name>` to purchase an item!')
                .setFooter({ text: `Your balance: ${formatMoney(user.balance)}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (args[0].toLowerCase() === 'buy' && args[1]) {
            const itemName = args[1].toLowerCase();
            let item = null;
            let category = null;
            
            // Find the item in all categories
            for (const [cat, items] of Object.entries(shopItems)) {
                if (items[itemName]) {
                    item = items[itemName];
                    category = cat;
                    break;
                }
            }
            
            if (!item) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Item Not Found')
                    .setDescription('That item doesn\'t exist in the shop! Use `!shop <category>` to browse items.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (user.balance < item.price) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('💸 Insufficient Funds')
                    .setDescription(`You don't have enough money to buy **${item.name}**!\n**Price:** ${formatMoney(item.price)}\n**Your balance:** ${formatMoney(user.balance)}`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Buy the item
            const newBalance = user.balance - item.price;
            await updateUser(user.id, { balance: newBalance });
            await addInventoryItem(user.id, itemName);
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('✅ Purchase Successful!')
                .setDescription(`You bought **${item.name}** for ${formatMoney(item.price)}!`)
                .addFields(
                    {
                        name: '📦 Item',
                        value: `**${item.name}**\n${item.description}`,
                        inline: true
                    },
                    {
                        name: '💰 Balance',
                        value: `${formatMoney(newBalance)}`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Use !inventory to view your items!' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Show category items
        const category = args[0].toLowerCase();
        
        if (!shopItems[category]) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Invalid Category')
                .setDescription('Available categories: `food`, `items`, `medicine`')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const categoryEmojis = {
            food: '🍎',
            items: '📱',
            medicine: '💊'
        };
        
        const items = shopItems[category];
        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle(`${categoryEmojis[category]} Shop - ${category.charAt(0).toUpperCase() + category.slice(1)}`)
            .setDescription(`Use \`!shop buy <item_name>\` to purchase an item!\n\n`)
            .setFooter({ text: `Your balance: ${formatMoney(user.balance)}` })
            .setTimestamp();
        
        let itemsList = '';
        for (const [key, item] of Object.entries(items)) {
            itemsList += `**${item.name}** - ${formatMoney(item.price)}\n`;
            itemsList += `${item.description}\n\n`;
        }
        
        embed.setDescription(embed.data.description + itemsList);
        
        message.reply({ embeds: [embed] });
    }
};