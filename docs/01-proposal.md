# CrumbCount Proposal

CrumbCount is a web app for tracking bakery ingredients and checking the cost
of recipes. It is made for a small bakery or a student baker who wants a simple
way to manage stock and prices.

## Main features

- Add, edit, and remove ingredients and recipes.
- Track stock levels and see which ingredients need restocking.
- Estimate recipe costs using ingredient prices and quantities.

## Tools and plan

The app uses React and Vite for the website, Express for the API, and
PostgreSQL for saving data. The client is set up for GitHub Pages. The API and
database will need to be hosted separately for online use.

I will test the app with sample bakery data and check that the inventory and
recipe-costing features work. A main risk is keeping ingredient units and recipe
quantities consistent, so I will test those calculations carefully.

## Stretch goal

If there is enough time, I would like to improve the reports and make the app
easier to use on a phone.
