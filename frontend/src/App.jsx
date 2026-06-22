import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const initialProductForm = {
  id: null,
  name: "",
  sku: "",
  price: "",
  quantity_in_stock: ""
};

const initialCustomerForm = {
  full_name: "",
  email: "",
  phone_number: ""
};

const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

function normalizePhoneNumber(rawPhoneNumber) {
  const compact = rawPhoneNumber.trim().replace(/[\s-]/g, "");

  if (compact.startsWith("91") && compact.length === 12) {
    return `+${compact}`;
  }

  return compact;
}

const createEmptyOrderLine = () => ({ product_id: "", quantity: 1 });

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [productForm, setProductForm] = useState(initialProductForm);
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);
  const [orderCustomerId, setOrderCustomerId] = useState("");
  const [orderItems, setOrderItems] = useState([createEmptyOrderLine()]);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", text: "" });

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }),
    []
  );

  async function refreshAll() {
    setLoading(true);
    try {
      const [summary, productList, customerList, orderList] = await Promise.all([
        api.getDashboardSummary(),
        api.getProducts(),
        api.getCustomers(),
        api.getOrders()
      ]);
      setDashboard(summary);
      setProducts(productList);
      setCustomers(customerList);
      setOrders(orderList);
    } catch (error) {
      setAlert({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  function setSuccess(text) {
    setAlert({ type: "success", text });
  }

  function setError(error) {
    setAlert({ type: "error", text: error.message || "Something went wrong" });
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    try {
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim(),
        price: Number(productForm.price),
        quantity_in_stock: Number(productForm.quantity_in_stock)
      };

      if (productForm.id) {
        await api.updateProduct(productForm.id, payload);
        setSuccess("Product updated.");
      } else {
        await api.createProduct(payload);
        setSuccess("Product created.");
      }
      setProductForm(initialProductForm);
      await refreshAll();
    } catch (error) {
      setError(error);
    }
  }

  async function handleProductDelete(id) {
    try {
      await api.deleteProduct(id);
      setSuccess("Product deleted.");
      await refreshAll();
    } catch (error) {
      setError(error);
    }
  }

  async function handleCustomerSubmit(event) {
    event.preventDefault();
    try {
      const normalizedPhone = normalizePhoneNumber(customerForm.phone_number);
      if (!phoneRegex.test(normalizedPhone)) {
        throw new Error("Phone number must be a valid 10-digit Indian mobile number (optional +91).");
      }

      await api.createCustomer({
        full_name: customerForm.full_name.trim(),
        email: customerForm.email.trim(),
        phone_number: normalizedPhone
      });
      setCustomerForm(initialCustomerForm);
      setSuccess("Customer created.");
      await refreshAll();
    } catch (error) {
      setError(error);
    }
  }

  async function handleCustomerDelete(id) {
    try {
      await api.deleteCustomer(id);
      setSuccess("Customer deleted.");
      await refreshAll();
    } catch (error) {
      setError(error);
    }
  }

  function updateOrderItem(index, field, value) {
    setOrderItems((prevItems) => {
      const next = [...prevItems];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addOrderLine() {
    setOrderItems((prevItems) => [...prevItems, createEmptyOrderLine()]);
  }

  function removeOrderLine(index) {
    setOrderItems((prevItems) => prevItems.filter((_, i) => i !== index));
  }

  async function handleOrderSubmit(event) {
    event.preventDefault();
    try {
      const payload = {
        customer_id: Number(orderCustomerId),
        items: orderItems.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity)
        }))
      };

      await api.createOrder(payload);
      setOrderCustomerId("");
      setOrderItems([createEmptyOrderLine()]);
      setSuccess("Order created and stock updated.");
      await refreshAll();
    } catch (error) {
      setError(error);
    }
  }

  async function handleOrderDelete(id) {
    try {
      await api.deleteOrder(id);
      setSelectedOrder(null);
      setSuccess("Order canceled and stock restored.");
      await refreshAll();
    } catch (error) {
      setError(error);
    }
  }

  async function handleSelectOrder(id) {
    try {
      const order = await api.getOrder(id);
      setSelectedOrder(order);
    } catch (error) {
      setError(error);
    }
  }

  const orderPreviewTotal = orderItems.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === Number(item.product_id));
    if (!product) {
      return sum;
    }
    return sum + Number(product.price) * Number(item.quantity || 0);
  }, 0);

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "products", label: "Products" },
    { id: "customers", label: "Customers" },
    { id: "orders", label: "Orders" }
  ];

  function renderDashboard() {
    return (
      <section className="tab-section">
        <section className="grid cards clean-cards">
          <article className="card stat-card">
            <h2>Total Products</h2>
            <strong>{dashboard.total_products}</strong>
            <small>Active catalog entries</small>
          </article>
          <article className="card stat-card">
            <h2>Total Customers</h2>
            <strong>{dashboard.total_customers}</strong>
            <small>Registered buyers</small>
          </article>
          <article className="card stat-card">
            <h2>Total Orders</h2>
            <strong>{dashboard.total_orders}</strong>
            <small>Processed transactions</small>
          </article>
          <article className="card stat-card low-stock">
            <h2>Low Stock</h2>
            <strong>{dashboard.low_stock_products.length}</strong>
            <small>Need replenishment</small>
          </article>
        </section>

        <section className="grid panels compact-panels">
          <article className="panel">
            <div className="panel-head">
              <h2>Low Stock Products</h2>
              <p>Products at or below threshold.</p>
            </div>
            {dashboard.low_stock_products.length === 0 ? (
              <p className="empty-text">All products are sufficiently stocked.</p>
            ) : (
              <ul className="item-list">
                {dashboard.low_stock_products.map((product) => (
                  <li key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <p>SKU: {product.sku}</p>
                    </div>
                    <span className="chip warning">Qty: {product.quantity_in_stock}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="panel">
            <div className="panel-head">
              <h2>Recent Orders</h2>
              <p>Latest transactions snapshot.</p>
            </div>
            {orders.length === 0 ? (
              <p className="empty-text">No orders available yet.</p>
            ) : (
              <ul className="item-list">
                {orders.slice(0, 5).map((order) => (
                  <li key={order.id}>
                    <div>
                      <strong>Order #{order.id}</strong>
                      <p>{order.customer.full_name}</p>
                    </div>
                    <span className="chip">{money.format(order.total_amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </section>
    );
  }

  function renderProducts() {
    return (
      <section className="tab-section">
        <article className="panel">
          <div className="panel-head">
            <h2>Product Management</h2>
            <p>Add, edit, and monitor inventory levels.</p>
          </div>
          <form onSubmit={handleProductSubmit} className="form-grid">
            <input
              required
              placeholder="Product name"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              required
              placeholder="SKU"
              value={productForm.sku}
              onChange={(event) => setProductForm((prev) => ({ ...prev, sku: event.target.value }))}
            />
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Price"
              value={productForm.price}
              onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
            />
            <input
              required
              type="number"
              min="0"
              step="1"
              placeholder="Quantity"
              value={productForm.quantity_in_stock}
              onChange={(event) =>
                setProductForm((prev) => ({ ...prev, quantity_in_stock: event.target.value }))
              }
            />
            <button type="submit">{productForm.id ? "Update Product" : "Add Product"}</button>
            {productForm.id ? (
              <button type="button" className="secondary" onClick={() => setProductForm(initialProductForm)}>
                Cancel Edit
              </button>
            ) : null}
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{money.format(product.price)}</td>
                    <td>{product.quantity_in_stock}</td>
                    <td>
                      <div className="actions-inline">
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...product, price: product.price.toString() })}
                        >
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => handleProductDelete(product.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    );
  }

  function renderCustomers() {
    return (
      <section className="tab-section">
        <article className="panel">
          <div className="panel-head">
            <h2>Customer Management</h2>
            <p>Track your customer base with unique profiles.</p>
          </div>
          <form onSubmit={handleCustomerSubmit} className="form-grid">
            <input
              required
              placeholder="Full name"
              value={customerForm.full_name}
              onChange={(event) =>
                setCustomerForm((prev) => ({ ...prev, full_name: event.target.value }))
              }
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={customerForm.email}
              onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              required
              type="tel"
              pattern="^(?:\\+91[\\s-]?)?[6-9]\\d{9}$"
              title="Enter a valid Indian mobile number, e.g. 9876543210 or +91 9876543210"
              placeholder="Phone number"
              value={customerForm.phone_number}
              onChange={(event) =>
                setCustomerForm((prev) => ({ ...prev, phone_number: event.target.value }))
              }
            />
            <button type="submit">Add Customer</button>
          </form>

          <ul className="item-list">
            {customers.map((customer) => (
              <li key={customer.id}>
                <div>
                  <strong>{customer.full_name}</strong>
                  <p>{customer.email}</p>
                  <p>{customer.phone_number}</p>
                </div>
                <button className="danger" onClick={() => handleCustomerDelete(customer.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>
    );
  }

  function renderOrders() {
    return (
      <section className="tab-section grid panels">
        <article className="panel">
          <div className="panel-head">
            <h2>Create Order</h2>
            <p>Build multi-line orders with instant stock checks.</p>
          </div>
          <form onSubmit={handleOrderSubmit} className="form-grid order-form">
            <select
              required
              value={orderCustomerId}
              onChange={(event) => setOrderCustomerId(event.target.value)}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} ({customer.email})
                </option>
              ))}
            </select>

            <div className="order-items-stack">
              {orderItems.map((item, index) => (
                <div key={index} className="order-row-card">
                  <p className="order-line-label">Item {index + 1}</p>
                  <div className="order-row-fields">
                    <select
                      required
                      value={item.product_id}
                      onChange={(event) => updateOrderItem(index, "product_id", event.target.value)}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku}) - stock {product.quantity_in_stock}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      min="1"
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateOrderItem(index, "quantity", event.target.value)}
                    />
                    <button
                      type="button"
                      className="danger outline"
                      onClick={() => removeOrderLine(index)}
                      disabled={orderItems.length === 1}
                      title={orderItems.length === 1 ? "At least one item is required" : "Remove this item"}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="secondary add-item-btn" onClick={addOrderLine}>
              Add Item
            </button>
            <p className="order-total">Preview Total: {money.format(orderPreviewTotal)}</p>
            <button type="submit">Create Order</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Orders</h2>
            <p>Review, inspect details, and cancel when required.</p>
          </div>
          <ul className="item-list">
            {orders.map((order) => (
              <li key={order.id}>
                <div>
                  <strong>Order #{order.id}</strong>
                  <p>Customer: {order.customer.full_name}</p>
                  <p>Total: {money.format(order.total_amount)}</p>
                </div>
                <div className="actions-inline">
                  <button onClick={() => handleSelectOrder(order.id)}>Details</button>
                  <button className="danger" onClick={() => handleOrderDelete(order.id)}>
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {selectedOrder ? (
            <div className="details-box">
              <h3>Order #{selectedOrder.id} Details</h3>
              <p>Customer: {selectedOrder.customer.full_name}</p>
              <ul>
                {selectedOrder.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name} ({item.product.sku}) x {item.quantity} @ {money.format(item.unit_price)}
                  </li>
                ))}
              </ul>
              <p>Total: {money.format(selectedOrder.total_amount)}</p>
            </div>
          ) : null}
        </article>
      </section>
    );
  }

  function renderTabContent() {
    if (activeTab === "products") {
      return renderProducts();
    }
    if (activeTab === "customers") {
      return renderCustomers();
    }
    if (activeTab === "orders") {
      return renderOrders();
    }
    return renderDashboard();
  }

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">Operations Suite</p>
          <h1>Inventory Hub</h1>
        </div>

        <nav className="tab-nav" aria-label="Primary">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "tab-link active" : "tab-link"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="content-area">
        <header className="hero clean-hero">
          <p className="eyebrow">{tabs.find((tab) => tab.id === activeTab)?.label}</p>
          <h2>Inventory & Order Control Center</h2>
          <p>Manage products, customers, and orders with a focused workflow.</p>
        </header>

        {alert.text ? <p className={`alert ${alert.type}`}>{alert.text}</p> : null}

        {renderTabContent()}

        {loading ? <p className="loading">Refreshing data...</p> : null}
      </section>
    </main>
  );
}
