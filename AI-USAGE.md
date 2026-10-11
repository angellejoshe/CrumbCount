# AI Usage

I used ChatGPT as an AI assistant throughout the development of CrumbCount, a web-based inventory and costing management application for small baking businesses. I used it to help with coding, debugging, deployment, documentation, and understanding technical concepts. I reviewed the suggestions, made adjustments when necessary, and tested the application to verify that the features worked as expected.

## 1. How I Used AI

### 2026-09-29 - Full-Stack Integration

- **Tool:** ChatGPT
- **What I asked for:** Help integrating the React/Vite frontend, Express backend, and PostgreSQL database for CrumbCount.
- **What it gave back:** Code suggestions and guidance for connecting the frontend to the API and configuring the database connection.
- **What I kept/changed/why:** I used the guidance to integrate the application's components and tested the inventory and costing features to ensure that they worked with the backend.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/a9fc771

### 2026-10-09 - Security Checklist and API Authentication

- **Tool:** ChatGPT
- **What I asked for:** Help reviewing the project's security and implementing an API authentication guard.
- **What it gave back:** Suggestions for documenting security practices and adding authentication checks to API routes.
- **What I kept/changed/why:** I added the security checklist and API authentication guard. I later adjusted the authentication configuration to follow the environment setting for the demo deployment. Since authentication is disabled in the current demo configuration, I will only use demo data and avoid storing sensitive information.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/b6495bf

### 2026-10-09 - Costing Units and Responsive Branding

- **Tool:** ChatGPT
- **What I asked for:** Help improving the costing interface, unit handling, and responsive branding.
- **What it gave back:** Suggestions for updating costing units and improving the responsive layout and branding.
- **What I kept/changed/why:** I applied the changes that fit the existing design and checked the interface in the browser to ensure that the updates were consistent with the application.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/15d8686

### 2026-10-09 - Fixing the GitHub Pages Logo Path

- **Tool:** ChatGPT
- **What I asked for:** Help troubleshooting why the logo path needed to work correctly when the application was deployed on GitHub Pages.
- **What it gave back:** Guidance on configuring the asset path for a project deployed under a repository-specific URL.
- **What I kept/changed/why:** I applied the path correction so the logo could load properly from the deployed application instead of relying on an incorrect root-relative path.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/c2b6dce

### 2026-10-09 - Demo Data and Project Documentation

- **Tool:** ChatGPT
- **What I asked for:** Help configuring demo data and completing the project's documentation.
- **What it gave back:** Suggestions for separating local demo data from the deployed application's data and organizing project documentation.
- **What I kept/changed/why:** I applied the configuration changes that matched the intended demo setup and completed documentation updates. I also tested the deployed application instead of relying only on a successful deployment.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/ccb2f94
- **Related Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/0002a7c

### 2026-10-11 - Fixing PostgreSQL TLS and API Configuration

- **Tool:** ChatGPT
- **What I asked for:** Help troubleshooting the PostgreSQL TLS certificate error on Render and correcting the API authentication environment setting.
- **What it gave back:** Debugging steps and code suggestions for configuring the database connection and making API authentication depend on the environment variable.
- **What I kept/changed/why:** I applied the fixes and tested the deployed API and inventory features. The current remote database configuration allows TLS connections without certificate verification, which is a security trade-off that should be addressed before using the application for production data.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/7ade915
- **Related Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/5ac197a

## 2. Where the AI Got It Wrong

### Case 1 - Authentication Setup

- **What it gave me:** Initial guidance based on comparing CrumbCount with another project that contained authentication-related code.
- **What was wrong:** The presence of authentication code in another project did not necessarily mean that its routes were protected or that the same configuration would be appropriate for CrumbCount.
- **What I did instead:** I checked how authentication was applied and adjusted CrumbCount's authentication behavior to follow the environment setting. I also recognized that disabling authentication leaves the public API unprotected, so the demo should not contain sensitive data.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/5ac197a

### Case 2 - PostgreSQL Connection Troubleshooting

- **What it gave me:** A fix focused on the PostgreSQL TLS certificate error.
- **What was wrong:** Fixing the connection error alone did not guarantee that the database schema and required tables were already initialized.
- **What I did instead:** I ran the database schema against the configured database and tested the API again to verify that the database-backed features could work.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/7ade915

### Case 3 - Assuming Deployment Meant the Application Was Fully Functional

- **What it gave me:** Deployment guidance and configuration changes that still needed application-level testing.
- **What was wrong:** A successful deployment or a healthy server did not automatically prove that inventory and costing features were correctly connected to the database.
- **What I did instead:** I added an ingredient through the deployed application, refreshed the page to confirm that the data persisted, and checked that Recipe Costing worked.
- **Commit URL:** https://github.com/angellejoshe/CrumbCount/commit/0002a7c

## 3. Who Wrote What

### Written by Me

- **File/commit:** Changes across the CrumbCount repository, including the commits listed above.
- **Explanation:** I directed the development of CrumbCount, identified the features and improvements needed, reviewed AI suggestions, applied changes, committed updates, configured deployment, and tested the application. ChatGPT assisted with code generation, explanations, and troubleshooting, but I was responsible for deciding which suggestions to use and checking the resulting application.

### The AI-Written Part I Understand Best

- **File/commit:** `server/db/pool.js` — https://github.com/angellejoshe/CrumbCount/commit/7ade915
- **Explanation:** This file configures the PostgreSQL connection pool using the `DATABASE_URL` environment variable. The application uses the pool to execute database queries. Connection limits and timeouts help manage database connections and prevent requests from waiting indefinitely. The current remote TLS configuration encrypts the connection but does not verify the certificate, so it is not equivalent to full certificate verification.
