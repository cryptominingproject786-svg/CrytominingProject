import nodemailer from "nodemailer";

// Minimal mailer: send real email if SMTP or EMAIL_SERVER is configured.
const EMAIL_SERVER = process.env.EMAIL_SERVER;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PAS;
const FROM = process.env.MAIL_FROM || "no-reply@example.com";

let transporter = null;

if (EMAIL_SERVER) {
    transporter = nodemailer.createTransport(EMAIL_SERVER);
} else if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
    });
}

function getMailerError() {
    return new Error(
        "Email service is not configured. Set EMAIL_SERVER or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS."
    );
}

export async function sendMail({ to, subject, text, html }) {
    if (!transporter) {
        const error = getMailerError();
        console.error(error.message);
        throw error;
    }

    await transporter.sendMail({ from: FROM, to, subject, text, html });
    return { sent: true };
}

export async function sendOtpEmail(to, otp) {
    const subject = "Your verification code";
    const text = `Your verification code is ${otp}. It expires in 10 minutes.`;
    const html = `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
    return sendMail({ to, subject, text, html });
}

export async function sendMagicLinkEmail(to, url) {
    const subject = "Verify your email and open your dashboard";
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    const link = new URL(url);
    if (appUrl) {
        const origin = new URL(appUrl).origin;
        link.protocol = new URL(origin).protocol;
        link.host = new URL(origin).host;
    }
    const finalUrl = link.toString();
    const callbackUrl = link.searchParams.get("callbackUrl") || `${appUrl || link.origin.replace(/\/$/, "")}/dashboard`;
    const text = `Click this link to verify your email and open your dashboard: ${callbackUrl}\n\nIf the button does not work, use this full sign-in link: ${finalUrl}`;
    const html = `
        <div style="font-family:system-ui, sans-serif; color:#111; line-height:1.5;">
            <p>Hi there,</p>
            <p>Thanks for signing up. Click the button below to verify your email and open your dashboard.</p>
            <p>
                <a href="${finalUrl}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;">
                    Open Dashboard
                </a>
            </p>
            <p>If the button doesn't work, copy and paste this direct dashboard link into your browser:</p>
            <p><a href="${callbackUrl}" style="color:#0f766e;">${callbackUrl}</a></p>
            <p>The secure sign-in link is:</p>
            <p><a href="${finalUrl}" style="color:#0f766e;word-break:break-all;">${finalUrl}</a></p>
            <p>This link expires in 15 minutes.</p>
        </div>
    `;
    return sendMail({ to, subject, text, html });
}
