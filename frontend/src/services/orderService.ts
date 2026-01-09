import axios from 'axios';
import type { OrderBookResponse, ModifyOrderRequest } from '../types/order';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export const orderService = {
    // Fetch Order Book
    getOrderBook: async (days: number = 3): Promise<OrderBookResponse> => {
        const response = await axios.get(`${API_URL}/orders/order-book?days=${days}`);
        return response.data;
    },

    // Modify Order
    modifyOrder: async (request: ModifyOrderRequest): Promise<any> => {
        const response = await axios.post(`${API_URL}/orders/modify`, request);
        return response.data;
    },

    // Cancel Order
    cancelOrder: async (orderId: string): Promise<any> => {
        const response = await axios.delete(`${API_URL}/orders/${orderId}`);
        return response.data;
    }
};
