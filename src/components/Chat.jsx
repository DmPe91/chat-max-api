import { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  receiveNotification,
  deleteNotification,
} from "../services/greenApi";

// Форматирование Unix-времени (секунды) в ЧЧ:ММ
function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function Chat({ credentials, onLogout }) {
  const { idInstance, apiTokenInstance } = credentials;

  const [phone, setPhone] = useState("");
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  // Автопрокрутка вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Создать новый чат
  const handleCreateChat = (e) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setError("Введите корректный номер");
      return;
    }
    setChatId(`${cleaned}@c.us`);
    setMessages([]);
    setError("");
  };

  // Отправить сообщение
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

    const text = input.trim();
    setInput("");
    setLoading(true);
    setError("");

    // Оптимистично добавляем сообщение в UI
    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text,
        type: "outgoing",
        status: "sending",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ]);

    try {
      const result = await sendMessage(
        idInstance,
        apiTokenInstance,
        chatId,
        text,
      );

      // Обновляем статус сообщения
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, id: result.idMessage, status: "sent" } : m,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Не удалось отправить сообщение");
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m)),
      );
    } finally {
      setLoading(false);
    }
  };

  // Опрос входящих сообщений
  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;

    const poll = async () => {
      try {
        const notification = await receiveNotification(
          idInstance,
          apiTokenInstance,
        );

        if (notification && isMounted) {
          const { body, receiptId } = notification;

          // Обрабатываем ТОЛЬКО входящие сообщения
          if (body.typeWebhook === "incomingMessageReceived") {
            const textMessage =
              body.messageData?.textMessageData?.textMessage ||
              body.messageData?.extendedTextMessageData?.text;

            if (textMessage) {
              setMessages((prev) => [
                ...prev,
                {
                  id: body.idMessage,
                  text: textMessage,
                  type: "incoming",
                  senderName: body.senderData?.senderName || "Неизвестный",
                  timestamp: body.timestamp,
                },
              ]);
            }
          }

          // Удаляем уведомление из очереди
          try {
            await deleteNotification(idInstance, apiTokenInstance, receiptId);
          } catch (err) {
            console.error("Ошибка удаления уведомления:", err);
          }
        }
      } catch (err) {
        console.error("Ошибка опроса:", err);
      }

      // Повторяем через 2 секунды
      if (isMounted) {
        setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      isMounted = false;
    };
  }, [chatId, idInstance, apiTokenInstance]);

  return (
    <div className="chat">
      <header className="chat__header">
        <h1 className="chat__title">GREEN-API Chat</h1>
        <button className="chat__logout" onClick={onLogout}>
          Выйти
        </button>
      </header>

      {!chatId ? (
        <div className="chat__create">
          <form className="chat__create-form" onSubmit={handleCreateChat}>
            <h2 className="chat__create-title">Новый чат</h2>
            <p className="chat__create-text">
              Введите номер получателя в формате 79991234567
            </p>
            <input
              className="chat__create-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="79991234567"
              required
            />
            <button className="chat__create-submit" type="submit">
              Создать чат
            </button>
            {error && <p className="chat__error">{error}</p>}
          </form>
        </div>
      ) : (
        <>
          <div className="chat__messages">
            {messages.length === 0 && (
              <p className="chat__empty">Сообщений пока нет</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`message message--${msg.type}`}>
                {msg.type === "incoming" && msg.senderName && (
                  <span className="message__sender">{msg.senderName}</span>
                )}
                <div className="message__text">{msg.text}</div>
                <div className="message__meta">
                  {msg.timestamp && (
                    <span className="message__time">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                  {msg.type === "outgoing" && (
                    <span className="message__status">
                      {msg.status === "sending" && "⏳"}
                      {msg.status === "sent" && "✓"}
                      {msg.status === "error" && "✗"}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat__input-form" onSubmit={handleSend}>
            <input
              className="chat__input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Введите сообщение..."
              disabled={loading}
            />
            <button
              className="chat__send"
              type="submit"
              disabled={loading || !input.trim()}
            >
              Отправить
            </button>
          </form>
        </>
      )}
    </div>
  );
}
