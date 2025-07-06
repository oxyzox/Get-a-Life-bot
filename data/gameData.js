const jobs = {
    unemployed: { name: 'Unemployed', salary: 0, description: 'Looking for work...' },
    cashier: { name: 'Cashier', salary: 50, description: 'Scanning items and handling payments', requirement: 0 },
    waiter: { name: 'Waiter', salary: 75, description: 'Serving customers and taking orders', requirement: 0 },
    cook: { name: 'Cook', salary: 100, description: 'Preparing delicious meals', requirement: 5 },
    mechanic: { name: 'Mechanic', salary: 150, description: 'Fixing cars and machinery', requirement: 10 },
    teacher: { name: 'Teacher', salary: 200, description: 'Educating the next generation', requirement: 15 },
    nurse: { name: 'Nurse', salary: 250, description: 'Caring for patients', requirement: 20 },
    engineer: { name: 'Engineer', salary: 350, description: 'Designing and building solutions', requirement: 30 },
    doctor: { name: 'Doctor', salary: 500, description: 'Healing and helping people', requirement: 50 },
    lawyer: { name: 'Lawyer', salary: 600, description: 'Defending justice and rights', requirement: 60 },
    ceo: { name: 'CEO', salary: 1000, description: 'Leading a major corporation', requirement: 100 }
};

const shopItems = {
    food: {
        apple: { name: 'Apple', price: 5, description: 'A fresh apple (+5 health)', effect: { health: 5 } },
        sandwich: { name: 'Sandwich', price: 15, description: 'A filling sandwich (+10 health, +5 happiness)', effect: { health: 10, happiness: 5 } },
        pizza: { name: 'Pizza', price: 25, description: 'A delicious pizza (+15 health, +10 happiness)', effect: { health: 15, happiness: 10 } },
        coffee: { name: 'Coffee', price: 10, description: 'A hot cup of coffee (+15 energy)', effect: { energy: 15 } },
        energy_drink: { name: 'Energy Drink', price: 20, description: 'A powerful energy boost (+30 energy)', effect: { energy: 30 } }
    },
    items: {
        phone: { name: 'Smartphone', price: 500, description: 'A modern smartphone (+5 happiness)', effect: { happiness: 5 } },
        laptop: { name: 'Laptop', price: 1000, description: 'A powerful laptop (+10 happiness)', effect: { happiness: 10 } },
        car: { name: 'Car', price: 15000, description: 'A reliable car (+20 happiness)', effect: { happiness: 20 } },
        house: { name: 'House', price: 100000, description: 'A beautiful house (+50 happiness)', effect: { happiness: 50 } },
        gym_membership: { name: 'Gym Membership', price: 100, description: 'Monthly gym access (+10 health)', effect: { health: 10 } }
    },
    medicine: {
        bandage: { name: 'Bandage', price: 20, description: 'Heals minor wounds (+20 health)', effect: { health: 20 } },
        medicine: { name: 'Medicine', price: 50, description: 'Strong medicine (+40 health)', effect: { health: 40 } },
        therapy: { name: 'Therapy Session', price: 200, description: 'Mental health support (+30 happiness)', effect: { happiness: 30 } }
    }
};

const dailyChallenges = [
    { type: 'work', description: 'Work 3 times', target: 3, reward: 200 },
    { type: 'rest', description: 'Rest 2 times', target: 2, reward: 100 },
    { type: 'spend', description: 'Spend $500', target: 500, reward: 150 },
    { type: 'earn', description: 'Earn $1000', target: 1000, reward: 300 }
];

const weeklyQuests = [
    { type: 'work', description: 'Work 15 times', target: 15, reward: 1000 },
    { type: 'level_up', description: 'Gain 5 levels', target: 5, reward: 2000 },
    { type: 'social', description: 'Make 3 new friends', target: 3, reward: 500 },
    { type: 'shopping', description: 'Buy 10 items', target: 10, reward: 800 }
];

const achievements = {
    first_job: { name: 'First Job', description: 'Get your first job', reward: 100 },
    millionaire: { name: 'Millionaire', description: 'Reach $1,000,000', reward: 5000 },
    workaholic: { name: 'Workaholic', description: 'Work 100 times', reward: 1000 },
    social_butterfly: { name: 'Social Butterfly', description: 'Have 10 friends', reward: 500 },
    max_health: { name: 'Perfect Health', description: 'Reach 100 health', reward: 200 },
    max_happiness: { name: 'Pure Joy', description: 'Reach 100 happiness', reward: 200 }
};

module.exports = {
    jobs,
    shopItems,
    dailyChallenges,
    weeklyQuests,
    achievements
};