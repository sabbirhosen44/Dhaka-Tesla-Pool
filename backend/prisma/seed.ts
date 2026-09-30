import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Dhaka Tesla Pool database with extended story cast and historical records...');

  // Clean existing data in referential integrity order
  await prisma.rideEventLog.deleteMany();
  await prisma.poolMember.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // 1. Primary Driver: Jashim
  const jashim = await prisma.user.create({
    data: {
      name: 'Jashim',
      phone: '+8801711000001',
      role: 'DRIVER',
      walletBalanceP: 150000, // 1500 BDT
    },
  });

  // Jashim's 3-seat EV "Bullet"
  const bullet = await prisma.vehicle.create({
    data: {
      driverId: jashim.id,
      model: 'Bullet',
      capacity: 3,
      isOnline: true,
    },
  });

  // 2. Secondary Driver: Kabir (for multi-vehicle fleet demonstration)
  const kabir = await prisma.user.create({
    data: {
      name: 'Kabir',
      phone: '+8801711000010',
      role: 'DRIVER',
      walletBalanceP: 120000,
    },
  });

  const thunder = await prisma.vehicle.create({
    data: {
      driverId: kabir.id,
      model: 'Thunder',
      capacity: 3,
      isOnline: true,
    },
  });

  // 3. Core Story Passengers
  const nusrat = await prisma.user.create({
    data: {
      name: 'Nusrat',
      phone: '+8801711000002',
      role: 'PASSENGER',
      walletBalanceP: 80000, // 800 BDT
    },
  });

  const rafiq = await prisma.user.create({
    data: {
      name: 'Rafiq',
      phone: '+8801711000003',
      role: 'PASSENGER',
      walletBalanceP: 75000, // 750 BDT
    },
  });

  const shirin = await prisma.user.create({
    data: {
      name: 'Shirin',
      phone: '+8801711000004',
      role: 'PASSENGER',
      walletBalanceP: 60000, // 600 BDT
    },
  });

  // 4. Additional Story Commuters for Corridor Diversity
  const tanvir = await prisma.user.create({
    data: {
      name: 'Tanvir',
      phone: '+8801711000005',
      role: 'PASSENGER',
      walletBalanceP: 90000,
    },
  });

  const anika = await prisma.user.create({
    data: {
      name: 'Anika',
      phone: '+8801711000006',
      role: 'PASSENGER',
      walletBalanceP: 85000,
    },
  });

  // 5. Seed Historical Completed Trip (Audit Trail demonstration)
  // Historical Ride Request for Nusrat
  const pastRideNusrat = await prisma.rideRequest.create({
    data: {
      passengerId: nusrat.id,
      pickupZone: 'BANANI',
      dropoffZone: 'MOHAKHALI',
      seatsRequested: 1,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 86400000), // 24 hours ago
    },
  });

  // Historical Ride Request for Rafiq
  const pastRideRafiq = await prisma.rideRequest.create({
    data: {
      passengerId: rafiq.id,
      pickupZone: 'BANANI',
      dropoffZone: 'GULSHAN_1',
      seatsRequested: 1,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 86400000),
    },
  });

  // Historical Completed Pool
  const pastPool = await prisma.pool.create({
    data: {
      driverId: jashim.id,
      vehicleId: bullet.id,
      capacity: 3,
      occupiedSeats: 2,
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 86400000),
    },
  });

  // Pool Members with Poysha Fare Isolation
  await prisma.poolMember.create({
    data: {
      poolId: pastPool.id,
      rideRequestId: pastRideNusrat.id,
      seatsAllocated: 1,
      baseFare: 5000,
      distanceFare: 8000,
      discount: 3250,
      finalFare: 9750, // 97.50 BDT
      paymentMethod: 'TESLA_PAY',
      paymentStatus: 'PAID',
    },
  });

  await prisma.poolMember.create({
    data: {
      poolId: pastPool.id,
      rideRequestId: pastRideRafiq.id,
      seatsAllocated: 1,
      baseFare: 5000,
      distanceFare: 7000,
      discount: 3000,
      finalFare: 9000, // 90.00 BDT
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
    },
  });

  // Audit Logs
  await prisma.rideEventLog.createMany({
    data: [
      {
        rideRequestId: pastRideNusrat.id,
        fromStatus: 'REQUESTED',
        toStatus: 'MATCHED',
        note: 'Matched with Jashim Bullet on CENTRAL_CONNECT corridor',
        timestamp: new Date(Date.now() - 86000000),
      },
      {
        rideRequestId: pastRideNusrat.id,
        fromStatus: 'MATCHED',
        toStatus: 'STARTED',
        note: 'Driver departed from Banani Road 11',
        timestamp: new Date(Date.now() - 85500000),
      },
      {
        rideRequestId: pastRideNusrat.id,
        fromStatus: 'STARTED',
        toStatus: 'COMPLETED',
        note: 'Safely dropped off at Mohakhali Flyover',
        timestamp: new Date(Date.now() - 85000000),
      },
    ],
  });

  console.log('Seed completed successfully!');
  console.log(`Drivers: Jashim (Bullet - 3 seats), Kabir (Thunder - 3 seats)`);
  console.log(`Core Story Cast: Nusrat, Rafiq, Shirin`);
  console.log(`Additional Commuters: Tanvir, Anika`);
  console.log(`Historical Completed Pool & Audit Logs created for demo verification.`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
