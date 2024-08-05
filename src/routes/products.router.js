import { Router } from "express";
import productModel from '../models/product.model.js';
import cartModel from '../models/cart.model.js';

const router = Router();

router.get('/', async (req, res) => {
    const { limit = 10, page = 1, sort, query } = req.query;
    
    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page);
    const sortOption = sort === 'asc' ? { price: 1 } : sort === 'desc' ? { price: -1 } : {};
    const filter = {};

    if (query) {
        if (query === 'available') {
            filter.status = true;
        } else {
            filter.category = query;
        }
    }

    try {
        const products = await productModel.find(filter)
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort(sortOption);

        const totalProducts = await productModel.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limitNumber);
        const hasPrevPage = pageNumber > 1;
        const hasNextPage = pageNumber < totalPages;
        const prevPage = hasPrevPage ? pageNumber - 1 : null;
        const nextPage = hasNextPage ? pageNumber + 1 : null;
        const baseUrl = req.protocol + '://' + req.get('host') + req.path;
        
        res.status(200).json({
            status: 'success',
            payload: products,
            totalPages,
            prevPage,
            nextPage,
            page: pageNumber,
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? `${baseUrl}?page=${prevPage}&limit=${limitNumber}&sort=${sort}&query=${query}` : null,
            nextLink: hasNextPage ? `${baseUrl}?page=${nextPage}&limit=${limitNumber}&sort=${sort}&query=${query}` : null
        });
    } catch (err) {
        res.status(500).json({ status: 'error', msg: err.message });
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
                // Eliminar el producto de todos los carritos
                await cartModel.updateMany({}, { $pull: { products: { product: req.params.pid } } });
                io.emit('productRemoved', { id: req.params.pid }); // Emitir el evento a todos los clientes
                io.emit('cartUpdated'); // Emitir evento para actualizar los carritos
                res.status(200).json({ msg: `Id product: ${req.params.pid} successfully erased` });
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