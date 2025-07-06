const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/database');

module.exports = {
    name: 'admin',
    description: 'Admin commands for server management',
    async execute(message, args) {
        // Check if user has administrator permissions
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Access Denied')
                .setDescription('You need Administrator permissions to use this command!')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (args.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Invalid Usage')
                .setDescription('**Admin Commands:**\n`!admin channel add #channel` - Allow bot commands in channel\n`!admin channel remove #channel` - Disable bot commands in channel\n`!admin channel list` - View allowed channels\n`!admin channel reset` - Allow commands in all channels')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const action = args[0].toLowerCase();
        
        if (action === 'channel') {
            const subAction = args[1]?.toLowerCase();
            
            if (subAction === 'add') {
                const channel = message.mentions.channels.first();
                if (!channel) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('❌ No Channel Mentioned')
                        .setDescription('Please mention a channel to add!\n**Usage:** `!admin channel add #channel`')
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                }
                
                // Add channel to allowed list
                await new Promise((resolve, reject) => {
                    db.run('INSERT OR REPLACE INTO allowed_channels (guild_id, channel_id) VALUES (?, ?)', 
                        [message.guild.id, channel.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                const embed = new EmbedBuilder()
                    .setColor('#4CAF50')
                    .setTitle('✅ Channel Added')
                    .setDescription(`Bot commands are now allowed in ${channel}!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (subAction === 'remove') {
                const channel = message.mentions.channels.first();
                if (!channel) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('❌ No Channel Mentioned')
                        .setDescription('Please mention a channel to remove!\n**Usage:** `!admin channel remove #channel`')
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                }
                
                // Remove channel from allowed list
                const result = await new Promise((resolve, reject) => {
                    db.run('DELETE FROM allowed_channels WHERE guild_id = ? AND channel_id = ?', 
                        [message.guild.id, channel.id], function(err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    });
                });
                
                if (result === 0) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle('❌ Channel Not Found')
                        .setDescription(`${channel} was not in the allowed channels list!`)
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                }
                
                const embed = new EmbedBuilder()
                    .setColor('#4CAF50')
                    .setTitle('✅ Channel Removed')
                    .setDescription(`Bot commands are no longer allowed in ${channel}!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (subAction === 'list') {
                const allowedChannels = await new Promise((resolve, reject) => {
                    db.all('SELECT channel_id FROM allowed_channels WHERE guild_id = ?', 
                        [message.guild.id], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });
                
                if (allowedChannels.length === 0) {
                    const embed = new EmbedBuilder()
                        .setColor('#3498DB')
                        .setTitle('📋 Allowed Channels')
                        .setDescription('No specific channels are set. Bot commands work in **all channels**!')
                        .setFooter({ text: 'Use !admin channel add #channel to restrict commands to specific channels' })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                }
                
                let channelList = '';
                for (const row of allowedChannels) {
                    const channel = message.guild.channels.cache.get(row.channel_id);
                    if (channel) {
                        channelList += `• ${channel}\n`;
                    }
                }
                
                const embed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('📋 Allowed Channels')
                    .setDescription(`Bot commands are allowed in these channels:\n\n${channelList}`)
                    .setFooter({ text: `Total: ${allowedChannels.length} channels` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (subAction === 'reset') {
                // Remove all channel restrictions for this guild
                const result = await new Promise((resolve, reject) => {
                    db.run('DELETE FROM allowed_channels WHERE guild_id = ?', 
                        [message.guild.id], function(err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    });
                });
                
                const embed = new EmbedBuilder()
                    .setColor('#4CAF50')
                    .setTitle('✅ Channels Reset')
                    .setDescription(`Removed all channel restrictions! Bot commands now work in **all channels**.`)
                    .setFooter({ text: `Removed ${result} channel restrictions` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Invalid Channel Action')
                .setDescription('Valid actions: `add`, `remove`, `list`, `reset`')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ Invalid Action')
            .setDescription('Valid actions: `channel`')
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};