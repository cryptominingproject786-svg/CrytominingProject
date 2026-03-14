"use client";

import { configureStore } from "@reduxjs/toolkit";
import miningReducer from "./Slices/MiningSlice";
import investmentReducer from "./Slices/InvestmentSlice";
import usersReducer from "./Slices/usersSlice";


export const store = configureStore({
    reducer: {
        users: usersReducer,
        mining: miningReducer,
        investments: investmentReducer,
    },
});
