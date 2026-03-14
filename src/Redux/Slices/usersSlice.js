import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    users: {} // keyed by email
};

const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {

        upsertUser(state, action) {
            const user = action.payload;

            state.users[user.email] = {
                ...state.users[user.email],
                ...user
            };
        },

        clearUsers(state) {
            state.users = {};
        }

    }
});

export const { upsertUser, clearUsers } = usersSlice.actions;
export default usersSlice.reducer;