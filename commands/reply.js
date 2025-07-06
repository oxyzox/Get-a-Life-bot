const { EmbedBuilder } = require('discord.js');
const { ensureUser } = require('../utils/gameUtils');
const { db } = require('../database/database');

module.exports = {
    name: 'reply',
    description: 'Reply to your partner\'s message',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ No Message')
                .setDescription('Please provide a message to reply with!\n**Usage:** `!reply <your message>`')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Get current relationship
        const relationship = await new Promise((resolve, reject) => {
            db.get(`SELECT rr.*, 
                    CASE 
                        WHEN rr.requester_id = ? THEN u2.username 
                        ELSE u1.username 
                    END as partner_username,
                    CASE 
                        WHEN rr.requester_id = ? THEN u2.id 
                        ELSE u1.id 
                    END as partner_id
                    FROM real_relationships rr 
                    JOIN users u1 ON rr.requester_id = u1.id 
                    JOIN users u2 ON rr.target_id = u2.id 
                    WHERE (rr.requester_id = ? OR rr.target_id = ?) AND rr.status IN (?, ?)`, 
                [user.id, user.id, user.id, user.id, 'accepted', 'married'], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!relationship) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ No Relationship')
                .setDescription('You\'re not in a relationship! You need a partner to reply to.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const messageText = args.join(' ');
        
        // Store the reply message
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO relationship_messages (relationship_id, sender_id, message) VALUES (?, ?, ?)', 
                [relationship.id, user.id, messageText], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Update relationship interaction time and love
        const loveIncrease = Math.min(5, Math.floor(messageText.length / 10));
        const newLove = Math.min(100, relationship.love + loveIncrease);
        
        await new Promise((resolve, reject) => {
            db.run('UPDATE real_relationships SET love = ?, last_interaction = ? WHERE id = ?', 
                [newLove, new Date().toISOString(), relationship.id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Send confirmation without showing the message content
        const embed = new EmbedBuilder()
            .setColor('#FF1493')
            .setTitle('💌 Reply Sent!')
            .setDescription(`Your reply was delivered to **${relationship.partner_username}**! 💕`)
            .addFields(
                {
                    name: '💖 Love Effect',
                    value: `+${loveIncrease} Love (${newLove}/100)`,
                    inline: true
                },
                {
                    name: '📱 Status',
                    value: 'Reply delivered privately',
                    inline: true
                }
            )
            .setTimestamp();
        
        // Try to send the reply to the partner
        try {
            const partner = await message.client.users.fetch(relationship.partner_id);
            const partnerEmbed = new EmbedBuilder()
                .setColor('#FF1493')
                .setTitle('💌 Reply from Your Partner!')
                .setDescription(`**${message.author.username}** replied to you:`)
                .addFields(
                    {
                        name: '💬 Reply',
                        value: `"${messageText}"`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Reply with: !reply <your message>' })
                .setTimestamp();
            
            await partner.send({ embeds: [partnerEmbed] });
            embed.setFooter({ text: `${relationship.partner_username} has been notified!` });
        } catch (error) {
            embed.setFooter({ text: 'Could not send DM notification' });
        }
        
        return message.reply({ embeds: [embed] });
    }
};