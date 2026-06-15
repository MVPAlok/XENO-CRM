# Frontend Refactoring & Integration Prompt for Codex

**Instructions for User:** Copy and paste the text below the line into Codex to instruct it to fix and fully connect your frontend.

---

**System Context:**
You are an expert React developer. I have a React frontend dashboard for an AI Campaign Console (Xeno). Currently, the UI looks good, but the functionality is broken. Many buttons (like "Launch AI Workspace") do not work, and the application relies heavily on mock data, hardcoded states, and dummy API functions. 

I also have a fully planned Express/Prisma/PostgreSQL backend that exposes REST API endpoints for authentication, workspaces, campaigns, customers, and analytics.

**Your Task:**
Make this React frontend fully functional and production-ready by connecting it to the real backend APIs, removing all mock data, and fixing all broken UI flows.

**Specific Issues to Fix & Requirements:**

1. **Fix the "Launch AI Workspace" / Onboarding Flow:**
   - Currently, when completing the `OnboardingWizard` to create a workspace, the UI breaks or fails to transition properly.
   - **Action:** Fix `DashboardMain.jsx`'s `handleOnboardingComplete` function. Ensure it calls `workspaceAPI.create()`, waits for the response, updates the `workspaces` state correctly, sets the new `activeWorkspaceId`, and smoothly transitions the user into the main dashboard view without errors.

2. **Replace Dummy APIs with Real HTTP Requests:**
   - In `src/utils/api.js`, I currently have dummy exports for `analyticsAPI`, `campaignAPI`, `copilotAPI`, `customerAPI`, `notificationAPI`, `segmentAPI`, `simulatorAPI`, and `workspaceAPI` that just return static Promises.
   - **Action:** Rewrite these API objects in `src/utils/api.js` to use the `apiRequest` helper (which handles auth headers and token refresh) so they make actual `GET`, `POST`, `PATCH`, and `DELETE` requests to my backend (e.g., `http://localhost:5000/api/v1/...`).

3. **Remove Mock Data Dependencies:**
   - The components currently import fake data from `src/dashboard/mockData.js`. 
   - **Action:** Delete references to `mockData.js`. All data for Campaigns, Customers, Segments, Analytics (KPIs), and Simulator logs must be dynamically fetched from the backend when `loadWorkspaceData` runs. Handle loading states properly (using skeleton loaders) so the UI doesn't crash while waiting for data.

4. **Fix State Management in `DashboardMain.jsx`:**
   - The application relies on a single massive component (`DashboardMain.jsx`) holding all the state. Sometimes `activeWorkspaceId` is set, but the `workspaces` array is empty, causing crashes.
   - **Action:** Ensure state is synchronized. When a user creates or deletes a workspace, the `workspaces` array and `activeWorkspaceId` must update perfectly. Add null checks (e.g., `if (!activeWorkspace) return <Loading />`) to prevent rendering crashes.

5. **Wire Up All Interactive Elements:**
   - Ensure that all interactive buttons in `TopHeader`, `Sidebar`, and inner pages (like `GrowthStudioPage`, `CampaignsPage`, `SegmentsPage`) are connected to their corresponding state handlers and API calls. 
   - Ensure the "Floating AI Copilot" actually sends user prompts to a real backend endpoint (e.g., `/api/v1/copilot/chat`) instead of simulating local `setTimeout` responses.

6. **Error Handling & Notifications:**
   - When an API call fails (e.g., network error, unauthorized), catch the error gracefully and display it using the existing `addNotification` system instead of letting the app fail silently or crash.

**Output Requirements:**
Please provide the updated, production-ready code for:
1. `src/utils/api.js` (with real fetch calls instead of dummy promises).
2. `src/dashboard/DashboardMain.jsx` (with fixed state logic, loading checks, and real data integration).
3. Any other component files that need modifications to remove hardcoded `mockData` imports.
