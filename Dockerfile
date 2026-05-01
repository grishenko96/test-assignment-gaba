FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY common ./common
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

USER node

EXPOSE 3000

CMD ["node", "dist/src/main"]
