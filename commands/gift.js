const { EmbedBuilder } = require('discord.js');
const { ensureUser } = require('../utils/gameUtils');
const { getInventory, removeInventoryItem, addInventoryItem, db } = require('../database/database');
const { shopItems } = require('../data/gameData');

module.exports = {
    name: 'gift',
    description: 'Send items from your inventory to friends',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ No Recipient')
                .setDescription('Please mention a user to send a gift to!\n**Usage:** `!gift @user <item_name>`')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (targetUser.id === message.author.id) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Cannot Gift Yourself')
                .setDescription('You cannot send gifts to yourself!')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (targetUser.bot) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Cannot Gift Bots')
                .setDescription('You cannot send gifts to bots!')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ No Item Specified')
                .setDescription('Please specify an item to gift!\n**Usage:** `!gift @user <item_name>`')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Ensure target user exists
        const recipient = await ensureUser(targetUser.id, targetUser.username);
        
        // Check if users are friends
        const friendship = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM friends WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?', 
                [user.id, recipient.id, recipient.id, user.id, 'accepted'], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!friendship) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Not Friends')
                .setDescription(`You must be friends with ${targetUser.username} to send them gifts!\nUse \`!friend add @${targetUser.username}\` to send a friend request.`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const itemName = args[0].toLowerCase();
        
        // Check if user has the item
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
        
        if (!itemDetails) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Invalid Item')
                .setDescription('That item cannot be gifted!')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        try {
            // Remove item from sender's inventory
            await removeInventoryItem(user.id, itemName, 1);
            
            // Add item to recipient's inventory
            await addInventoryItem(recipient.id, itemName, 1);
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('🎁 Gift Sent Successfully!')
                .setDescription(`You sent **${itemDetails.name}** to ${targetUser.username}!`)
                .addFields(
                    {
                        name: '🎁 Gift',
                        value: `**${itemDetails.name}**\n${itemDetails.description}`,
                        inline: true
                    },
                    {
                        name: '👤 Recipient',
                        value: targetUser.username,
                        inline: true
                    },
                    {
                        name: '📦 Remaining',
                        value: `${Math.max(0, inventoryItem.quantity - 1)}x left`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Spreading kindness strengthens friendships!' })
                .setTimestamp();
            
            // Try to notify the recipient
            try {
                const recipientEmbed = new EmbedBuilder()
                    .setColor('#FF69B4')
                    .setTitle('🎁 You Received a Gift!')
                    .setDescription(`${message.author.username} sent you **${itemDetails.name}**!`)
                    .addFields(
                        {
                            name: '🎁 Gift',
                            value: `**${itemDetails.name}**\n${itemDetails.description}`,
                            inline: true
                        },
                        {
                            name: '👤 From',
                            value: message.author.username,
                            inline: true
                        }
                    )
                    .setFooter({ text: 'Check your inventory with !inventory' })
                    .setTimestamp();
                
                await targetUser.send({ embeds: [recipientEmbed] });
                embed.setFooter({ text: `${targetUser.username} has been notified of your gift!` });
            } catch (error) {
                // If we can't DM the user, that's okay
                console.log(`Could not DM ${targetUser.username} about gift`);
            }
            
            return message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Gift error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Gift Failed')
                .setDescription('Something went wrong while sending the gift. Please try again!')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
    }
};