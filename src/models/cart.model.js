import mongoose from 'mongoose';

const cartCollection = "carritos";

const cartSchema = new mongoose.Schema({
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'productos' },
        quantity: { type: Number, required: true }
    }]
});

const cartModel = mongoose.model(cartCollection, cartSchema);

export default cartModel;