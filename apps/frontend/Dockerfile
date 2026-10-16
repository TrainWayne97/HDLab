# 1. Build: statisches Bundle mit Vite. VITE_-Variablen werden dabei ins JavaScript
#    geschrieben und sind für jeden Besucher lesbar - dort nie Geheimnisse ablegen.
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ARG VITE_TUTORIAL_SOLUTION_PASSWORD=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_TUTORIAL_SOLUTION_PASSWORD=$VITE_TUTORIAL_SOLUTION_PASSWORD
RUN npm run build

# 2. Ausliefern: nur die gebauten Dateien über nginx. Kein Vite-Dev-Server im Betrieb
#    (Dateizugriff/HMR-Endpunkte, mehrfach von Sicherheitslücken betroffen) und keine
#    Umgebungsvariablen mit Secrets in diesem Container.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5173
