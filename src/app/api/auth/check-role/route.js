import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";

/**
 * POST /api/auth/check-role
 * Check what role an email is registered with
 * Used to prevent role mismatches at login
 */
export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return Response.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("role");

        if (!user) {
            // Email doesn't exist - return neutral response
            return Response.json({ role: null }, { status: 200 });
        }

        return Response.json(
            { role: user.role || "user" },
            { status: 200 }
        );
    } catch (error) {
        console.error("check-role error:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
