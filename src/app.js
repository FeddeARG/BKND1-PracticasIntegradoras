import express, { json, urlencoded } from 'express';
import configureProductsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import handlebars from 'express-handlebars';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import viewsRouter from './routes/views.router.js';
import userRouter from './routes/user.router.js';
import __dirname from './utils/utils.js';
import mongoose from 'mongoose';

const app = express();
const PORT = 8080;

mongoose.connect("mongodb+srv://federicoanaranjo:KK68V0QwuBOSRNZd@clusterch.qyaerdl.mongodb.net/?retryWrites=true&w=majority&appName=ClusterCH")
  .then(() => {
    console.log("DDBB connect");
  })
  .catch(error => {
    console.error("Connection error", error);
  });

// Middlewares para parseo
app.use(json());
app.use(urlencoded({ extended: true }));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Handlebars
app.engine('handlebars', handlebars.engine());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// Crear servidor HTTP
const httpServer = http.createServer(app);

// Configurar Socket.IO
const socketServer = new Server(httpServer);

socketServer.on('connection', socket => {
  console.log("Nuevo cliente conectado");

  socket.on('info', data => {
    console.log(`la data nueva es ${data}`);
  });

  socket.on('productData', data => {
    console.log('Product data received:', data);
    socketServer.emit('productData', data); // Emitir el evento a todos los clientes
  });

  socket.on('removeProduct', data => {
    console.log('Remove product:', data);
    socketServer.emit('productRemoved', data); // Notificar a todos los clientes que el producto ha sido eliminado
  });
});

// Routers
app.use("/api/carts", cartsRouter);
app.use("/api/products", configureProductsRouter(socketServer));
app.use("/api/users", userRouter);  // Usar el router de usuarios
app.use("/", viewsRouter);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});