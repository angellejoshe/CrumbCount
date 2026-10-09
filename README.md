# CrumbCount

CrumbCount helps a small bakery track ingredients and work out recipe costs.

## Features

- Manage ingredient stock, prices, and restock levels.
- Create recipes and calculate batch cost, cost per piece, and margin.

## Data

The GitHub Pages site saves data in the current browser. It starts empty, and
each browser keeps its own data. It does not sync with the PostgreSQL database.

## Run locally

For the browser-only version:

    cd client
    npm install
    npm run dev

To use the Express API and PostgreSQL, set up the database and server using the
example environment files in `server/` and `client/`. For personal use, the
GitHub Pages app stays in browser-local mode and does not require a sign-in.
The optional self-hosted API uses one shared token; do not put a real token in a
public frontend build.
