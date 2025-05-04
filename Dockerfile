# Imagen base con Node.js
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# Instalar dependencias
RUN npm install

# Compilar el proyecto Vite (React + TensorFlow.js)
RUN npm run build

# Instalar servidor estático para producción
RUN npm install -g http-server

# Exponer el puerto 3000
EXPOSE 3000

# Servir contenido desde /dist
CMD ["http-server", "dist", "-p", "3000"]
