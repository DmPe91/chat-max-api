import { useState } from "react";

export default function Login({ onLogin }) {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!idInstance.trim() || !apiTokenInstance.trim()) {
      alert("Заполните оба поля");
      return;
    }

    onLogin(idInstance.trim(), apiTokenInstance.trim());
  };

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__logo">
          <span className="login__logo-icon">◎</span>
          <span className="login__logo-text">MAX</span>
        </div>

        <h1 className="login__title">Введите данные GREEN-API</h1>
        <p className="login__subtitle">
          idInstance и apiTokenInstance из личного кабинета
        </p>

        <form className="login__form" onSubmit={handleSubmit}>
          <div className="login__field">
            <input
              className="login__input"
              type="text"
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              placeholder="idInstance"
              required
            />
          </div>

          <div className="login__field">
            <input
              className="login__input"
              type="text"
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              placeholder="apiTokenInstance"
              required
            />
          </div>

          <button className="login__submit" type="submit">
            Продолжить
          </button>
        </form>

        <p className="login__footer">
          Нажимая «Продолжить», вы принимаете условия использования
        </p>
      </div>
    </div>
  );
}
