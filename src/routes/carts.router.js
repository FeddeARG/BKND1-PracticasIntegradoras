import { Router } from "express";
import cartModel from '../models/cart.model.js';
import productModel from '../models/product.model.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const carts = await cartModel.find().populate('products.product');
        res.status(200).json(carts);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

router.get('/:cid', async (req, res) => {
    try {
        const cart = await cartModel.findById(req.params.cid).populate('products.product');
        if (cart) {
            res.status(200).json(cart);
        } else {
            res.status(404).json({ msg: 'Cart not found' });
        }
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

router.post('/', async (req, res) => {
    const { products } = req.body;
    const newCart = new cartModel({
        products: products || []
    });
    try {
        const savedCart = await newCart.save();
        res.status(201).json(savedCart);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

router.post('/:cid/product/:pid', async (req, res) => {
    try {
        const cart = await cartModel.findById(req.params.cid);
        const product = await productModel.findById(req.params.pid);
        if (!cart || !product) {
            return res.status(404).json({ msg: 'Cart or product not found' });
        }

        const productInCart = cart.products.find(p => p.product.toString() === req.params.pid);
        if (productInCart) {
            productInCart.quantity += req.body.quantity || 1;
        } else {
            cart.products.push({ product: product._id, quantity: req.body.quantity || 1 });
        }

        await cart.save();
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

router.delete('/:cid/product/:pid', async (req, res) => {
    try {
        const cart = await cartModel.findById(req.params.cid);
        if (!cart) {
            return res.status(404).json({ msg: 'Cart not found' });
        }

        cart.products = cart.products.filter(p => p.product.toString() !== req.params.pid);
        await cart.save();
        res.status(200).json({ msg: `Product removed from cart id: ${req.params.cid}` });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

export default router;