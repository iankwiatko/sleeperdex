# Sleeperdex

[](https://github.com/iankwiatko/sleeperdex#sleeperdex)

## Overview

[](https://github.com/iankwiatko/sleeperdex#overview)

**Sleeperdex** helps Pokemon TCG collectors find valuable cards hiding in their bulk. Select a series and set to browse card details, rarity, card numbers, and TCGplayer market prices in one searchable view. Use the filters and sorting controls to quickly surface cards that may be worth a closer look.

Sleeperdex retrieves series, set, and card data from the [TCGdex API](https://tcgdex.dev/) and displays the market-price data returned for each card.

## Authors

[](https://github.com/iankwiatko/sleeperdex#authors)

Ian Kwiatkowski

## Features

[](https://github.com/iankwiatko/sleeperdex#features)

- **Series and set browsing**: Browse supported Pokemon TCG series and their numbered sets.
- **Market-price filtering**: Set a minimum TCGplayer market price to focus on higher-value cards.
- **Price sorting**: Sort matching cards from low to high or high to low by their highest available market price.
- **Card details**: View card images, names, rarities, set numbers, and available TCGplayer market-price variants.
- **Theme switching**: Toggle between light and dark themes, with the preference saved locally in the browser.

## How to Run Locally

[](https://github.com/iankwiatko/sleeperdex#how-to-run-locally)

1. Clone the repository and open the project directory.
2. Run `npm install` to install the dependencies.
3. Run `npm run dev` to start the Vite development server.
4. Open the local URL printed in the terminal, usually [http://localhost:5173](http://localhost:5173/).

The app uses the public TCGdex API at `https://api.tcgdex.net/v2/en`; no local API server or environment variables are required.

## Available Commands

[](https://github.com/iankwiatko/sleeperdex#available-commands)

- `npm run dev`: Start the development server with hot module replacement.
- `npm run build`: Build the production bundle.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run ESLint.
- `npm run typecheck`: Run the TypeScript compiler without emitting files.

# Dependencies

[](https://github.com/iankwiatko/sleeperdex#dependencies)

## Runtime

[](https://github.com/iankwiatko/sleeperdex#runtime)

- `react` and `react-dom`
- `@tanstack/react-query` for fetching and caching API data
- `lucide-react` for interface icons
- `@vercel/analytics` for analytics

## Development

[](https://github.com/iankwiatko/sleeperdex#development)

- `vite` and `@vitejs/plugin-react` for the development server and build
- `typescript` for static typing
- `eslint` and the TypeScript/React ESLint plugins for code quality checks
