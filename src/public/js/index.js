const socket = io();

document.getElementById('productForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(product => {
        console.log('Product added:', product);
        addProductToList(product);
    })
    .catch(err => console.error('Error adding product:', err));

    event.target.reset();
});

function addProductToList(product) {
    const productList = document.getElementById('products');
    const productItem = document.createElement('div');
    productItem.className = 'col-md-4';
    productItem.id = `product-${product._id}`;
    productItem.innerHTML = `
        <div class="card mb-4 shadow-sm">
            <div class="card-body">
                <h5 class="card-title">${product.title}</h5>
                <p class="card-text"><strong>Code:</strong> ${product.code}</p>
                <p class="card-text"><strong>Description:</strong>${product.description}</p>
                <p class="card-text"><strong>Price:</strong> $${product.price}</p>
                <p class="card-text"><strong>Stock:</strong> <span id="stock-${product._id}">${product.stock}</span></p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <button class="btn btn-sm btn-primary" onclick="viewDetails('${product._id}')">See more</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmRemoveProduct('${product._id}')">Erase product</button>
                        <button class="btn btn-sm btn-success" onclick="promptAddToCart('${product._id}')">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>`;
    productList.appendChild(productItem);
}

function updateProductStock(productId, newStock) {
    const stockElement = document.getElementById(`stock-${productId}`);
    if (stockElement) {
        stockElement.textContent = newStock;
    }
}

function updateCartList(cart) {
    const cartList = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart');
    cartList.innerHTML = ''; // Limpiar lista de carritos

    if (!cart || !cart.products || cart.products.length === 0) {
        emptyCartMessage.style.display = 'block';
    } else {
        emptyCartMessage.style.display = 'none';
        cart.products.forEach(item => {
            const cartItem = document.createElement('li');
            cartItem.className = 'list-group-item';
            cartItem.id = `cart-${item.product._id}`;
            cartItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Title:</strong> ${item.product.title} <br>
                        <strong>Quantity:</strong> <span id="cart-quantity-${item.product._id}">${item.quantity}</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-danger" onclick="promptRemoveFromCart('${item.product._id}')">Remove</button>
                    </div>
                </div>`;
            cartList.appendChild(cartItem);
        });
    }
}

function updateCartQuantity(productId, newQuantity) {
    const quantityElement = document.getElementById(`cart-quantity-${productId}`);
    if (quantityElement) {
        quantityElement.textContent = newQuantity;
    }
}

function promptAddToCart(productId) {
    Swal.fire({
        title: 'Enter the quantity to add',
        input: 'number',
        inputAttributes: {
            min: 1
        },
        showCancelButton: true,
        confirmButtonText: 'Add to Cart',
        preConfirm: (quantity) => {
            return addToCart(productId, parseInt(quantity, 10));
        }
    });
}

function promptRemoveFromCart(productId) {
    Swal.fire({
        title: 'Enter the quantity to remove',
        input: 'number',
        inputAttributes: {
            min: 1
        },
        showCancelButton: true,
        confirmButtonText: 'Remove from Cart',
        preConfirm: (quantity) => {
            return removeFromCart(productId, parseInt(quantity, 10));
        }
    });
}

function confirmRemoveProduct(productId) {
    Swal.fire({
        title: 'You are going to erase the selected product from the DDBB, is that correct?',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'No, keep it'
    }).then((result) => {
        if (result.isConfirmed) {
            removeProduct(productId);
        }
    });
}

function addToCart(productId, quantity) {
    fetch(`/api/carts/add/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(response => response.json())
    .then(cart => {
        console.log('Product added to cart:', cart);
    })
    .catch(err => console.error('Error adding product to cart:', err));
}

function viewDetails(productId) {
    window.location.href = `/api/products/details/${productId}`;
}

function removeProduct(id) {
    fetch(`/api/products/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        console.log('Product removed:', result);
        const productItem = document.getElementById(`product-${id}`);
        if (productItem) {
            productItem.remove();
        }
        socket.emit('cartUpdated');
    })
    .catch(err => console.error('Error removing product:', err));
}

function removeFromCart(productId, quantity) {
    fetch(`/api/carts/remove/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(response => response.json())
    .then(cart => {
        console.log('Product removed from cart:', cart);
    })
    .catch(err => console.error('Error removing product from cart:', err));
}

function clearCart() {
    fetch('/api/carts/clear', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(cart => {
        console.log('Cart cleared:', cart);
        updateCartList(cart);
    })
    .catch(err => console.error('Error clearing cart:', err));
}

socket.on('productRemoved', (data) => {
    const productItem = document.getElementById(`product-${data.id}`);
    if (productItem) {
        productItem.remove();
    }
});

socket.on('productData', (data) => {
    addProductToList(data);
});

socket.on('productUpdated', (product) => {
    updateProductStock(product._id, product.stock);
});

socket.on('cartUpdated', (cart) => {
    updateCartList(cart);
});

socket.on('cartCleared', () => {
    clearCartUI();
});

function clearCartUI() {
    const cartList = document.getElementById('cart-items');
    cartList.innerHTML = ''; // Limpiar lista de carritos
    const emptyCartMessage = document.getElementById('empty-cart');
    emptyCartMessage.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/products')
        .then(response => response.json())
        .then(response => {
            if (response.status === 'success') {
                response.payload.forEach(product => addProductToList(product));
            } else {
                console.error('Error fetching products:', response.msg);
            }
        })
        .catch(err => console.error('Error fetching products:', err));

    fetch('/api/carts')
        .then(response => response.json())
        .then(cart => {
            if (cart) {
                updateCartList(cart);
            } else {
                updateCartList({ products: [] });
            }
        })
        .catch(err => console.error('Error fetching cart:', err));
});