const { EmbedBuilder } = require('discord.js');
const { ensureUser, formatMoney, calculateLevel } = require('../utils/gameUtils');
const { updateUser, db } = require('../database/database');

module.exports = {
    name: 'relationship',
    description: 'Manage real player relationships',
    aliases: ['rel'],
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        if (args.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF1493')
                .setTitle('💕 Real Player Relationships')
                .setDescription('Connect with other real players and build meaningful relationships!')
                .addFields(
                    {
                        name: '💌 Send Requests',
                        value: '`!relationship request @user gf` - Send girlfriend request\n`!relationship request @user bf` - Send boyfriend request',
                        inline: true
                    },
                    {
                        name: '📨 Manage Requests',
                        value: '`!relationship accept @user` - Accept a request\n`!relationship decline @user` - Decline a request\n`!relationship pending` - View pending requests',
                        inline: true
                    },
                    {
                        name: '💬 Communication',
                        value: '`!relationship msg <message>` - Send message to partner\n`!relationship profile` - View relationship status\n`!relationship breakup` - End relationship',
                        inline: false
                    },
                    {
                        name: '💍 Marriage',
                        value: '`!relationship propose` - Propose marriage (Level 25+ & $50,000)\n`!relationship marry` - Accept marriage proposal',
                        inline: false
                    }
                )
                .setFooter({ text: 'Build real connections with other players!' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const action = args[0]?.toLowerCase();
        
        if (action === 'request') {
            const targetUser = message.mentions.users.first();
            const relationshipType = args[2]?.toLowerCase();
            
            if (!targetUser) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No User Mentioned')
                    .setDescription('Please mention a user to send a relationship request to!\n**Usage:** `!relationship request @user gf/bf`')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (targetUser.id === message.author.id) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Cannot Date Yourself')
                    .setDescription('You cannot send a relationship request to yourself!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (targetUser.bot) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Cannot Date Bots')
                    .setDescription('You cannot send relationship requests to bots!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (!relationshipType || !['gf', 'bf', 'girlfriend', 'boyfriend'].includes(relationshipType)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Invalid Relationship Type')
                    .setDescription('Please specify relationship type: `gf` or `bf`\n**Usage:** `!relationship request @user gf/bf`')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Ensure target user exists
            await ensureUser(targetUser.id, targetUser.username);
            
            // Check if requester already has a relationship
            const existingRelationship = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM real_relationships WHERE (requester_id = ? OR target_id = ?) AND status IN (?, ?)', 
                    [user.id, user.id, 'accepted', 'married'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (existingRelationship) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Already in Relationship')
                    .setDescription('You\'re already in a relationship! You can only have one partner at a time.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Check if target already has a relationship
            const targetRelationship = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM real_relationships WHERE (requester_id = ? OR target_id = ?) AND status IN (?, ?)', 
                    [targetUser.id, targetUser.id, 'accepted', 'married'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (targetRelationship) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Target Already in Relationship')
                    .setDescription(`${targetUser.username} is already in a relationship!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Check for existing pending request
            const pendingRequest = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM real_relationships WHERE ((requester_id = ? AND target_id = ?) OR (requester_id = ? AND target_id = ?)) AND status = ?', 
                    [user.id, targetUser.id, targetUser.id, user.id, 'pending'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (pendingRequest) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Request Already Exists')
                    .setDescription('There\'s already a pending relationship request between you two!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Normalize relationship type
            const normalizedType = relationshipType === 'gf' || relationshipType === 'girlfriend' ? 'girlfriend' : 'boyfriend';
            
            // Create relationship request
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO real_relationships (requester_id, target_id, relationship_type, status) VALUES (?, ?, ?, ?)', 
                    [user.id, targetUser.id, normalizedType, 'pending'], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            const embed = new EmbedBuilder()
                .setColor('#FF1493')
                .setTitle('💌 Relationship Request Sent!')
                .setDescription(`You sent a ${normalizedType} request to **${targetUser.username}**!`)
                .addFields(
                    {
                        name: '💕 What happens next?',
                        value: `${targetUser.username} can accept with \`!relationship accept @${message.author.username}\``,
                        inline: false
                    }
                )
                .setTimestamp();
            
            // Try to notify the target user
            try {
                const notificationEmbed = new EmbedBuilder()
                    .setColor('#FF1493')
                    .setTitle('💌 New Relationship Request!')
                    .setDescription(`**${message.author.username}** wants to be your ${normalizedType}!`)
                    .addFields(
                        {
                            name: '💕 How to respond',
                            value: `Accept: \`!relationship accept @${message.author.username}\`\nDecline: \`!relationship decline @${message.author.username}\``,
                            inline: false
                        }
                    )
                    .setTimestamp();
                
                await targetUser.send({ embeds: [notificationEmbed] });
                embed.setFooter({ text: `${targetUser.username} has been notified!` });
            } catch (error) {
                embed.setFooter({ text: 'Could not send DM notification' });
            }
            
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
            
            // Find pending request
            const pendingRequest = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM real_relationships WHERE requester_id = ? AND target_id = ? AND status = ?', 
                    [targetUser.id, user.id, 'pending'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!pendingRequest) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No Pending Request')
                    .setDescription(`No pending relationship request from **${targetUser.username}**!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Accept the request
            await new Promise((resolve, reject) => {
                db.run('UPDATE real_relationships SET status = ?, last_interaction = ? WHERE id = ?', 
                    ['accepted', new Date().toISOString(), pendingRequest.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('💕 Relationship Accepted!')
                .setDescription(`You're now in a relationship with **${targetUser.username}**!`)
                .addFields(
                    {
                        name: '💬 Start Communicating',
                        value: 'Use `!relationship msg <message>` to send messages to each other!',
                        inline: false
                    }
                )
                .setTimestamp();
            
            // Notify the requester
            try {
                const notificationEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🎉 Relationship Accepted!')
                    .setDescription(`**${message.author.username}** accepted your relationship request!`)
                    .setTimestamp();
                
                await targetUser.send({ embeds: [notificationEmbed] });
            } catch (error) {
                // If we can't DM, that's okay
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'decline') {
            const targetUser = message.mentions.users.first();
            
            if (!targetUser) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No User Mentioned')
                    .setDescription('Please mention the user whose request you want to decline!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Find and delete pending request
            const result = await new Promise((resolve, reject) => {
                db.run('DELETE FROM real_relationships WHERE requester_id = ? AND target_id = ? AND status = ?', 
                    [targetUser.id, user.id, 'pending'], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
            
            if (result === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No Pending Request')
                    .setDescription(`No pending relationship request from **${targetUser.username}**!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#95A5A6')
                .setTitle('💔 Request Declined')
                .setDescription(`You declined the relationship request from **${targetUser.username}**.`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'pending') {
            // Get pending requests sent to user
            const incomingRequests = await new Promise((resolve, reject) => {
                db.all(`SELECT rr.*, u.username as requester_username 
                        FROM real_relationships rr 
                        JOIN users u ON rr.requester_id = u.id 
                        WHERE rr.target_id = ? AND rr.status = ?`, 
                    [user.id, 'pending'], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            // Get pending requests sent by user
            const outgoingRequests = await new Promise((resolve, reject) => {
                db.all(`SELECT rr.*, u.username as target_username 
                        FROM real_relationships rr 
                        JOIN users u ON rr.target_id = u.id 
                        WHERE rr.requester_id = ? AND rr.status = ?`, 
                    [user.id, 'pending'], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('📨 Pending Relationship Requests')
                .setTimestamp();
            
            let description = '';
            
            if (incomingRequests.length > 0) {
                description += '**📥 Incoming Requests:**\n';
                incomingRequests.forEach(req => {
                    description += `• **${req.requester_username}** wants to be your ${req.relationship_type}\n`;
                });
                description += '\n';
            }
            
            if (outgoingRequests.length > 0) {
                description += '**📤 Outgoing Requests:**\n';
                outgoingRequests.forEach(req => {
                    description += `• Waiting for **${req.target_username}** to respond to your ${req.relationship_type} request\n`;
                });
                description += '\n';
            }
            
            if (incomingRequests.length === 0 && outgoingRequests.length === 0) {
                description = 'No pending relationship requests!';
            }
            
            embed.setDescription(description);
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'profile') {
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
                    .setColor('#95A5A6')
                    .setTitle('💔 Single')
                    .setDescription('You\'re not currently in a relationship!\nUse `!relationship request @user gf/bf` to send a relationship request.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const statusEmoji = relationship.status === 'married' ? '💍' : '💕';
            const statusText = relationship.status === 'married' ? 'Married' : 'In a Relationship';
            
            const embed = new EmbedBuilder()
                .setColor('#FF1493')
                .setTitle(`${statusEmoji} ${statusText}`)
                .setDescription(`You're ${relationship.status === 'married' ? 'married to' : 'dating'} **${relationship.partner_username}**!`)
                .addFields(
                    {
                        name: '💖 Love Level',
                        value: `${relationship.love}/100`,
                        inline: true
                    },
                    {
                        name: '😊 Happiness',
                        value: `${relationship.happiness}/100`,
                        inline: true
                    },
                    {
                        name: '📅 Relationship Started',
                        value: new Date(relationship.created_at).toLocaleDateString(),
                        inline: true
                    }
                )
                .setFooter({ text: 'Use !relationship msg to send messages!' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'msg' || action === 'message') {
            if (!args[1]) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No Message')
                    .setDescription('Please provide a message to send!\n**Usage:** `!relationship msg <your message>`')
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
                    .setDescription('You\'re not in a relationship! Send a relationship request first.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const messageText = args.slice(1).join(' ');
            
            // Store the message
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
                .setTitle('💌 Message Sent!')
                .setDescription(`Your message was delivered to **${relationship.partner_username}**! 💕`)
                .addFields(
                    {
                        name: '💖 Love Effect',
                        value: `+${loveIncrease} Love (${newLove}/100)`,
                        inline: true
                    },
                    {
                        name: '📱 Status',
                        value: 'Message delivered privately',
                        inline: true
                    }
                )
                .setTimestamp();
            
            // Try to send the message to the partner
            try {
                const partner = await message.client.users.fetch(relationship.partner_id);
                const partnerEmbed = new EmbedBuilder()
                    .setColor('#FF1493')
                    .setTitle('💌 Message from Your Partner!')
                    .setDescription(`**${message.author.username}** sent you a message:`)
                    .addFields(
                        {
                            name: '💬 Message',
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
        
        if (action === 'propose') {
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
                        WHERE (rr.requester_id = ? OR rr.target_id = ?) AND rr.status = ?`, 
                    [user.id, user.id, user.id, user.id, 'accepted'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!relationship) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No Relationship')
                    .setDescription('You need to be in an accepted relationship to propose marriage!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const userLevel = calculateLevel(user.experience);
            const requiredLevel = 25;
            const requiredMoney = 50000;
            
            if (userLevel < requiredLevel) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Level Too Low')
                    .setDescription(`You need to be level ${requiredLevel} to propose marriage!\n**Your level:** ${userLevel}`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (user.balance < requiredMoney) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Insufficient Funds')
                    .setDescription(`You need ${formatMoney(requiredMoney)} to buy an engagement ring!\n**Your balance:** ${formatMoney(user.balance)}`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (relationship.love < 80) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Not Enough Love')
                    .setDescription(`Your relationship needs at least 80 love to propose marriage!\n**Current love:** ${relationship.love}/100`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Check for existing proposal
            const existingProposal = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM marriage_proposals WHERE ((proposer_id = ? AND target_id = ?) OR (proposer_id = ? AND target_id = ?)) AND status = ?', 
                    [user.id, relationship.partner_id, relationship.partner_id, user.id, 'pending'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (existingProposal) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Proposal Already Exists')
                    .setDescription('There\'s already a pending marriage proposal between you two!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Create marriage proposal
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO marriage_proposals (proposer_id, target_id) VALUES (?, ?)', 
                    [user.id, relationship.partner_id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // Deduct money for ring
            await updateUser(user.id, { balance: user.balance - requiredMoney });
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('💍 Marriage Proposal!')
                .setDescription(`You proposed to **${relationship.partner_username}**! 💍`)
                .addFields(
                    {
                        name: '💎 Ring Cost',
                        value: formatMoney(requiredMoney),
                        inline: true
                    },
                    {
                        name: '💕 What\'s Next?',
                        value: `${relationship.partner_username} can accept with \`!relationship marry\``,
                        inline: false
                    }
                )
                .setTimestamp();
            
            // Notify partner
            try {
                const partner = await message.client.users.fetch(relationship.partner_id);
                const proposalEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('💍 Marriage Proposal!')
                    .setDescription(`**${message.author.username}** proposed to you! 💍`)
                    .addFields(
                        {
                            name: '💕 Will you marry them?',
                            value: 'Accept: `!relationship marry`\nDecline: `!relationship decline-proposal`',
                            inline: false
                        }
                    )
                    .setTimestamp();
                
                await partner.send({ embeds: [proposalEmbed] });
                embed.setFooter({ text: `${relationship.partner_username} has been notified!` });
            } catch (error) {
                embed.setFooter({ text: 'Could not send DM notification' });
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'marry') {
            // Check for pending proposal
            const proposal = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM marriage_proposals WHERE target_id = ? AND status = ?', 
                    [user.id, 'pending'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!proposal) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No Proposal')
                    .setDescription('You don\'t have any pending marriage proposals!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Get relationship
            const relationship = await new Promise((resolve, reject) => {
                db.get(`SELECT rr.*, u.username as proposer_username
                        FROM real_relationships rr 
                        JOIN users u ON rr.requester_id = u.id OR rr.target_id = u.id
                        WHERE ((rr.requester_id = ? AND rr.target_id = ?) OR (rr.requester_id = ? AND rr.target_id = ?)) AND rr.status = ? AND u.id = ?`, 
                    [proposal.proposer_id, user.id, user.id, proposal.proposer_id, 'accepted', proposal.proposer_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            // Accept proposal and update relationship to married
            await new Promise((resolve, reject) => {
                db.run('UPDATE marriage_proposals SET status = ? WHERE id = ?', 
                    ['accepted', proposal.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            await new Promise((resolve, reject) => {
                db.run('UPDATE real_relationships SET status = ? WHERE id = ?', 
                    ['married', relationship.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('💍 Congratulations!')
                .setDescription(`You're now married to **${relationship.proposer_username}**! 🎉`)
                .addFields(
                    {
                        name: '💕 Marriage Benefits',
                        value: '• Increased love gain from messages\n• Special married status\n• Exclusive married couple features',
                        inline: false
                    }
                )
                .setTimestamp();
            
            // Notify partner
            try {
                const partner = await message.client.users.fetch(proposal.proposer_id);
                const marriageEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🎉 They Said Yes!')
                    .setDescription(`**${message.author.username}** accepted your proposal! You're now married! 💍`)
                    .setTimestamp();
                
                await partner.send({ embeds: [marriageEmbed] });
            } catch (error) {
                // If we can't DM, that's okay
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'breakup') {
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
                    .setDescription('You\'re not in a relationship!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('💔 Confirm Breakup')
                .setDescription(`Are you sure you want to ${relationship.status === 'married' ? 'divorce' : 'break up with'} **${relationship.partner_username}**? This action cannot be undone!\n\nReply with "yes" to confirm or "no" to cancel.`)
                .setTimestamp();
            
            const confirmMessage = await message.reply({ embeds: [embed] });
            
            const filter = (response) => {
                return response.author.id === message.author.id && 
                       ['yes', 'no'].includes(response.content.toLowerCase());
            };
            
            try {
                const collected = await message.channel.awaitMessages({ 
                    filter, 
                    max: 1, 
                    time: 30000, 
                    errors: ['time'] 
                });
                
                const response = collected.first();
                
                if (response.content.toLowerCase() === 'yes') {
                    // Delete relationship and related data
                    await new Promise((resolve, reject) => {
                        db.run('DELETE FROM real_relationships WHERE id = ?', [relationship.id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    await new Promise((resolve, reject) => {
                        db.run('DELETE FROM relationship_messages WHERE relationship_id = ?', [relationship.id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    await new Promise((resolve, reject) => {
                        db.run('DELETE FROM marriage_proposals WHERE (proposer_id = ? AND target_id = ?) OR (proposer_id = ? AND target_id = ?)', 
                            [user.id, relationship.partner_id, relationship.partner_id, user.id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    
                    const breakupEmbed = new EmbedBuilder()
                        .setColor('#95A5A6')
                        .setTitle('💔 Relationship Ended')
                        .setDescription(`You ${relationship.status === 'married' ? 'divorced' : 'broke up with'} **${relationship.partner_username}**. You're now single again.`)
                        .setTimestamp();
                    
                    // Notify partner
                    try {
                        const partner = await message.client.users.fetch(relationship.partner_id);
                        const notificationEmbed = new EmbedBuilder()
                            .setColor('#95A5A6')
                            .setTitle('💔 Relationship Ended')
                            .setDescription(`**${message.author.username}** ${relationship.status === 'married' ? 'divorced you' : 'broke up with you'}.`)
                            .setTimestamp();
                        
                        await partner.send({ embeds: [notificationEmbed] });
                    } catch (error) {
                        // If we can't DM, that's okay
                    }
                    
                    return message.reply({ embeds: [breakupEmbed] });
                } else {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#4CAF50')
                        .setTitle('💕 Breakup Cancelled')
                        .setDescription(`You decided to stay with **${relationship.partner_username}**. Love conquers all!`)
                        .setTimestamp();
                    
                    return message.reply({ embeds: [cancelEmbed] });
                }
            } catch (error) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('⏰ Confirmation Timeout')
                    .setDescription('Breakup confirmation timed out. No action taken.')
                    .setTimestamp();
                
                return message.reply({ embeds: [timeoutEmbed] });
            }
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ Invalid Action')
            .setDescription('Valid actions: `request`, `accept`, `decline`, `pending`, `profile`, `msg`, `propose`, `marry`, `breakup`')
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};