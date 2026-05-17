// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateId = () => {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 24; i++) id += chars[Math.floor(Math.random() * 16)];
  return id;
};

const FIRST_NAMES = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Charlotte', 'Elijah', 'Amelia', 'William', 'Sophia', 'James', 'Isabella', 'Benjamin', 'Mia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Gianna', 'Michael', 'Chloe', 'Daniel', 'Victoria', 'Matthew', 'Aria', 'Jackson', 'Luna', 'Sebastian', 'Grace', 'David', 'Penelope', 'Carter', 'Riley', 'Wyatt', 'Zoey', 'Jayden', 'Nora', 'John', 'Lily', 'Luke', 'Eleanor', 'Dylan', 'Hannah', 'Grayson', 'Lillian', 'Levi', 'Addison', 'Isaac', 'Aubrey', 'Gabriel', 'Ellie', 'Julian', 'Stella', 'Mateo', 'Natalie', 'Anthony', 'Zoe', 'Jaxon', 'Leah', 'Lincoln', 'Hazel'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell'];

const GLOBAL_CITIES = [
  { city: 'Lagos', country: 'Nigeria', arena: 'Secret Island Location (TBA)' },
  { city: 'New York', country: 'USA', arena: 'Abandoned Subway Station, Brooklyn' },
  { city: 'Toronto', country: 'Canada', arena: 'Industrial Warehouse 04' },
  { city: 'London', country: 'UK', arena: 'Underground Vaults, Soho' },
  { city: 'Sao Paulo', country: 'Brazil', arena: 'Rooftop Sector 9' },
  { city: 'Sydney', country: 'Australia', arena: 'Hidden Bunker, CBD' },
  { city: 'Tokyo', country: 'Japan', arena: 'Neon Sector, Shinjuku' }
];

async function main() {
  console.log('💥 INITIATING SALEX BATCH SEED PROTOCOL...');
  
  await prisma.order.deleteMany();
  await prisma.ticketBatch.deleteMany(); // Using the new model
  await prisma.event.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.systemSettings.deleteMany();

  await prisma.systemSettings.create({
    data: {
      bankName: 'Global Escrow Bank',
      accountName: 'Salex International',
      accountNumber: '9876543210',
      instructions: 'Transfer the exact amount to our secure escrow account.',
    },
  });
  
  let globalNamePool: string[] = [];
  for (const f of FIRST_NAMES) {
    for (const l of LAST_NAMES) {
      globalNamePool.push(`${f} ${l}`);
    }
  }
  globalNamePool = globalNamePool.sort(() => 0.5 - Math.random());

  const BOTS_PER_CITY = 1428; 
  const allEvents = [];
  const allBots = [];
  const allBatches = [];

  for (let i = 0; i < GLOBAL_CITIES.length; i++) {
    const data = GLOBAL_CITIES[i];
    const eventBasePrice = Math.floor(Math.random() * 50000) + 20000;
    const eventId = generateId(); 
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + (i * 3) + 7); 

    allEvents.push({
      id: eventId,
      title: `${data.city.toUpperCase()} NEON RAVE`,
      description: `Live at ${data.arena}. Secret location details sent to ticket holders.`,
      date: eventDate,
      city: data.city,
      country: data.country,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000',
      isFeatured: i < 3,
      basePrice: eventBasePrice, 
    });

    for (let b = 0; b < BOTS_PER_CITY; b++) {
      const botId = generateId(); 
      const uniqueName = globalNamePool.pop(); 
      
      allBots.push({
        id: botId,
        name: uniqueName || "Unknown Seller",
        isBot: true,
      });

      // 🎲 Only ONE row per batch, containing the quantity!
      const numberOfTickets = Math.floor(Math.random() * 6) + 1; 
      const botPrice = eventBasePrice + (Math.floor(Math.random() * 10000) - 5000); 

      allBatches.push({
        eventId: eventId,
        sellerId: botId,
        price: botPrice,
        quantity: numberOfTickets, // The database handles the math now
      });
    }
  }

  console.log('\n🚀 Writing Batches to MongoDB...');
  await prisma.event.createMany({ data: allEvents });
  
  const BOT_CHUNK_SIZE = 2000;
  for (let k = 0; k < allBots.length; k += BOT_CHUNK_SIZE) {
    await prisma.sellerProfile.createMany({ data: allBots.slice(k, k + BOT_CHUNK_SIZE) });
  }

  const BATCH_CHUNK_SIZE = 5000;
  for (let m = 0; m < allBatches.length; m += BATCH_CHUNK_SIZE) {
    await prisma.ticketBatch.createMany({ data: allBatches.slice(m, m + BATCH_CHUNK_SIZE) });
  }

  console.log(`✅ MASS SEED COMPLETE`);
}

main().catch(console.error).finally(() => prisma.$disconnect());