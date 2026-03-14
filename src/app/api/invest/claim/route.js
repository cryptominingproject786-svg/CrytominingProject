import connectDB from "@/lib/mongoDb";
import Investment from "@/models/Investment";
import User from "@/models/User";
import { calculateProfit } from "@/lib/calcProfit";

export async function POST(req) {

    await connectDB();

    const { investmentId } = await req.json();

    const inv = await Investment.findById(investmentId);

    const claimable = calculateProfit(inv);

    if (claimable <= 0) {
        return Response.json({ error: "Nothing to claim" });
    }

    inv.claimedProfit += claimable;

    await inv.save();

    await User.findByIdAndUpdate(
        inv.user,
        { $inc: { balance: claimable } }
    );

    return Response.json({
        success: true,
        claimed: claimable
    });
}