# Usamos Node con todas las herramientas necesarias
FROM node:20-alpine

# Creamos el directorio de trabajo
WORKDIR /app

# Copiamos todo el contenido del proyecto
COPY . .

# Instalamos las dependencias del proyecto
RUN npm install

# Compilamos el proyecto con Vite
RUN npm run build

# Instalamos el servidor HTTP simple
RUN npm install -g http-server

# Exponemos el puerto
EXPOSE 3000

# Ejecutamos el servidor de producción desde la carpeta dist
CMD ["http-server", "dist", "-p", "3000"]
