# -------- Build Stage --------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NAS build
RUN npm run build -- --configuration=nas

# -------- Serve Stage --------
FROM nginx:alpine
COPY --from=build /app/dist/document-scanner-frontend-nas /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
