# Code Swapper

Transpilador de código entre lenguajes de programación, con verificación sintáctica en tiempo real. Permite traducir un mismo programa entre 10 lenguajes distintos, preservando su estructura lógica (bloques anidados, condicionales, bucles).

## ¿Qué hace?

- Traduce código entre **JavaScript, TypeScript, Python, Go, Rust, C++, Java, Ruby, PHP y C#**.
- Valida la sintaxis del código de origen antes de traducir, detectando errores como llaves desbalanceadas o instrucciones inválidas para el lenguaje seleccionado.
- Auto-indentación en Python: al presionar Enter después de una línea que abre un bloque (`if`, `def`, `for`, etc.), el editor agrega automáticamente el siguiente nivel de sangría.
- Interfaz con modo claro/oscuro y varios temas visuales.
- Historial de las últimas traducciones realizadas en la sesión.

## Cómo usarlo

1. Selecciona el lenguaje de origen y el lenguaje de destino.
2. Escribe o pega tu código en el editor de origen.
3. Presiona **Traducir Código**.
4. Si el código es válido, verás la traducción en el panel de salida junto con un resumen del análisis. Si hay un error de sintaxis, se mostrará el motivo en vez de una traducción incorrecta.

## Stack técnico

- React (Create React App)
- [lucide-react](https://lucide.dev/) para iconografía

## Cómo correrlo localmente

```bash
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

Para generar el build de producción:

```bash
npm run build
```

## Proyecto académico

Desarrollado como proyecto para la asignatura de Frontend — Ingeniería en Informática, INACAP.
