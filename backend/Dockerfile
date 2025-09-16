FROM node:20-alpine

WORKDIR /app

# Install Python and build dependencies for canvas package
RUN apk add --no-cache python3 py3-pip build-base

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
