# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install && npm run build

RUN npm install -g serve

EXPOSE 46607

CMD ["serve", "-s", "dist", "-l", "46607"]
