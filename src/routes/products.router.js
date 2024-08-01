import { Router } from "express";
import productModel from '../models/product.model.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const products = await productModel.find(); // Obtener todos los productos de la colección
        res.status(200).json(products); // Enviar productos al cliente
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

router.get('/:pid', async (req, res) => {
    try {
        const product = await productModel.findById(req.params.pid);
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ msg: "Product not found" });
        }
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

const configureRouter = (io) => {
    router.get('/details/:pid', async (req, res) => {
        try {
            const product = await productModel.findById(req.params.pid);
            if (product) {
                res.render('productDetails', product.toObject());
            } else {
                res.status(404).json({ msg: "Product not found" });
            }
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    });

    router.post('/', async (req, res) => {
        const { title, description, code, price, status, stock, category, thumbnails } = req.body;
        const newProduct = new productModel({
            title, description, code, price, status: status ?? true, stock, category, thumbnails
        });

        try {
            const savedProduct = await newProduct.save();
            res.status(201).json(savedProduct);
            io.emit('productData', savedProduct); // Emitir el evento a todos los clientes
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    });

    router.put('/:pid', async (req, res) => {
        try {
            const updatedProduct = await productModel.findByIdAndUpdate(req.params.pid, req.body, { new: true });
            if (updatedProduct) {
                res.status(200).json(updatedProduct);
                io.emit('productData', updatedProduct); // Emitir el evento a todos los clientes
            } else {
                res.status(404).json({ msg: 'Product not found' });
            }
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    });

    router.delete('/:pid', async (req, res) => {
        try {
            const removedProduct = await productModel.findByIdAndDelete(req.params.pid);
            if (removedProduct) {
                res.status(200).json({ msg: `Id product: ${req.params.pid} successfuly erased` });
                io.emit('productRemoved', { id: req.params.pid }); // Emitir el evento a todos los clientes
            } else {
                res.status(404).json({ msg: 'Product not found' });
            }
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    });

    return router;
};

export default configureRouter;