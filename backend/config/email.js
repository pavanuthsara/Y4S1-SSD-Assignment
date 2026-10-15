import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Static ES module imports run before server.js calls dotenv.config(). Load the
// backend environment file here so SMTP settings exist when the transporter is
// created, regardless of the directory used to start the application.
dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
});

const emailPort = Number(process.env.EMAIL_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export default transporter;
