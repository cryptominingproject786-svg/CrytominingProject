import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoDb";
import User from "../../../../models/User";

export async function POST(req) {
    try {
        const body = await req.json();
        const { username, email, password, passwordConfirm, adminCode } = body || {};
        if (!username || !email || !password || !passwordConfirm || !adminCode) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        if (password !== passwordConfirm) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }

        // Require a server-side admin code to prevent public admin creation
        const expected = process.env.ADMIN_SIGNUP_CODE;
        if (!expected) {
            console.error("/api/auth/admin/register: ADMIN_SIGNUP_CODE is not configured");
            return NextResponse.json({ error: "Server misconfiguration: ADMIN_SIGNUP_CODE not set" }, { status: 500 });
        }
        // log lengths and short masked previews to aid debugging without exposing the full secret
        const providedTrimmed = String(adminCode || "").trim();
        const expectedTrimmed = String(expected || "").trim();
        const mask = (s) => (s.length <= 6 ? "***" : `${s.slice(0, 3)}...${s.slice(-3)}`);
        console.info("/api/auth/admin/register: provided length=", providedTrimmed.length, "preview=", mask(providedTrimmed));
        console.info("/api/auth/admin/register: expected length=", expectedTrimmed.length, "preview=", mask(expectedTrimmed));

        // Accept exact match or if one value contains the other (handles cases where env var may be truncated).
        if (providedTrimmed !== expectedTrimmed) {
            // If the client accidentally included escape backslashes (e.g. pasted "\$"), normalize them and compare again.
            const providedNormalized = providedTrimmed.replace(/\\/g, "");
            if (providedNormalized === expectedTrimmed) {
                console.warn("/api/auth/admin/register: adminCode matched after removing escape backslashes (user likely pasted with escapes)", {
                    expectedLength: expectedTrimmed.length,
                    providedLength: providedTrimmed.length,
                    normalizedLength: providedNormalized.length,
                });
            } else {
                // Check partial containment (one contains the other)
                const partialOk = providedTrimmed.includes(expectedTrimmed) || expectedTrimmed.includes(providedTrimmed) || providedNormalized.includes(expectedTrimmed) || expectedTrimmed.includes(providedNormalized);
                if (partialOk) {
                    console.warn("/api/auth/admin/register: partial adminCode match accepted (investigate environment config)", {
                        expectedLength: expectedTrimmed.length,
                        providedLength: providedTrimmed.length,
                    });
                } else {
                    // Compute first differing index to help diagnose invisible characters
                    const minLen = Math.min(providedTrimmed.length, expectedTrimmed.length);
                    let firstDiff = -1;
                    for (let i = 0; i < minLen; i++) {
                        if (providedTrimmed.charCodeAt(i) !== expectedTrimmed.charCodeAt(i)) {
                            firstDiff = i;
                            break;
                        }
                    }
                    if (firstDiff === -1 && providedTrimmed.length !== expectedTrimmed.length) {
                        firstDiff = minLen; // difference is in length
                    }

                    const previewAround = (s, idx) => {
                        const start = Math.max(0, idx - 2);
                        const end = Math.min(s.length, idx + 3);
                        return s.slice(start, end).split("").map((c) => (c === "\n" ? "\\n" : c)).join("");
                    };

                    console.info("/api/auth/admin/register: mismatch details", {
                        expectedLength: expectedTrimmed.length,
                        providedLength: providedTrimmed.length,
                        firstDiffIndex: firstDiff,
                        expectedPreview: firstDiff >= 0 ? previewAround(expectedTrimmed, firstDiff) : mask(expectedTrimmed),
                        providedPreview: firstDiff >= 0 ? previewAround(providedTrimmed, firstDiff) : mask(providedTrimmed),
                    });

                    return NextResponse.json({ error: "Invalid admin signup code", expectedLength: expectedTrimmed.length, providedLength: providedTrimmed.length, firstDiffIndex: firstDiff }, { status: 403 });
                }
            }
        }

        // At this point admin code is accepted (exact or partial). Proceed to create admin.
        console.info("/api/auth/admin/register: creating admin user", { email });

        await connectDB();
        console.info("/api/auth/admin/register: connected to DB");

        const normalized = String(email).trim().toLowerCase();
        const exists = await User.findOne({ email: normalized }).lean();
        if (exists) {
            console.info("/api/auth/admin/register: email already in use", { email: normalized });
            return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }

        const user = await User.create({ username, email: normalized, password, isVerified: true, role: "admin" });
        console.info("/api/auth/admin/register: created user", { id: String(user._id) });

        return NextResponse.json({ status: "created", id: String(user._id) }, { status: 201 });
    } catch (err) {
        console.error("/api/auth/admin/register error", err);
        if (err?.message?.includes("MONGODB_URI")) {
            return NextResponse.json({ error: "Server misconfiguration: missing MONGODB_URI" }, { status: 500 });
        }
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
