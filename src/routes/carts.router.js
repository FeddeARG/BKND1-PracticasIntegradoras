import { Router } from "express";
import cartModel from '../models/cart.model.js';
import productModel from '../models/product.model.js';

const router = Router();

// Ruta para agregar un producto al carrito
router.post('/add/:pid', async (req, res) => {
    const productId = req.params.pid;

    try {
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
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

        await cart.save();
        cart = await cartModel.findOne().populate('products.product');
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Ruta para obtener el carrito
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

// Ruta para eliminar un producto del carrito
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

        if (cart.products[productIndex].quantity > 1) {
            cart.products[productIndex].quantity -= 1;
        } else {
            cart.products.splice(productIndex, 1);
        }

        await cart.save();
        cart = await cartModel.findOne().populate('products.product');
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Ruta para vaciar el carrito
router.post('/clear', async (req, res) => {
    try {
        let cart = await cartModel.findOne();
        if (!cart) {
            return res.status(404).json({ msg: 'Cart not found' });
        }

        cart.products = [];
        await cart.save();
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

export default router;