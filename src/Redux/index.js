"use client";

import { configureStore } from "@reduxjs/toolkit";
import miningReducer from "./Slices/MiningSlice";

export const store = configureStore({
    reducer: {
        mining: miningReducer,
    },
});
