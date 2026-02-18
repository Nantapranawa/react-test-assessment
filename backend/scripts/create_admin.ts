import { prisma } from '../src/lib/prisma';

async function main() {
    const admin = await prisma.user.upsert({
        where: { nik_user: 'admin' },
        update: {
            role: 'ADMIN',
            talent_solution: 0
        },
        create: {
            email: 'admin@telkom.co.id',
            name: 'Super Admin',
            nik_user: 'admin',
            password: 'password123',
            talent_solution: 0,
            role: 'ADMIN'
        },
    });
    console.log('Admin user created/updated:', admin);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
