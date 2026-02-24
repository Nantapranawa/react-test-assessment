import { prisma } from './src/lib/prisma';



async function main() {
    const emp = await prisma.employeeTS1.findFirst({
        where: {
            phone: { not: null }
        }
    });
    console.log(emp?.phone);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
