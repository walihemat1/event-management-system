import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import eventsReducer from "../features/events/eventsSlice";
import categoryReducer from "../features/category/categorySlice";
import ticketsReducer from "../features/tickets/ticketsSlice";
import registrationsReducer from "../features/registration/registrationSlice";
import feedbackReducer from "../features/feedback/feedbackSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import adminReducer from "../features/admin/adminSlice";
import attendeeDashboardReducer from "../features/attendee/attendeeSlice";
import adminUsersReducer from "../features/admin/adminUsersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    category: categoryReducer,
    tickets: ticketsReducer,
    registrations: registrationsReducer,
    feedback: feedbackReducer,
    notifications: notificationsReducer,
    admin: adminReducer,
    attendeeDashboard: attendeeDashboardReducer,
    adminUsers: adminUsersReducer,
  },
});
