import { useEffect, useState } from "react";
import "./Home.css"; // Importamos los estilos

const messages = [
  "Eres mi razón favorita para sonreír 💖",
  "Eres mi vida 💕",
  "Adjuntar archivos es fácil, como adjuntar mi corazón al tuyo 💞",
  "Te amo más de lo que las palabras pueden expresar. 🥰",
  "Nuestro amor es como un PDF, compacto pero lleno de contenido hermoso 📜💘",
  "Si nuestro amor fuera un archivo, nunca necesitaría compresión, ya es perfecto ❤️",
  "Volvemos posible lo imposible y los miedos un reto ❤️",
  "Tu sonrisa precede la mía 🥰",
  "Que mi corazón sea tu hogar. 💖",
  "Soy eterno contigo 💞",
];

function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    setMessage(messages[randomIndex]);
  }, []);

  return (
    <div className="home-container">
      <h1>Bienvenido a PDF Merger</h1>
      <p className="love-message">{message}</p>
      <div className="buttons">
        <a href="/merge" className="btn">Unir PDFs</a>
        <a href="/attach" className="btn">Adjuntar PDF</a>
        <a href="/split" className="btn">Dividir PDF</a>
      </div>
    </div>
  );
}

export default Home;

