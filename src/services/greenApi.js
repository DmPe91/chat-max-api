import axios from "axios";

// Базовый URL GREEN-API
const API_URL = "https://api.green-api.com";

/**
 * Создает экземпляр axios с базовым URL и credentials
 */
function createClient(idInstance, apiTokenInstance) {
  return axios.create({
    baseURL: `${API_URL}/waInstance${idInstance}`,
  });
}

/**
 * Отправка текстового сообщения
 * @param {string} idInstance
 * @param {string} apiTokenInstance
 * @param {string} chatId - номер в формате 79991234567@c.us
 * @param {string} message - текст сообщения
 */
export async function sendMessage(
  idInstance,
  apiTokenInstance,
  chatId,
  message,
) {
  const client = createClient(idInstance, apiTokenInstance);
  const response = await client.post(
    `/sendMessage/${apiTokenInstance}`,
    { chatId, message },
    { headers: { "Content-Type": "application/json" } },
  );
  return response.data;
}

/**
 * Получение входящих уведомлений (сообщений)
 * @returns {object|null} - уведомление или null, если очередь пуста
 */
export async function receiveNotification(idInstance, apiTokenInstance) {
  const client = createClient(idInstance, apiTokenInstance);
  const response = await client.get(`/receiveNotification/${apiTokenInstance}`);
  if (!response.data) return null;
  return response.data;
}

/**
 * Удаление уведомления из очереди (обязательно после обработки)
 * @param {string} receiptId - ID уведомления
 */
export async function deleteNotification(
  idInstance,
  apiTokenInstance,
  receiptId,
) {
  const client = createClient(idInstance, apiTokenInstance);
  await client.delete(`/deleteNotification/${apiTokenInstance}/${receiptId}`);
}
