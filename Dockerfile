FROM node:25-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --legacy-peer-deps

COPY . .

# Prisma Config validates that DATABASE_URL exists, but client generation does
# not connect to the database. Railway provides the real URL only at runtime.
RUN DATABASE_URL=postgresql://prisma:prisma@localhost:5432/prisma npx prisma generate
RUN npm run build

FROM node:25-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --legacy-peer-deps --omit=dev

COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/static ./apps/backend/static
COPY prisma ./prisma
COPY prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node apps/backend/dist/server.js"]
