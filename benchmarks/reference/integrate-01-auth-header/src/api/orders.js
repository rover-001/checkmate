import { request, buildAuthHeader } from "../http/client.js";

export async function fetchOrder(orderId, token) {
  return request(`/orders/${orderId}`, {
    headers: {
      Authorization: buildAuthHeader(token)
    }
  });
}
