# Xeno AI Campaign Console

![Xeno AI Hero Banner](https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=Xeno+AI+Marketing+Platform)

**Xeno AI Campaign Console** is an enterprise-grade Customer Intelligence and Campaign Automation SaaS platform. It moves beyond static analytics to provide a dynamic, AI-powered command center where marketers can ingest customer data, generate intelligent segments, and deploy high-converting omni-channel campaigns with complete AI explainability.

---

## 🌟 Core Features

### 🏢 Multi-Workspace Architecture & Isolation
Designed for enterprise and multi-tenant environments, Xeno allows users to manage multiple brand workspaces (e.g., *Apex Cosmetics*, *Core Nutrition*).
- **Strict Data Isolation**: Instantly swap datasets, customer cohorts, campaigns, and metrics by switching workspaces.
- **Full Workspace Management**: Create, Rename, Duplicate, Archive, and Delete workspaces dynamically.

### 🧠 AI Insights Hub & Command Center
The platform isn't just a dashboard; it's an intelligent decision engine.
- **AI Anomalies & Opportunities**: Automatically discovers revenue opportunities (e.g., Win-Backs, VIP Upsells) and flags churn risks without requiring manual data mining.
- **AI Priority Actions**: Immediate, one-click CTA widgets to launch campaigns targeting highly profitable or at-risk segments.
- **Live Activity Feed**: Centralized system logging for data uploads, segment generations, and campaign dispatches.

### 🎯 Intelligent Segment Curation
- AI analyzes historical purchase intervals, frequency, and LTV to cluster customers automatically.
- **AI Explainability**: Every segment explicitly explains *why* it was created (e.g., "Purchase intervals dropped by 45%"), preventing the "black box" effect.
- **Segment Relationships**: View overlap matrices and historical trends (+/- members over 30 days).

### 🤖 AI Copilot Campaign Workbench
- Conversational or recommendation-driven workflow to generate campaign copy.
- AI recommends the optimal outbound channel (WhatsApp, Email, SMS, RCS) and predicts the ROI and expected revenue before the campaign is even launched.
- Multi-step approval wizard: *Goal → AI Understanding → Audience Selection → Channel Recommendation → Message Generation → ROI Prediction → Launch*.

### 📱 Campaign Simulator & Attribution
- Campaigns dispatched via the console feed into a live **Channel Simulator / Activity Center**.
- Real-time simulation of *Delivered*, *Opened*, *Clicked*, and *Converted* events with carrier logs.
- Direct click-through links from raw terminal logs to specific Campaign IDs and Customer Profiles.

### ⏱️ Customer Journey Timelines
- Clicking any customer reveals a complete chronological lifecycle.
- Visual milestones for **Profile Ingested**, **Entered Cohort**, and granular time signatures for every outbound campaign touchpoint (Sent → Delivered → Read → Clicked → Converted).

### 🔐 Role-Based Access Control (RBAC)
Simulated enterprise permission layers:
- **Admin**: Unrestricted read/write access and workspace administration.
- **Marketing Manager**: Focused on launching campaigns and managing brand details.
- **Analyst**: Focused on data health. Can re-run models and ingest CRM datasets, but cannot launch campaigns.
- **Viewer**: Strict read-only mode for client presentations.

### 🔄 Data Ingestion & CRM Synchronicity
- Upload, Merge, or Fully Replace customer and transaction datasets (`.csv`).
- **Simulated Integrations**: Connect directly to *Salesforce CRM*, *HubSpot*, *Shopify*, or *Segment.io*.
- **Data Freshness Scoring**: Real-time status indicators monitoring last upload, last AI compilation, and overall database health.

---

## 🚀 The End-to-End Workflow Story

1. **Brand Setup**: User configures their initial Workspace brand parameters (Industry, Format, Target Audience).
2. **Data Upload**: User drops offline customer and order datasets into the Ingestion Center.
3. **AI Compilation**: The system parses 100,000+ rows, mapping behaviors and calculating LTVs dynamically in a live terminal window.
4. **Dashboard Generation**: The AI summarizes its findings (VIPs, Churn Risks) and unlocks the Command Center.
5. **Insights to Action**: The AI Insights Hub recommends launching a WhatsApp Win-back campaign.
6. **Copilot Launch**: The user clicks the recommendation. The AI Copilot drafts the message, predicts the ROI, and launches the campaign.
7. **Simulation & Attribution**: The Campaign Activity Center fires simulated webhook events. Conversions begin appearing in real-time.
8. **Feedback Loop**: Revenue metrics feed back into the AI Learning Loop to optimize the next recommended action.

---

## 🛠️ Technology Stack

- **Framework**: React.js 
- **Build Tool**: Vite & Rolldown
- **Styling**: Tailwind CSS & Custom Glassmorphism UI (CSS Variables)
- **Icons**: Google Material Symbols
- **State Management**: React Hooks (Context, UseState, UseEffect) + LocalStorage persistence
- **Animations**: Custom Tailwind keyframes and transition utilities

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. **Clone the repository** (if applicable) and navigate to the directory:
   ```bash
   cd frontend-project-XENO
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   *The application will boot up at `http://localhost:5173/` by default.*

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🎨 UI/UX Design Philosophy

The application strictly adheres to a **Premium SaaS Aesthetic**:
- **Glassmorphism**: Soft backdrop blurs and translucent panels layered over animated mesh gradients.
- **Dynamic Interactions**: Components react gracefully via `hover-lift` transforms, glow rings, and micro-animations.
- **Typography Hierarchy**: Distinct tracking, bold capitalization for metadata, and high-legibility sans-serif fonts for financial and statistical data.

---

*This application is built as a highly interactive, stateful front-end simulation of an advanced AI marketing system.*
