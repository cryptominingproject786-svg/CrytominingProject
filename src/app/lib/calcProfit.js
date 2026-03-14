export function calculateProfit(investment) {

    const now = Date.now();

    const last = new Date(
        investment.lastProfitAt || investment.startDate
    ).getTime();

    const secondsPassed = (now - last) / 1000;

    const DAY_SECONDS = 86400;

    const profitPerSecond = investment.dailyProfit / DAY_SECONDS;

    const profit = secondsPassed * profitPerSecond;

    return Math.max(0, profit);
}