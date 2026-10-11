# CrumbCount

**Track your ingredients. Calculate your costs. Manage your baking business.**

CrumbCount is a web-based inventory and costing management application designed for small baking businesses. It helps bakers manage ingredient stocks, update ingredient prices, and calculate product costs to support accurate pricing and better financial management.

## Project Links

- **Live Site:** [CrumbCount](https://angellejoshe.github.io/CrumbCount/)
- **Demo Video:** [Watch the CrumbCount Demo](https://drive.google.com/drive/folders/1oIJ229Hauit6M_SJfNkBtFFq8iNV3Q4O?usp=sharing)
- **GitHub Repository:** [CrumbCount Repository](https://github.com/angellejoshe/CrumbCount)

## Features

- **Inventory Management** — Add ingredients and manage available stock quantities.
- **Ingredient Price Tracking** — Update ingredient prices to keep inventory costs accurate.
- **Recipe Costing** — Calculate product costs based on ingredient quantities and prices.
- **Cost Management** — Review product costing to support informed pricing decisions.
- **Persistent Data Storage** — Store inventory and costing data through the connected backend and database.

## Technology Stack

- **Frontend:** React and Vite
- **Backend:** Node.js and Express
- **Database:** PostgreSQL
- **Deployment:** GitHub Pages and Render

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL for local database-backed development

### 1. Clone the Repository

```bash
git clone https://github.com/angellejoshe/CrumbCount.git
cd CrumbCount
```

### 2. Run the Client

Open a terminal and run:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run the API

Open a separate terminal and run:

```bash
cd server
npm install
```

Create a `.env` file based on `.env.example` and configure the required environment variables, including `DATABASE_URL`.

Start the API:

```bash
npm run dev
```

The API runs at [http://localhost:3000](http://localhost:3000).

Ensure that PostgreSQL is running, the database connection is configured, and the database schema has been initialized before using database-backed features.

### 4. Connect the Client to the API

Configure `client/.env` with the following values:

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3000
```

Restart the client development server after changing environment variables.

## Project Structure

```text
CrumbCount/
├── client/       # React and Vite frontend
├── server/       # Express API and database integration
├── docs/         # Project documentation, if present
├── compose.yml   # Container setup, if configured
└── README.md
```

## Deployment

### Frontend

The frontend is deployed through GitHub Pages.

**Live application:** https://angellejoshe.github.io/CrumbCount/

### Backend API

The backend API is hosted on Render and connects to a PostgreSQL database.

The deployed frontend communicates with the hosted API through its configured API base URL. For local development, configure the appropriate environment variables for your local or hosted setup.

## Documentation

- **[AI Usage Documentation](AI_USAGE.md)** — Documents how AI assistance was used during development, including implementation decisions and troubleshooting.

## Security

- Keep `.env` files and credentials out of version control.
- Never commit database passwords, connection strings, or private API tokens.
- Use environment variables for deployment-specific configuration.
- Review database access and API authentication settings before using the application with sensitive or real business data.

## Project Status

CrumbCount is deployed and accessible through its live site. The application supports inventory management and recipe costing through its connected backend and database.

---

*Bake smarter. Cost accurately. Grow sustainably.*
