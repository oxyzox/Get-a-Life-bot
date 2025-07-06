const { EmbedBuilder } = require('discord.js');
const { ensureUser, getRandomInt, formatMoney } = require('../utils/gameUtils');
const { updateUser, db } = require('../database/database');

module.exports = {
    name: 'duel',
    description: 'Challenge another user to a duel',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ No Opponent')
                .setDescription('Please mention a user to duel!\n**Usage:** `!duel @user [bet_amount]`')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (targetUser.id === message.author.id) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Cannot Duel Yourself')
                .setDescription('You cannot challenge yourself to a duel!')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (targetUser.bot) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Cannot Duel Bots')
                .setDescription('You cannot challenge bots to duels!')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Ensure target user exists
        const opponent = await ensureUser(targetUser.id, targetUser.username);
        
        // Parse bet amount
        let betAmount = 0;
        if (args[0] && !isNaN(args[0])) {
            betAmount = parseInt(args[0]);
            
            if (betAmount < 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Invalid Bet')
                    .setDescription('Bet amount must be positive!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (betAmount > user.balance) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Insufficient Funds')
                    .setDescription(`You don't have enough money to bet ${formatMoney(betAmount)}!\n**Your balance:** ${formatMoney(user.balance)}`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (betAmount > opponent.balance) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Opponent Cannot Afford')
                    .setDescription(`${targetUser.username} doesn't have enough money to match your bet of ${formatMoney(betAmount)}!\n**Their balance:** ${formatMoney(opponent.balance)}`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
        }
        
        // Calculate duel stats based on user stats
        const challengerPower = Math.floor((user.health + user.happiness + user.energy) / 3) + getRandomInt(-20, 20);
        const opponentPower = Math.floor((opponent.health + opponent.happiness + opponent.energy) / 3) + getRandomInt(-20, 20);
        
        // Determine winner
        const challengerWins = challengerPower > opponentPower;
        const winner = challengerWins ? user : opponent;
        const loser = challengerWins ? opponent : user;
        const winnerUser = challengerWins ? message.author : targetUser;
        const loserUser = challengerWins ? targetUser : message.author;
        
        // Create duel scenarios
        const duelScenarios = [
            'engaged in an epic sword fight',
            'had a battle of wits',
            'competed in a strength contest',
            'faced off in a dance battle',
            'had a cooking competition',
            'raced against each other',
            'played a game of chess',
            'had a staring contest',
            'competed in trivia',
            'arm wrestled'
        ];
        
        const scenario = duelScenarios[getRandomInt(0, duelScenarios.length - 1)];
        
        // Update balances if there was a bet
        if (betAmount > 0) {
            await updateUser(winner.id, { balance: winner.balance + betAmount });
            await updateUser(loser.id, { balance: loser.balance - betAmount });
        }
        
        // Record duel in history
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO duel_history (challenger_id, opponent_id, winner_id, bet_amount) VALUES (?, ?, ?, ?)',
                [user.id, opponent.id, winner.id, betAmount], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Create result embed
        const embed = new EmbedBuilder()
            .setColor(challengerWins ? '#4CAF50' : '#FF6B6B')
            .setTitle('⚔️ Duel Results!')
            .setDescription(`${message.author.username} and ${targetUser.username} ${scenario}!`)
            .addFields(
                {
                    name: '👤 Challenger',
                    value: `**${message.author.username}**\nPower: ${challengerPower}`,
                    inline: true
                },
                {
                    name: '👤 Opponent',
                    value: `**${targetUser.username}**\nPower: ${opponentPower}`,
                    inline: true
                },
                {
                    name: '🏆 Winner',
                    value: `**${winnerUser.username}** wins!`,
                    inline: true
                }
            )
            .setTimestamp();
        
        if (betAmount > 0) {
            embed.addFields(
                {
                    name: '💰 Bet Results',
                    value: `**${winnerUser.username}** wins ${formatMoney(betAmount)}!\n**${loserUser.username}** loses ${formatMoney(betAmount)}`,
                    inline: false
                },
                {
                    name: '💳 New Balances',
                    value: `**${message.author.username}:** ${formatMoney(challengerWins ? user.balance + betAmount : user.balance - betAmount)}\n**${targetUser.username}:** ${formatMoney(challengerWins ? opponent.balance - betAmount : opponent.balance + betAmount)}`,
                    inline: false
                }
            );
        } else {
            embed.addFields({
                name: '🎮 Friendly Duel',
                value: 'No money was wagered in this duel!',
                inline: false
            });
        }
        
        // Add some flavor text based on the power difference
        const powerDiff = Math.abs(challengerPower - opponentPower);
        let flavorText = '';
        
        if (powerDiff <= 5) {
            flavorText = 'It was an incredibly close match!';
        } else if (powerDiff <= 15) {
            flavorText = 'A well-fought battle!';
        } else if (powerDiff <= 25) {
            flavorText = 'A decisive victory!';
        } else {
            flavorText = 'A completely one-sided battle!';
        }
        
        embed.setFooter({ text: flavorText });
        
        message.reply({ embeds: [embed] });
    }
};