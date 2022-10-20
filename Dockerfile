FROM node:16
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
EXPOSE 3000
RUN npm install prisma
RUN npx prisma migrate dev
RUN npx prisma generate
RUN npm start