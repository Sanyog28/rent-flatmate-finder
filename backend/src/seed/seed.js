require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, TenantProfile, Listing } = require('../models');

async function seed() {
  await sequelize.sync();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
    await User.create({ name: 'Admin', email: adminEmail, passwordHash, role: 'admin' });
    console.log(`Admin created: ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
  }

  let owner = await User.findOne({ where: { email: 'owner@example.com' } });
  if (!owner) {
    const passwordHash = await bcrypt.hash('Owner@123', 10);
    owner = await User.create({ name: 'Sample Owner', email: 'owner@example.com', passwordHash, role: 'owner' });
    console.log('Owner created: owner@example.com / Owner@123');
  }

  let tenant = await User.findOne({ where: { email: 'tenant@example.com' } });
  if (!tenant) {
    const passwordHash = await bcrypt.hash('Tenant@123', 10);
    tenant = await User.create({ name: 'Sample Tenant', email: 'tenant@example.com', passwordHash, role: 'tenant' });
    await TenantProfile.create({
      userId: tenant.id,
      preferredLocation: 'Koramangala, Bangalore',
      budgetMin: 8000,
      budgetMax: 15000,
      moveInDate: '2025-03-01',
      bio: 'Non-smoker, works in tech, quiet lifestyle.'
    });
    console.log('Tenant created: tenant@example.com / Tenant@123');
  }

  const listingCount = await Listing.count({ where: { ownerId: owner.id } });
  if (listingCount === 0) {
    await Listing.create({
      ownerId: owner.id,
      title: '2BHK Shared Room near Metro',
      location: 'Koramangala, Bangalore',
      rent: 12000,
      availableFrom: '2025-03-01',
      roomType: 'shared',
      furnishingStatus: 'furnished',
      description: 'Bright room in a 2BHK apartment, 5 min walk to metro station.',
      photos: []
    });
    console.log('Sample listing created');
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});