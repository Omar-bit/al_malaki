# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* vars at build time. Default to the same-origin `/api`
# prefix, which nginx proxies to the backend (see nginx.conf). Override via a
# build arg for a separate-domain API deployment.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine AS runtime

# Replace the default site config with our SPA + reverse-proxy config.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
