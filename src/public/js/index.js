const socket = io();

document.getElementById('productForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    // Enviar los datos del formulario al servidor
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
        // Agregar el producto a la lista de productos
        addProductToList(product);
    })
    .catch(err => console.error('Error adding product:', err));

    // Limpiar el formulario después de enviarlo
    event.target.reset();
});

function addProductToList(product) {
    const productList = document.getElementById('products');
    const productItem = document.createElement('li');
    productItem.className = 'list-group-item';
    productItem.id = `product-${product._id}`;
    productItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <strong>ID:</strong> ${product._id} <br>
                <strong>Title:</strong> ${product.title} <br>
                <strong>Description:</strong> ${product.description} <br>
                <strong>Code:</strong> ${product.code} <br>
                <strong>Price:</strong> $${product.price} <br>
                <strong>Stock:</strong> ${product.stock}
            </div>
            <div>
                <button class="btn btn-primary" onclick="viewDetails('${product._id}')">Ver Detalles</button>
                <button class="btn btn-danger" onclick="removeProduct('${product._id}')">Eliminar</button>
            </div>
        </div>`;
    productList.appendChild(productItem);
}

function viewDetails(productId) {
    window.location.href = `/api/products/details/${productId}`;
}

function removeProduct(id) {
    // Emitir el evento de eliminación a través del socket
    socket.emit('removeProduct', { id });
}

socket.on('productRemoved', (data) => {
    // Eliminar el producto del DOM si se ha eliminado del servidor
    const productItem = document.getElementById(`product-${data.id}`);
    if (productItem) {
        productItem.remove();
    }
});

socket.on('productData', (data) => {
    // Añadir el producto al DOM cuando se recibe desde el servidor
    addProductToList(data);
});

// Cargar productos existentes cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            products.forEach(product => addProductToList(product));
        })
        .catch(err => console.error('Error fetching products:', err));
});