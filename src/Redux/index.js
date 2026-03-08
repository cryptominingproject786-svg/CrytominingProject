"use client";

import { configureStore } from "@reduxjs/toolkit";
import miningReducer from "./Slices/MiningSlice";
import InvestmentReucer from "./Slices/InvestmentSlice"

export const store = configureStore({
    reducer: {
        mining: miningReducer,
        investments: InvestmentReucer
    },
});
