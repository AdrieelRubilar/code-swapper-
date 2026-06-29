# Registro de Prompts de IA — Code Swapper

Este documento registra cómo se usó IA (Claude y Antigravity) durante el desarrollo del proyecto, qué se le pidió en cada etapa y qué decisiones de diseño/arquitectura surgieron de esa interacción.

## 1. Identificación de componentes, props y estado (3.1.1)

El componente principal `App.js` se organiza en:

- **Estado** (`useState`): lenguaje de origen/destino, código de origen/destino, tema visual, modo claro/oscuro, estado de carga, historial de traducciones, errores.
- **Componentes hijos con props**: `LineNumberGutter` (recibe `content` y `gutterRef` para numerar líneas sincronizadas con el scroll del editor) y `LanguageBadge` (recibe `langId` para mostrar el sello visual del lenguaje activo).
- **Lógica derivada**: funciones como `countLines` y los handlers (`handleTranslate`, `handleSwapLanguages`, `handleCopyToClipboard`) que actualizan el estado en respuesta a eventos del usuario.

**Prompt usado (resumen):** se le pidió a la IA que identificara y separara responsabilidades claras entre estado global de la app, sub-componentes presentacionales puros (gutter de líneas, badge de lenguaje) y handlers de eventos, evitando lógica de negocio mezclada directamente en el JSX.

## 2. Buenas prácticas de seguridad en componentes (3.1.2)

Se solicitó a la IA revisar:
- Validación de longitud máxima en el input del editor de código, para evitar que una entrada desmedida afecte el rendimiento del navegador.
- Revisión de si el contenido ingresado por el usuario se renderiza en algún punto como HTML (riesgo de XSS). Dado que todo el código ingresado se muestra dentro de elementos `<textarea>` y `<pre>` como texto plano (nunca con `dangerouslySetInnerHTML` ni inserción directa en el DOM), no existe superficie de ataque de inyección HTML en este proyecto — se documentó esta decisión directamente en el código.
- Manejo seguro de `localStorage` (ver punto 3 abajo): toda lectura/escritura está envuelta en `try/catch` para evitar que un fallo de almacenamiento (cuota excedida, navegador en modo privado) rompa la aplicación.

## 3. CRUD con Local Storage (3.1.3)

El historial de traducciones se migró de estado en memoria (`useState`, se perdía al recargar la página) a persistencia real en `localStorage`, bajo la clave `code-swapper-historial`.

**Prompt usado (resumen):** se le pidió a la IA implementar las 4 operaciones CRUD sobre ese historial:
- **Crear**: cada traducción exitosa se agrega y persiste automáticamente.
- **Leer**: al montar la app, el historial se recupera desde `localStorage` y se muestra en el panel correspondiente.
- **Actualizar**: se agregó la posibilidad de editar/etiquetar una entrada existente del historial.
- **Eliminar**: se agregó un botón de eliminación individual por entrada, además de la opción de limpiar todo el historial.

Se solicitó explícitamente manejo de errores con `try/catch` alrededor de `localStorage.getItem`/`setItem`, validación de que el dato sea serializable antes de guardarlo, y un límite máximo de entradas para evitar saturar el almacenamiento del navegador.

## 4. Consumo de API externa con Fetch y manejo de errores (3.1.4)

Se integró una llamada a una API pública externa (vía `fetch`) que se dispara al seleccionar un lenguaje de destino, mostrando información contextual relacionada con ese lenguaje.

**Prompt usado (resumen):** se le pidió a la IA que implementara esta llamada con:
- Estado de **loading** explícito mientras se espera la respuesta.
- Manejo de **errores** con `try/catch`, mostrando un mensaje claro en la interfaz si la API falla (timeout, error de red, límite de uso) en vez de fallar silenciosamente en consola.
- Que esta función fuera **aislada**: si la llamada a la API falla, no debe afectar ni bloquear el flujo principal de traducción de código, que es independiente de esta funcionalidad.

## 5. Diseño visual

Se rediseñó la interfaz completa para evitar la estética genérica de "demo de IA" (gradientes cian-violeta, glow neón) por un sistema visual propio con tipografía serif/mono y paleta personalizada, agregando además un tema con los colores magenta/amarillo requeridos por la rúbrica, seleccionable junto a los demás temas disponibles.

## 6. Motor de traducción y validación sintáctica

El núcleo del proyecto — el transpilador entre los 10 lenguajes soportados — se desarrolló iterativamente con IA, incluyendo:
- Diseño de un parser que reconoce la profundidad real de bloques anidados (indentación física en Python, conteo de llaves en lenguajes C-like, `def/end` en Ruby), en vez de procesar cada línea de forma aislada.
- Reglas de validación léxica por lenguaje de origen, para rechazar con un mensaje de error claro código que no corresponde al lenguaje seleccionado, en vez de traducirlo de forma incorrecta.
- Auto-indentación en el editor de Python: al presionar Enter después de una línea que termina en `:`, se inserta automáticamente el siguiente nivel de sangría.

Cada una de estas decisiones fue validada con pruebas funcionales ejecutadas durante el desarrollo (casos con anidación múltiple, errores de sangría inconsistente, llaves desbalanceadas, y traducciones cruzadas entre distintos pares de lenguajes) antes de integrarse a la interfaz final.

## 7. Verificación de cumplimiento

- Local Storage CRUD: confirmado en DevTools → Application → Local Storage,
  clave `code-swapper-historial`. Historial persiste tras recargar la página.
  Funciones de editar nota y borrar entrada individual verificadas en la UI.
- Consumo de API: confirmado en DevTools → Network, petición a
  api.github.com/search/repositories visible al cambiar lenguaje destino,
  con estado de carga y manejo de error probado.
- Tema magenta/amarillo: disponible y seleccionable en el dropdown de temas.