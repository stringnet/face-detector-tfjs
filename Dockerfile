# Usamos Node con todas las herramientas necesarias
FROM node:20-alpine

# Creamos el directorio de trabajo
WORKDIR /app

# Copiamos todo el contenido del proyecto
COPY . .

# Instalamos las dependencias
RUN npm install

# Compilamos el proyecto con Vite
RUN npm run build

# Instalamos el servidor para producción
RUN npm install -g serve

# Exponemos el puerto
EXPOSE 3000

# Ejecutamos el servidor de producción con configuración CSP personalizada
CMD ["serve", "-s", "dist", "-l", "3000", "--config", "serve.json"]
