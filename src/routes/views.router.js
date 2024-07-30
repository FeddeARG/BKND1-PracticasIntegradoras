import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

router.get('/realtimeproducts', (req, res) => {
    res.render('realTimeProducts', { title: 'Real-Time Products' });
});

export default router;