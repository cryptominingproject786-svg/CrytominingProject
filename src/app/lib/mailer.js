import nodemailer from "nodemailer";

// Minimal mailer: uses SMTP when env vars are present, otherwise logs OTP to console.
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM = process.env.MAIL_FROM || "no-reply@example.com";

let transporter = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}

export async function sendOtpEmail(to, otp) {
    const subject = "Your verification code";
    const text = `Your verification code is ${otp}. It expires in 10 minutes.`;
    const html = `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;

    if (transporter) {
        await transporter.sendMail({ from: FROM, to, subject, text, html });
        return { sent: true };
    }

    // Fallback: log OTP server-side for dev/devops convenience
    console.info(`OTP for ${to}: ${otp}`);
    return { sent: false, logged: true };
}
