import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedUsers() {
    console.log('Seeding users...');

    const users = [
        {
            email: 'admin@telkom.co.id',
            name: 'Super Admin',
            nik_user: '000000',
            password: 'password123',
            phone: '081234567890',
            talent_solution: 0,
            role: 'ADMIN',
        },
        {
            email: 'ts1.user1@telkom.co.id',
            name: 'User TS 1',
            nik_user: '100001',
            password: 'password123',
            phone: '081234567891',
            talent_solution: 1,
            role: 'USER',
        },
        {
            email: 'ts2.user1@telkom.co.id',
            name: 'User TS 2',
            nik_user: '200001',
            password: 'password123',
            phone: '081234567892',
            talent_solution: 2,
            role: 'USER',
        },
    ];

    for (const user of users) {
        const result = await prisma.user.upsert({
            where: { nik_user: user.nik_user },
            update: {
                password: user.password,
                talent_solution: user.talent_solution,
                phone: user.phone,
                name: user.name,
                email: user.email
            },
            create: user,
        });
        console.log(`  ✓ User: ${result.name} (NIK: ${result.nik_user}, TS: ${result.talent_solution}, Phone: ${result.phone})`);
    }

    console.log('\nDone! Test credentials:');
    console.log('  TS 1 User: NIK=100001, Password=password123');
    console.log('  TS 2 User: NIK=200001, Password=password123');
}

seedUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
