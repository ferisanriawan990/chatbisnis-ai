import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testRegister() {
  try {
    const normalizedEmail = 'testbug1@example.com';
    const password = 'password123';
    
    console.log('Finding plan...');
    const freePlan = await prisma.plan.findUnique({
      where: { slug: 'free' }
    });
    console.log('Free plan:', freePlan);

    if (!freePlan) {
      throw new Error('No free plan');
    }

    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);
    
    console.log('Creating user...');
    const user = await prisma.user.create({
      data: {
        name: 'Test Bug',
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        subscriptions: {
          create: {
            planId: freePlan.id,
            status: 'active',
            startedAt: new Date(),
            expiredAt: new Date(new Date().setFullYear(new Date().getFullYear() + 10)), // 10 years for free plan
          }
        }
      },
    });
    console.log('User created:', user);

    console.log('Creating token...');
    const token = '12345';
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    });
    console.log('Token created');

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testRegister();
