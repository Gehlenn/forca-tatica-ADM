const API_BASE = '/api';

export const api = {
  async get(collection: string) {
    const res = await fetch(`${API_BASE}/${collection}`);
    return res.json();
  },
  async post(collection: string, data: any) {
    const res = await fetch(`${API_BASE}/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async delete(collection: string, id: string) {
    const res = await fetch(`${API_BASE}/${collection}/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }
};
