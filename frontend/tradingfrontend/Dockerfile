# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Catch the build args from docker-compose
ARG VITE_API_URL
ARG VITE_RAZORPAY_API_KEY


# Convert them to ENV vars so Vite can bake them into the code 
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RAZORPAY_API_KEY=$VITE_RAZORPAY_API_KEY


RUN npm run build

# Production Stage
FROM nginx:1.29-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]