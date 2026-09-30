import { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  receiveNotification,
  deleteNotification,
} from "../services/greenApi";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function normalizePhone(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  return digits.slice(-10);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

    const text = input.trim();
    setInput("");
    setLoading(true);
    setError("");

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

  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;
    const currentPhone = normalizePhone(chatId);

    const poll = async () => {
      try {
        const notification = await receiveNotification(
          idInstance,
          apiTokenInstance,
        );

        if (notification && isMounted) {
          const { body, receiptId } = notification;

          if (body.typeWebhook === "incomingMessageReceived") {
            const textMessage =
              body.messageData?.textMessageData?.textMessage ||
              body.messageData?.extendedTextMessageData?.text;

            const senderPhone = normalizePhone(
              body.senderData?.senderPhoneNumber,
            );

            if (textMessage && senderPhone === currentPhone) {
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

          try {
            await deleteNotification(idInstance, apiTokenInstance, receiptId);
          } catch (err) {
            console.error("Ошибка удаления уведомления:", err);
          }
        }
      } catch (err) {
        console.error("Ошибка опроса:", err);
      }

      if (isMounted) {
        setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      isMounted = false;
    };
  }, [chatId, idInstance, apiTokenInstance]);

  // Имя собеседника (из первого входящего или из номера)
  const contactName =
    messages.find((m) => m.type === "incoming")?.senderName ||
    phone ||
    "Новый чат";

  return (
    <div className="chat">
      {/* Шапка чата */}
      <header className="chat__header">
        {chatId ? (
          <>
            <button className="chat__back" onClick={() => setChatId("")}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="chat__avatar">
              {contactName.charAt(0).toUpperCase()}
            </div>

            <div className="chat__info">
              <div className="chat__name">{contactName}</div>
              <div className="chat__status">был(а) недавно</div>
            </div>

            <div className="chat__actions">
              <button className="chat__action" aria-label="Позвонить">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button className="chat__action" aria-label="Поиск">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="chat__logo">
              <span className="chat__logo-icon">◎</span>
              <span className="chat__logo-text">MAX</span>
            </div>
            <button className="chat__logout" onClick={onLogout}>
              Выйти
            </button>
          </>
        )}
      </header>

      {/* Контент */}
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
            <div className="chat__date">Сегодня</div>

            {messages.length === 0 && (
              <p className="chat__empty">Сообщений пока нет</p>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`message message--${msg.type}`}>
                <div className="message__text">{msg.text}</div>
                <div className="message__meta">
                  <span className="message__time">
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.type === "outgoing" && (
                    <span className="message__status">
                      {msg.status === "sending" && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      )}
                      {msg.status === "sent" && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {msg.status === "error" && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat__input-form" onSubmit={handleSend}>
            <button
              className="chat__attach"
              type="button"
              aria-label="Прикрепить"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <input
              className="chat__input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Сообщение"
              disabled={loading}
            />

            <button className="chat__action" type="button" aria-label="Смайлы">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M8 14s1.5 2 4 2 4-2 4-2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="9" cy="9" r="1" fill="currentColor" />
                <circle cx="15" cy="9" r="1" fill="currentColor" />
              </svg>
            </button>

            <button
              className="chat__send"
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Отправить"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}
