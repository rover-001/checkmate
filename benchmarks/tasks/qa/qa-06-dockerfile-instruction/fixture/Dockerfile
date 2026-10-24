FROM node:22 AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM nginx:alpine
# Copy instruction goes here
