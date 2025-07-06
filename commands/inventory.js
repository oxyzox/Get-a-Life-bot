const { EmbedBuilder } = require('discord.js');
const { ensureUser } = require('../utils/gameUtils');
const { getInventory, removeInventoryItem, updateUser } = require('../database/database');
const { shopItems } = require('../data/gameData');

module.exports = {
    name: 'inventory',
    description: 'View and use items in your inventory',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        if (args.length === 0) {
            // Show inventory
            const inventory = await getInventory(user.id);
            
            if (inventory.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('📦 Your Inventory')
                    .setDescription('Your inventory is empty! Visit the `!shop` to buy some items.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('📦 Your Inventory')
                .setDescription('Use `!inventory use <item_name>` to use an item!\n\n')
                .setTimestamp();
            
            let inventoryList = '';
            for (const item of inventory) {
                // Find item details
                let itemDetails = null;
                for (const category of Object.values(shopItems)) {
                    if (category[item.item_name]) {
                        itemDetails = category[item.item_name];
                        break;
                    }
                }
                
                if (itemDetails) {
                    inventoryList += `**${itemDetails.name}** x${item.quantity}\n`;
                    inventoryList += `${itemDetails.description}\n\n`;
                }
            }
            
            embed.setDescription(embed.data.description + inventoryList);
            
            return message.reply({ embeds: [embed] });
        }
        
        if (args[0].toLowerCase() === 'use' && args[1]) {
            const itemName = args[1].toLowerCase();
            
            // Find item in inventory
            const inventory = await getInventory(user.id);
            const inventoryItem = inventory.find(item => item.item_name === itemName);
            
            if (!inventoryItem) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Item Not Found')
                    .setDescription('You don\'t have that item in your inventory!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Find item details
            let itemDetails = null;
            for (const category of Object.values(shopItems)) {
                if (category[itemName]) {
                    itemDetails = category[itemName];
                    break;
                }
            }
            
            if (!itemDetails || !itemDetails.effect) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Cannot Use Item')
                    .setDescription('This item cannot be used!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Apply item effects
            const updates = {};
            let effectDescription = '';
            
            for (const [stat, value] of Object.entries(itemDetails.effect)) {
                const currentValue = user[stat];
                const newValue = Math.min(100, currentValue + value);
                updates[stat] = newValue;
                
                const change = newValue - currentValue;
                if (change > 0) {
                    effectDescription += `+${change} ${stat.charAt(0).toUpperCase() + stat.slice(1)}\n`;
                }
            }
            
            // Remove item from inventory
            await removeInventoryItem(user.id, itemName, 1);
            
            // Update user stats
            await updateUser(user.id, updates);
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('✅ Item Used!')
                .setDescription(`You used **${itemDetails.name}**!`)
                .addFields(
                    {
                        name: '📈 Effects',
                        value: effectDescription || 'No effects applied',
                        inline: true
                    },
                    {
                        name: '📦 Remaining',
                        value: `${Math.max(0, inventoryItem.quantity - 1)}x left`,
                        inline: true
                    }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ Invalid Usage')
            .setDescription('Use `!inventory` to view items or `!inventory use <item_name>` to use an item!')
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};