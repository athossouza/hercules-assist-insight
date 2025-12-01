FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN apk add --no-cache openssl
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
