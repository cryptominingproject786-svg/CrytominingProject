"use client";

import { configureStore } from "@reduxjs/toolkit";
import miningReducer from "./Slices/MiningSlice";
import investmentReducer from "./Slices/InvestmentSlice";

export const store = configureStore({
    reducer: {
        mining: miningReducer,
        investments: investmentReducer,
    },
});
