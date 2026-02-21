FROM node:22-alpine

WORKDIR /app

# Installiamo le dipendenze separatamente per sfruttare la cache di Docker
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Il flag --host è fondamentale per rendere l'app accessibile fuori dal container
CMD ["npm", "run", "dev", "--", "--host"]
