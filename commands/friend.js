const { EmbedBuilder } = require('discord.js');
const { ensureUser } = require('../utils/gameUtils');
const { db } = require('../database/database');

module.exports = {
    name: 'friend',
    description: 'Manage your friends list and social connections',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        if (args.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Invalid Usage')
                .setDescription('**Friend Commands:**\n`!friend add @user` - Send friend request\n`!friend list` - View your friends\n`!friend accept @user` - Accept friend request\n`!friend remove @user` - Remove friend')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const action = args[0].toLowerCase();
        
        if (action === 'add') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No User Mentioned')
                    .setDescription('Please mention a user to send a friend request!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (targetUser.id === message.author.id) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Cannot Add Yourself')
                    .setDescription('You cannot send a friend request to yourself!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Ensure target user exists
            await ensureUser(targetUser.id, targetUser.username);
            
            // Check if friendship already exists
            const existingFriendship = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', 
                    [user.id, targetUser.id, targetUser.id, user.id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (existingFriendship) {
                const status = existingFriendship.status === 'accepted' ? 'already friends' : 'request pending';
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Friendship Exists')
                    .setDescription(`You are ${status} with ${targetUser.username}!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Send friend request
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)', 
                    [user.id, targetUser.id, 'pending'], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('✅ Friend Request Sent!')
                .setDescription(`Friend request sent to **${targetUser.username}**!\nThey can accept it with \`!friend accept @${message.author.username}\``)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'accept') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No User Mentioned')
                    .setDescription('Please mention the user whose request you want to accept!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Find pending friend request
            const friendRequest = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?', 
                    [targetUser.id, user.id, 'pending'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!friendRequest) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No Friend Request')
                    .setDescription(`No pending friend request from **${targetUser.username}**!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Accept friend request
            await new Promise((resolve, reject) => {
                db.run('UPDATE friends SET status = ? WHERE id = ?', 
                    ['accepted', friendRequest.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('🎉 Friend Request Accepted!')
                .setDescription(`You are now friends with **${targetUser.username}**!`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'list') {
            const friends = await new Promise((resolve, reject) => {
                db.all(`SELECT u.username, f.status, f.created_at 
                        FROM friends f 
                        JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id) 
                        WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?`, 
                    [user.id, user.id, user.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            if (friends.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('👥 Your Friends')
                    .setDescription('You have no friends yet! Use `!friend add @user` to send friend requests.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const acceptedFriends = friends.filter(f => f.status === 'accepted');
            const pendingFriends = friends.filter(f => f.status === 'pending');
            
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('👥 Your Friends')
                .setTimestamp();
            
            let description = '';
            
            if (acceptedFriends.length > 0) {
                description += '**✅ Friends:**\n';
                acceptedFriends.forEach(friend => {
                    description += `• ${friend.username}\n`;
                });
                description += '\n';
            }
            
            if (pendingFriends.length > 0) {
                description += '**⏳ Pending Requests:**\n';
                pendingFriends.forEach(friend => {
                    description += `• ${friend.username}\n`;
                });
            }
            
            embed.setDescription(description);
            embed.setFooter({ text: `Total: ${acceptedFriends.length} friends, ${pendingFriends.length} pending` });
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'remove') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No User Mentioned')
                    .setDescription('Please mention the user you want to remove!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Remove friendship
            const result = await new Promise((resolve, reject) => {
                db.run('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', 
                    [user.id, targetUser.id, targetUser.id, user.id], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
            
            if (result === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Not Friends')
                    .setDescription(`You are not friends with **${targetUser.username}**!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('✅ Friend Removed')
                .setDescription(`Removed **${targetUser.username}** from your friends list.`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ Invalid Action')
            .setDescription('Valid actions: `add`, `accept`, `list`, `remove`')
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};