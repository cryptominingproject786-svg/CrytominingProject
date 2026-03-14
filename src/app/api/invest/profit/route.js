import connectDB from "../../../lib/mongoDb";
import Investment from "../../../models/Investment";
import { calculateProfit } from "../../../lib/calcProfit";
import { getToken } from "next-auth/jwt";

export async function GET(req) {

    await connectDB();

    const token = await getToken({ req });

    const investments = await Investment.find({
        user: token.id,
        status: "active"
    });

    const results = investments.map(inv => {

        const profit = calculateProfit(inv);

        return {
            id: inv._id,
            miner: inv.minerName,
            claimableProfit: profit
        };
    });

    return Response.json({ data: results });
}