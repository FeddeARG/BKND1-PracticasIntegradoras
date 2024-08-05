import { Router } from "express";
import cartModel from '../models/cart.model.js';
import productModel from '../models/product.model.js';

const router = Router();

router.post('/add/:pid', async (req, res) => {
    const productId = req.params.pid;

    try {
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        if (product.stock <= 0) {
            return res.status(400).json({ msg: 'Product out of stock' });
        }

        let cart = await cartModel.findOne();
        if (!cart) {
            cart = new cartModel({ products: [] });
        }

        const productInCart = cart.products.find(p => p.product.toString() === productId);
        if (productInCart) {
            productInCart.quantity += 1;
        } else {
            cart.products.push({ product: productId, quantity: 1 });
        }

        product.stock -= 1;
        await product.save();
        await cart.save();

        // Emitir evento para actualizar el stock y el carrito en todos los clientes
        req.app.get('io').emit('productUpdated', product);
        req.app.get('io').emit('cartUpdated', await cartModel.findOne().populate('products.product').exec());

        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const cart = await cartModel.findOne().populate('products.product');
        if (!cart) {
            return res.status(200).json({ products: [] });
        }
        res.json(cart.toObject());
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

router.post('/remove/:pid', async (req, res) => {
    const productId = req.params.pid;

    try {
        let cart = await cartModel.findOne();
        if (!cart) {
            return res.status(404).json({ msg: 'Cart not found' });
        }

        const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ msg: 'Product not found in cart' });
        }

        const productInCart = cart.products[productIndex];
        productInCart.quantity -= 1;

        const product = await productModel.findById(productId);
        if (product) {
            product.stock += 1;
            await product.save();
        }

        if (productInCart.quantity <= 0) {
            cart.products.splice(productIndex, 1);
        }

        await cart.save();

        // Emitir evento para actualizar el stock y el carrito en todos los clientes
        req.app.get('io').emit('productUpdated', product);
        req.app.get('io').emit('cartUpdated', await cartModel.findOne().populate('products.product').exec());

        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

export default router;