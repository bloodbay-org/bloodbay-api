import nodemailer from 'nodemailer'
import config from "../config/config.json";

export const sendEmail = async (to: string, subject: string, text: string, html: string) => {

    const user = process.env.SMTP_USER ? process.env.SMTP_USER : config.smtp.username;
    const pass = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD : config.smtp.password;

    let transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 465,
        secure: true,
        auth: {
            user,
            pass,
        },
    });

    return await transporter.sendMail({
        from: '"BloodBay.org" <admin@bloodbay.org>',
        to,
        subject,
        text,
        html
    });
}