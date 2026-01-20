import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedMiner: null,
    isModalOpen: false,
};

const miningSlice = createSlice({
    name: "mining",
    initialState,
    reducers: {
        openPurchaseModal(state, action) {
            state.selectedMiner = action.payload;
            state.isModalOpen = true;
        },
        closePurchaseModal(state) {
            state.selectedMiner = null;
            state.isModalOpen = false;
        },
    },
});

export const { openPurchaseModal, closePurchaseModal } = miningSlice.actions;
export default miningSlice.reducer;
