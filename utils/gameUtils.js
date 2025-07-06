const { getUser, createUser, updateUser } = require('../database/database');

async function ensureUser(userId, username) {
    let user = await getUser(userId);
    if (!user) {
        await createUser(userId, username);
        user = await getUser(userId);
    }
    return user;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function calculateLevel(experience) {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
}

function getExperienceForLevel(level) {
    return Math.pow(level - 1, 2) * 100;
}

function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function getStatEmoji(stat, value) {
    const statEmojis = {
        health: value >= 80 ? '💚' : value >= 60 ? '💛' : value >= 40 ? '🧡' : '❤️',
        happiness: value >= 80 ? '😄' : value >= 60 ? '😊' : value >= 40 ? '😐' : '😢',
        energy: value >= 80 ? '⚡' : value >= 60 ? '🔋' : value >= 40 ? '🪫' : '😴'
    };
    return statEmojis[stat] || '📊';
}

function getProgressBar(current, max, length = 10) {
    const filled = Math.round((current / max) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function isOnCooldown(lastAction, cooldownHours) {
    if (!lastAction) return false;
    const now = new Date();
    const lastActionTime = new Date(lastAction);
    const hoursSince = (now - lastActionTime) / (1000 * 60 * 60);
    return hoursSince < cooldownHours;
}

function getTimeUntilReset(lastAction, cooldownHours) {
    const now = new Date();
    const lastActionTime = new Date(lastAction);
    const nextReset = new Date(lastActionTime.getTime() + (cooldownHours * 60 * 60 * 1000));
    const msUntilReset = nextReset - now;
    
    if (msUntilReset <= 0) return 'Available now!';
    
    const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

module.exports = {
    ensureUser,
    getRandomInt,
    getRandomChoice,
    calculateLevel,
    getExperienceForLevel,
    formatMoney,
    getStatEmoji,
    getProgressBar,
    isOnCooldown,
    getTimeUntilReset
};