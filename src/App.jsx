import { useState } from 'react';

export default function App() {
    const [mensaje, setMensaje] = useState('Bienvenido a mi página web.');

    function saludar() {
        setMensaje('¡Hola! Gracias por visitar mi página web.');
    }

    return (
        <>
            <header>
                <h1>Mi página web</h1>
            </header>

            <main>
                <p id="mensaje" aria-live="polite">{mensaje}</p>
                <button id="boton-saludar" type="button" onClick={saludar}>
                    Saludar
                </button>
            </main>

            <footer>
                <p>Mi página web</p>
            </footer>
        </>
    );
}
