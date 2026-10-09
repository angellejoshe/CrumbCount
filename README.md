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
example environment files in `server/` and `client/`.
