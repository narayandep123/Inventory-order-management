const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatApiError(payload) {
  if (!payload) {
    return "Request failed";
  }

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload.detail)) {
    const messages = payload.detail.map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      const field = Array.isArray(entry?.loc) ? entry.loc.slice(1).join(".") : "field";
      const msg = entry?.msg || "Invalid value";
      return `${field}: ${msg}`;
    });
    return messages.join(" | ");
  }

  if (payload.detail && typeof payload.detail === "object") {
    return JSON.stringify(payload.detail);
  }

  return "Request failed";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const payload = await response.json();
      detail = formatApiError(payload);
    } catch {
      // Keep default detail for non-JSON responses.
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getDashboardSummary: () => request("/dashboard/summary"),
  getProducts: () => request("/products"),
  createProduct: (body) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  updateProduct: (id, body) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: "DELETE"
    }),

  getCustomers: () => request("/customers"),
  createCustomer: (body) =>
    request("/customers", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  deleteCustomer: (id) =>
    request(`/customers/${id}`, {
      method: "DELETE"
    }),

  getOrders: () => request("/orders"),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (body) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  deleteOrder: (id) =>
    request(`/orders/${id}`, {
      method: "DELETE"
    })
};
