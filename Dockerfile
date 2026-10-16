# Node.js API image for COMP 3123 Assignment 1
#   dev  target: all dependencies, runs nodemon (used by docker-compose.yml)
#   prod target: production dependencies only, runs node directly

FROM node:22-slim AS base
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package*.json ./

FROM base AS dev
ENV NODE_ENV=development
RUN npm ci
COPY --chown=node:node . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --chown=node:node . .
EXPOSE 3000
CMD ["node", "server.js"]
