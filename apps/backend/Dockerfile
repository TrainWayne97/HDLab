FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
# Kein root: das Backend braucht nur Netzwerkzugriff auf MongoDB/RabbitMQ
USER node
CMD ["npm", "start"]