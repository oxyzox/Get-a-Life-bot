const { EmbedBuilder } = require('discord.js');
const { ensureUser, formatMoney, getRandomInt } = require('../utils/gameUtils');
const { updateUser } = require('../database/database');

module.exports = {
    name: 'event',
    description: 'View and participate in special events',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        // Get current date to determine active events
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        
        // Define seasonal events
        const events = {
            halloween: {
                active: month === 10 && day >= 25,
                name: '🎃 Halloween Spooktacular',
                description: 'Trick or treat for bonus rewards!',
                rewards: { min: 100, max: 500 },
                cooldown: 'daily'
            },
            christmas: {
                active: month === 12 && day >= 20,
                name: '🎄 Christmas Celebration',
                description: 'Santa\'s workshop needs helpers!',
                rewards: { min: 200, max: 800 },
                cooldown: 'daily'
            },
            newyear: {
                active: month === 1 && day <= 7,
                name: '🎊 New Year Celebration',
                description: 'Start the year with a bang!',
                rewards: { min: 500, max: 1000 },
                cooldown: 'daily'
            },
            valentine: {
                active: month === 2 && day >= 10 && day <= 16,
                name: '💝 Valentine\'s Day',
                description: 'Spread love and earn rewards!',
                rewards: { min: 150, max: 600 },
                cooldown: 'daily'
            },
            summer: {
                active: month >= 6 && month <= 8,
                name: '☀️ Summer Festival',
                description: 'Beach party activities and fun!',
                rewards: { min: 100, max: 400 },
                cooldown: 'weekly'
            }
        };
        
        // Find active events
        const activeEvents = Object.entries(events).filter(([key, event]) => event.active);
        
        if (activeEvents.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#95A5A6')
                .setTitle('📅 Special Events')
                .setDescription('No special events are currently active!\n\nCheck back during holidays and special occasions for limited-time events with exclusive rewards!')
                .addFields(
                    {
                        name: '🎃 Upcoming Events',
                        value: '• Halloween (Oct 25-31)\n• Christmas (Dec 20-31)\n• New Year (Jan 1-7)\n• Valentine\'s Day (Feb 10-16)\n• Summer Festival (Jun-Aug)',
                        inline: false
                    }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (args.length === 0) {
            // Show active events
            const embed = new EmbedBuilder()
                .setColor('#FF9500')
                .setTitle('🎉 Active Special Events')
                .setDescription('Special events are currently running! Use `!event participate` to join the fun!')
                .setTimestamp();
            
            let eventsList = '';
            activeEvents.forEach(([key, event]) => {
                eventsList += `**${event.name}**\n`;
                eventsList += `${event.description}\n`;
                eventsList += `💰 Rewards: ${formatMoney(event.rewards.min)} - ${formatMoney(event.rewards.max)}\n`;
                eventsList += `⏰ Cooldown: ${event.cooldown}\n\n`;
            });
            
            embed.setDescription(embed.data.description + '\n\n' + eventsList);
            
            return message.reply({ embeds: [embed] });
        }
        
        if (args[0].toLowerCase() === 'participate') {
            if (activeEvents.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ No Active Events')
                    .setDescription('There are no events to participate in right now!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // For simplicity, participate in the first active event
            const [eventKey, event] = activeEvents[0];
            
            // Check cooldown (simplified - using last_daily for daily events)
            const lastParticipation = user.last_daily;
            const today = new Date().toISOString().split('T')[0];
            const lastParticipationDate = lastParticipation ? new Date(lastParticipation).toISOString().split('T')[0] : null;
            
            if (event.cooldown === 'daily' && lastParticipationDate === today) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('⏰ Event Cooldown')
                    .setDescription('You\'ve already participated in today\'s event! Come back tomorrow.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Generate random reward
            const reward = getRandomInt(event.rewards.min, event.rewards.max);
            
            // Update user
            await updateUser(user.id, {
                balance: user.balance + reward,
                last_daily: new Date().toISOString()
            });
            
            // Event-specific activities
            const activities = {
                halloween: [
                    'You went trick-or-treating and got candy!',
                    'You carved a spooky pumpkin!',
                    'You scared some kids and got treats!',
                    'You found a haunted treasure chest!'
                ],
                christmas: [
                    'You helped Santa wrap presents!',
                    'You fed the reindeer!',
                    'You sang Christmas carols!',
                    'You found a gift under the tree!'
                ],
                newyear: [
                    'You watched the fireworks!',
                    'You made a resolution and got motivated!',
                    'You celebrated with friends!',
                    'You found a lucky coin!'
                ],
                valentine: [
                    'You spread love and kindness!',
                    'You helped Cupid with deliveries!',
                    'You wrote love letters!',
                    'You found a heart-shaped treasure!'
                ],
                summer: [
                    'You built an amazing sandcastle!',
                    'You won a beach volleyball game!',
                    'You found seashells on the shore!',
                    'You enjoyed a perfect sunset!'
                ]
            };
            
            const activity = activities[eventKey] ? 
                activities[eventKey][getRandomInt(0, activities[eventKey].length - 1)] :
                'You participated in the special event!';
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle(`✨ ${event.name}`)
                .setDescription(`${activity}\n\n🎉 **Event Reward:** ${formatMoney(reward)}`)
                .addFields(
                    {
                        name: '💰 New Balance',
                        value: formatMoney(user.balance + reward),
                        inline: true
                    },
                    {
                        name: '⏰ Next Participation',
                        value: event.cooldown === 'daily' ? 'Tomorrow' : 'Next week',
                        inline: true
                    }
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ Invalid Usage')
            .setDescription('Use `!event` to view events or `!event participate` to join!')
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};