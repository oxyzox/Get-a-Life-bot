const { EmbedBuilder } = require('discord.js');
const { ensureUser, getRandomInt, formatMoney, isOnCooldown, getTimeUntilReset } = require('../utils/gameUtils');
const { updateUser } = require('../database/database');

module.exports = {
    name: 'gamble',
    description: 'Try your luck with various gambling games',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        if (args.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🎰 Casino Games')
                .setDescription('Welcome to the casino! Choose your game and bet amount.')
                .addFields(
                    {
                        name: '🎰 Slot Machine',
                        value: '`!gamble slots <amount>` - Classic slot machine (2x payout)',
                        inline: false
                    },
                    {
                        name: '🎲 Dice Roll',
                        value: '`!gamble dice <amount>` - Roll higher than 50 (1.8x payout)',
                        inline: false
                    },
                    {
                        name: '🃏 Blackjack',
                        value: '`!gamble blackjack <amount>` - Get as close to 21 as possible (2x payout)',
                        inline: false
                    },
                    {
                        name: '🎯 High/Low',
                        value: '`!gamble highlow <amount>` - Guess if next number is higher or lower (1.5x payout)',
                        inline: false
                    },
                    {
                        name: '💎 Jackpot',
                        value: '`!gamble jackpot <amount>` - 1% chance to win 50x your bet!',
                        inline: false
                    }
                )
                .setFooter({ text: `Your balance: ${formatMoney(user.balance)} | Gamble responsibly!` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Check gambling cooldown (5 minutes)
        if (isOnCooldown(user.last_gamble, 0.083)) { // 5 minutes = 0.083 hours
            const timeLeft = getTimeUntilReset(user.last_gamble, 0.083);
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('⏰ Gambling Cooldown')
                .setDescription(`Slow down there, high roller! You need to wait before gambling again.\n**Time until available:** ${timeLeft}`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const game = args[0]?.toLowerCase();
        const betAmount = parseInt(args[1]);
        
        if (!betAmount || betAmount <= 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Invalid Bet')
                .setDescription('Please enter a valid bet amount!\n**Usage:** `!gamble <game> <amount>`')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (betAmount > user.balance) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('💸 Insufficient Funds')
                .setDescription(`You don't have enough money to bet ${formatMoney(betAmount)}!\n**Your balance:** ${formatMoney(user.balance)}`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const minBet = 10;
        const maxBet = Math.min(10000, user.balance);
        
        if (betAmount < minBet) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Bet Too Low')
                .setDescription(`Minimum bet is ${formatMoney(minBet)}!`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (betAmount > maxBet) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Bet Too High')
                .setDescription(`Maximum bet is ${formatMoney(maxBet)}!`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        let won = false;
        let winnings = 0;
        let gameResult = '';
        let multiplier = 0;
        
        switch (game) {
            case 'slots':
                const slots = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
                const reel1 = slots[getRandomInt(0, slots.length - 1)];
                const reel2 = slots[getRandomInt(0, slots.length - 1)];
                const reel3 = slots[getRandomInt(0, slots.length - 1)];
                
                gameResult = `🎰 **SLOT MACHINE** 🎰\n\n[ ${reel1} | ${reel2} | ${reel3} ]\n\n`;
                
                if (reel1 === reel2 && reel2 === reel3) {
                    if (reel1 === '💎') {
                        multiplier = 10;
                        gameResult += '💎 **DIAMOND JACKPOT!** 💎';
                    } else if (reel1 === '7️⃣') {
                        multiplier = 5;
                        gameResult += '7️⃣ **LUCKY SEVENS!** 7️⃣';
                    } else {
                        multiplier = 2;
                        gameResult += '🎉 **THREE OF A KIND!** 🎉';
                    }
                    won = true;
                } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
                    multiplier = 0.5;
                    gameResult += '😊 **TWO OF A KIND!** 😊';
                    won = true;
                } else {
                    gameResult += '😢 **NO MATCH** 😢';
                }
                break;
                
            case 'dice':
                const diceRoll = getRandomInt(1, 100);
                gameResult = `🎲 **DICE ROLL** 🎲\n\nYou rolled: **${diceRoll}**\n\n`;
                
                if (diceRoll > 50) {
                    multiplier = 1.8;
                    won = true;
                    gameResult += `🎉 **YOU WIN!** (Rolled above 50)`;
                } else {
                    gameResult += `😢 **YOU LOSE!** (Need above 50)`;
                }
                break;
                
            case 'blackjack':
                const playerCard1 = getRandomInt(1, 11);
                const playerCard2 = getRandomInt(1, 11);
                const dealerCard1 = getRandomInt(1, 11);
                const dealerCard2 = getRandomInt(1, 11);
                
                const playerTotal = playerCard1 + playerCard2;
                const dealerTotal = dealerCard1 + dealerCard2;
                
                gameResult = `🃏 **BLACKJACK** 🃏\n\n`;
                gameResult += `**Your cards:** ${playerCard1} + ${playerCard2} = **${playerTotal}**\n`;
                gameResult += `**Dealer cards:** ${dealerCard1} + ${dealerCard2} = **${dealerTotal}**\n\n`;
                
                if (playerTotal > 21) {
                    gameResult += '💥 **BUST!** You went over 21!';
                } else if (dealerTotal > 21) {
                    multiplier = 2;
                    won = true;
                    gameResult += '🎉 **DEALER BUST!** You win!';
                } else if (playerTotal === 21) {
                    multiplier = 2.5;
                    won = true;
                    gameResult += '🎯 **BLACKJACK!** Perfect 21!';
                } else if (playerTotal > dealerTotal) {
                    multiplier = 2;
                    won = true;
                    gameResult += '🎉 **YOU WIN!** Higher than dealer!';
                } else if (playerTotal === dealerTotal) {
                    multiplier = 1;
                    won = true;
                    gameResult += '🤝 **PUSH!** It\'s a tie!';
                } else {
                    gameResult += '😢 **DEALER WINS!** Higher than you!';
                }
                break;
                
            case 'highlow':
                const currentNumber = getRandomInt(1, 100);
                const nextNumber = getRandomInt(1, 100);
                const guess = getRandomInt(0, 1) ? 'higher' : 'lower';
                
                gameResult = `🎯 **HIGH/LOW** 🎯\n\n`;
                gameResult += `Current number: **${currentNumber}**\n`;
                gameResult += `Your guess: **${guess}**\n`;
                gameResult += `Next number: **${nextNumber}**\n\n`;
                
                const correct = (guess === 'higher' && nextNumber > currentNumber) || 
                               (guess === 'lower' && nextNumber < currentNumber);
                
                if (correct) {
                    multiplier = 1.5;
                    won = true;
                    gameResult += '🎉 **CORRECT GUESS!** You win!';
                } else {
                    gameResult += '😢 **WRONG GUESS!** Better luck next time!';
                }
                break;
                
            case 'jackpot':
                const jackpotRoll = getRandomInt(1, 100);
                gameResult = `💎 **JACKPOT** 💎\n\n`;
                gameResult += `Lucky number: **${jackpotRoll}**\n\n`;
                
                if (jackpotRoll === 1) {
                    multiplier = 50;
                    won = true;
                    gameResult += '🎰 **MEGA JACKPOT!** 🎰\nYou hit the 1% chance!';
                } else {
                    gameResult += '😢 **NO JACKPOT** 😢\nNeed to roll exactly 1!';
                }
                break;
                
            default:
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Invalid Game')
                    .setDescription('Available games: `slots`, `dice`, `blackjack`, `highlow`, `jackpot`')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
        }
        
        // Calculate winnings
        if (won) {
            winnings = Math.floor(betAmount * multiplier);
        }
        
        const newBalance = user.balance - betAmount + winnings;
        const netGain = winnings - betAmount;
        
        // Update user
        await updateUser(user.id, {
            balance: newBalance,
            last_gamble: new Date().toISOString()
        });
        
        // Create result embed
        const embed = new EmbedBuilder()
            .setColor(won ? '#4CAF50' : '#FF6B6B')
            .setTitle(won ? '🎉 You Won!' : '😢 You Lost!')
            .setDescription(gameResult)
            .addFields(
                {
                    name: '💰 Bet Amount',
                    value: formatMoney(betAmount),
                    inline: true
                },
                {
                    name: won ? '🎁 Winnings' : '💸 Lost',
                    value: won ? formatMoney(winnings) : formatMoney(betAmount),
                    inline: true
                },
                {
                    name: '📊 Net Result',
                    value: `${netGain >= 0 ? '+' : ''}${formatMoney(netGain)}`,
                    inline: true
                },
                {
                    name: '💳 New Balance',
                    value: formatMoney(newBalance),
                    inline: false
                }
            )
            .setFooter({ text: 'Come back in 5 minutes to gamble again!' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};