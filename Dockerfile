# Usa Node con Alpine
FROM node:20-alpine

# Crea el directorio de trabajo
WORKDIR /app

# Copia todo el contenido del proyecto
COPY . .

# Instala las dependencias del proyecto
RUN npm install

# Compila el proyecto Vite
RUN npm run build

# Instala Express para servir los archivos
RUN npm install express

# Copia el archivo de servidor
COPY server.js .

# Expone el puerto
EXPOSE 3000

# Ejecuta el servidor Express
CMD ["node", "server.js"]
