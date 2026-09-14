import { api } from '@/lib/axios';

/**
 * Fetch shop items for the authenticated user.
 *
 * @param {object} [params]
 * @param {'all' | 'custom' | 'equipment' | 'streak_shield'} [params.category='all']
 * @returns {Promise<Array<object>>}
 */
export async function fetchShopItems({ category = 'all' } = {}) {
  const response = await api.get('/shop/items', {
    params: { category },
  });
  return response.data.data;
}

/**
 * Fetch a single shop item by ID.
 *
 * @param {string} itemId
 * @returns {Promise<object>}
 */
export async function fetchShopItem(itemId) {
  const response = await api.get(`/shop/items/${itemId}`);
  return response.data.data;
}

/**
 * Create a custom reward shop item.
 *
 * @param {object} data
 * @param {string} data.title
 * @param {string} [data.description]
 * @param {number} data.cost_gold
 * @param {string} [data.icon]
 * @returns {Promise<object>}
 */
export async function createShopItem(data) {
  const payload = {
    name: data.name || data.title,
    description: data.description,
    costGold: data.costGold ?? data.cost_gold,
    type: data.type || data.reward_type || 'custom',
    icon: data.icon || 'gift',
  };
  const response = await api.post('/shop/items', payload);
  return response.data.data;
}

/**
 * Update an existing custom reward shop item.
 *
 * @param {string} itemId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateShopItem(itemId, data) {
  const payload = {
    ...(data.name || data.title ? { name: data.name || data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.costGold !== undefined || data.cost_gold !== undefined
      ? { costGold: data.costGold ?? data.cost_gold }
      : {}),
    ...(data.icon ? { icon: data.icon } : {}),
  };
  const response = await api.patch(`/shop/items/${itemId}`, payload);
  return response.data.data;
}

/**
 * Archive / delete a custom reward shop item.
 *
 * @param {string} itemId
 * @returns {Promise<{ success: boolean }>}
 */
export async function archiveShopItem(itemId) {
  const response = await api.delete(`/shop/items/${itemId}`);
  return response.data.data;
}

/**
 * Buy a shop item.
 *
 * @param {string} itemId
 * @param {object} [options]
 * @param {string} [options.dailyId]
 * @returns {Promise<object>}
 */
export async function buyShopItem(itemId, { dailyId } = {}) {
  const response = await api.post(`/shop/items/${itemId}/buy`, {
    ...(dailyId ? { dailyId } : {}),
  });
  return response.data.data;
}

/**
 * Fetch the authenticated user's inventory.
 *
 * @returns {Promise<Array<object>>}
 */
export async function fetchInventory() {
  const response = await api.get('/shop/inventory');
  return response.data.data;
}
