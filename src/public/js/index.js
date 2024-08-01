const socket = io();

document
  .getElementById("productForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    // Emitir los datos del formulario a través del socket
    socket.emit("productData", data);

    // Limpiar el formulario después de enviarlo
    event.target.reset();
  });

function addProductToList(product) {
  const productList = document.getElementById("products");
  const productItem = document.createElement("li");
  productItem.id = `product-${product._id}`;
  productItem.innerHTML = `ID: ${product._id}, Title: ${product.title}, Description: ${product.description}, Code: ${product.code}, Price: ${product.price}, Stock: ${product.stock} 
                             <button onclick="viewDetails('${product._id}')">Ver Detalles</button>
                             <button onclick="removeProduct('${product._id}')">Eliminar</button>`;
  productList.appendChild(productItem);
}

function viewDetails(productId) {
  window.location.href = `/api/products/details/${productId}`;
}

function removeProduct(id) {
  // Emitir el evento de eliminación a través del socket
  socket.emit("removeProduct", { id });
}

socket.on("productRemoved", (data) => {
  // Eliminar el producto del DOM si se ha eliminado del servidor
  const productItem = document.getElementById(`product-${data.id}`);
  if (productItem) {
    productItem.remove();
  }
});

socket.on("productData", (data) => {
  // Añadir el producto al DOM cuando se recibe desde el servidor
  addProductToList(data);
});

// Cargar productos existentes cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/products")
    .then((response) => response.json())
    .then((products) => {
      products.forEach((product) => addProductToList(product));
    })
    .catch((err) => console.error("Error fetching products:", err));
});
