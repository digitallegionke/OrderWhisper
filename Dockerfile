FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine as runner

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=8080

RUN npm prune --production

EXPOSE 8080

CMD ["npm", "run", "docker-start"]
