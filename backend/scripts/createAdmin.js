// backend/scripts/createAdmin.js
//
// Bootstraps an admin account from the command line. Admin registration is not
// exposed publicly over HTTP, so this is how the first admin gets created.
//
// Usage (credentials come from the environment, never from source code):
//   ADMIN_NAME="Site Admin" ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' npm run create-admin

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/buyer.model.js';

dotenv.config();

const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

const fail = (message) => {
  console.error(`Error: ${message}`);
  process.exit(1);
};

if (!MONGO_URI) fail('MONGO_URI is not defined in the environment.');
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  fail('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) fail('ADMIN_EMAIL is not a valid email address.');
if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(ADMIN_PASSWORD)) {
  fail('ADMIN_PASSWORD must be at least 8 characters and include upper and lower case letters, a number and a symbol.');
}

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    if (await User.findOne({ email: ADMIN_EMAIL })) {
      fail(`A user with email ${ADMIN_EMAIL} already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      isAdmin: true,
    });

    console.log(`Admin account created for ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    fail(error.message);
  }
};

createAdmin();
