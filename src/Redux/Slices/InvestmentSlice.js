import { createSlice } from "@reduxjs/toolkit";

const investmentSlice = createSlice({
    name: "investments",
    initialState: {
        data: [],
        loading: false,
        error: null,
    },
    reducers: {
        fetchStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchSuccess(state, action) {
            state.loading = false;
            state.data = action.payload;
        },
        fetchFailure(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const { fetchStart, fetchSuccess, fetchFailure } = investmentSlice.actions;
export default investmentSlice.reducer;