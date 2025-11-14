import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GOOGLE_APP_EMAIL_USER,
        pass: process.env.GOOGLE_APP_EMAIL_PASS,
    }
});

export default transporter;
