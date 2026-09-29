import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Dhaka Tesla Pool database with story cast...');

  // Clean existing data in referential integrity order
  await prisma.rideEventLog.deleteMany();
  await prisma.poolMember.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Create driver Jashim
  const jashim = await prisma.user.create({
    data: {
      name: 'Jashim',
      phone: '+8801711000001',
      role: 'DRIVER',
      walletBalanceP: 100000,
    },
  });

  // Create Jashim's 3-seat EV Bullet
  const bullet = await prisma.vehicle.create({
    data: {
      driverId: jashim.id,
      model: 'Bullet',
      capacity: 3,
      isOnline: true,
    },
  });

  // Create story passengers: Nusrat, Rafiq, Shirin
  const nusrat = await prisma.user.create({
    data: {
      name: 'Nusrat',
      phone: '+8801711000002',
      role: 'PASSENGER',
      walletBalanceP: 80000,
    },
  });

  const rafiq = await prisma.user.create({
    data: {
      name: 'Rafiq',
      phone: '+8801711000003',
      role: 'PASSENGER',
      walletBalanceP: 75000,
    },
  });

  const shirin = await prisma.user.create({
    data: {
      name: 'Shirin',
      phone: '+8801711000004',
      role: 'PASSENGER',
      walletBalanceP: 60000,
    },
  });

  console.log('Seed completed successfully:');
  console.log(`Driver: ${jashim.name} (${jashim.phone}), Vehicle: ${bullet.model} (Capacity: ${bullet.capacity})`);
  console.log(`Passengers: ${nusrat.name}, ${rafiq.name}, ${shirin.name}`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
