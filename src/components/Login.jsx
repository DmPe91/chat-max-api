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
      <form className="login__form" onSubmit={handleSubmit}>
        <h1 className="login__title">GREEN-API Chat</h1>
        <p className="login__subtitle">
          Введите данные из личного кабинета GREEN-API
        </p>

        <div className="login__field">
          <label className="login__label" htmlFor="idInstance">
            idInstance
          </label>
          <input
            className="login__input"
            id="idInstance"
            type="text"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="1101000000"
            required
          />
        </div>

        <div className="login__field">
          <label className="login__label" htmlFor="apiTokenInstance">
            apiTokenInstance
          </label>
          <input
            className="login__input"
            id="apiTokenInstance"
            type="text"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="Вставьте токен"
            required
          />
        </div>

        <button className="login__submit" type="submit">
          Войти
        </button>
      </form>
    </div>
  );
}
