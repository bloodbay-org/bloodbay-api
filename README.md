#Bloodbay-api by Nick Shulhin

Backend (API) for bloodbay.org vaccine reporting platform.

## Pre-requisites

This project uses MongoDB as a primary database solution, therefore you can either spin up a local instance or use a MongoDB Atlas for a hosted solution.

Make sure you have NodeJS/npm/yarn installed on your system.

## Starting the project locally

Specify MongoDB connection string in `/src/config/db/url` which is defaulted to standard dev environment `mongodb://root:root@localhost:27017`

**Install dependencies**
### `yarn install`

**You can also run tests if already connected to local MongoDB**
### `yarn test`

**Start API**
### `yarn start`

Now your API is exposed under 8080 port which can be used by a front-end.

