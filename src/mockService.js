/**
 * @fileoverview Motor de Transpilación Universal — Arquitectura SOLID de 3 Capas
 * =============================================================================
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  CAPA 1: DomainLinter      — Valida coherencia sintáctica del origen   │
 *  │  CAPA 2: Lexer / Parser    — Construye el AST agnóstico al lenguaje    │
 *  │  CAPA 3: IndentationEngine — Serializa el AST al destino vía Emitter   │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  Patrones de diseño aplicados:
 *    - Strategy   : EMITTERS y LANGUAGE_SPECS encapsulan comportamiento por lenguaje
 *    - Data-driven: No hay cascadas if/else; todo se mapea desde objetos de configuración
 *    - SOLID      : Cada módulo tiene una única responsabilidad y es abierto a extensión
 *
 *  Lenguajes soportados: JavaScript, TypeScript, Python, Go, Rust, C#, PHP, Ruby, C++, Java
 */


// ═══════════════════════════════════════════════════════════════════════════════
// § 0.  LANGUAGE_SPECS — Fuente única de verdad por lenguaje
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LANGUAGE_SPECS define el contrato completo de cada lenguaje:
 *
 *  forbidden   : Array de reglas { pattern: RegExp, message: string }
 *                Cada regla tiene su propio mensaje de error específico.
 *                Al violar una, el linter retorna ESA descripción exacta.
 *
 *  blockStyle  : Cómo el lenguaje delimita bloques:
 *                  'braces'  → C-family (JavaScript, Java, C++, Go, Rust, C#, PHP, TypeScript)
 *                  'indent'  → Python (indentación de espacios)
 *                  'end'     → Ruby (def…end)
 *
 *  indentSize  : Número de espacios por nivel (usado por el parser Python)
 */
const LANGUAGE_SPECS = {

  javascript: {
    blockStyle: 'braces',
    indentSize: 2,
    forbidden: [
      {
        pattern: /\bdef\b/,
        message: "Token 'def' detectado. JavaScript declara funciones con 'function nombre() {}', arrow functions '() => {}', o métodos de clase. El keyword 'def' pertenece a Python/Ruby."
      },
      {
        pattern: /std::/,
        message: "Namespace 'std::' detectado. Este es código C++. JavaScript usa 'console.log()' para imprimir; no tiene namespaces de este tipo."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. JavaScript usa 'console.log()' para imprimir en consola."
      },
      {
        pattern: /\bfmt\.\w+/,
        message: "Paquete 'fmt' detectado. Este es código Go. JavaScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /\bfn\s+[a-zA-Z_]\w*/,
        message: "Keyword 'fn' detectado. Este es código Rust. JavaScript usa 'function nombre() {}' o arrow functions."
      },
      {
        pattern: /^\s*print\s*\(/m,
        message: "Función 'print()' detectada (sintaxis Python/PHP). JavaScript usa 'console.log()' para imprimir en consola."
      },
      {
        pattern: /\bputs\b/,
        message: "Keyword 'puts' detectado (sintaxis Ruby). JavaScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /\becho\b/,
        message: "Keyword 'echo' detectado (sintaxis PHP). JavaScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /\bConsole\.Write/,
        message: "Método 'Console.Write' detectado (sintaxis C#). JavaScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /^\s*end\s*$/m,
        message: "Token 'end' detectado como cierre de bloque (sintaxis Ruby). JavaScript usa llaves '}' para cerrar bloques."
      },
      {
        pattern: /\bfunc\b/,
        message: "Keyword 'func' detectado. Este es código Go. JavaScript usa 'function' para declarar funciones."
      },
      {
        pattern: /\$[a-zA-Z_]\w*\s*=/,
        message: "Variable con sigilo '$' detectada (estilo PHP). JavaScript declara variables con 'let', 'const' o 'var' sin el símbolo '$'."
      }
    ]
  },

  typescript: {
    blockStyle: 'braces',
    indentSize: 2,
    forbidden: [
      {
        pattern: /\bdef\b/,
        message: "Token 'def' detectado. TypeScript usa 'function nombre(param: Tipo): TipoRetorno {}' con anotaciones de tipo estático. 'def' es sintaxis de Python."
      },
      {
        pattern: /std::/,
        message: "Namespace 'std::' detectado. Este es código C++. TypeScript es un superconjunto de JavaScript y usa 'console.log()' para imprimir."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. TypeScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /\bfn\s+[a-zA-Z_]\w*/,
        message: "Keyword 'fn' detectado. Este es código Rust. TypeScript usa 'function nombre(): tipo {}' con anotaciones opcionales."
      },
      {
        pattern: /^\s*print\s*\(/m,
        message: "Función 'print()' detectada (sintaxis Python/PHP). TypeScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /\bputs\b/,
        message: "Keyword 'puts' detectado (sintaxis Ruby). TypeScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /\becho\b/,
        message: "Keyword 'echo' detectado (sintaxis PHP). TypeScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /\bConsole\.Write/,
        message: "Método 'Console.Write' detectado (sintaxis C#). TypeScript usa 'console.log()' para imprimir."
      },
      {
        pattern: /^\s*end\s*$/m,
        message: "Token 'end' detectado (sintaxis Ruby). TypeScript usa llaves '}' para cerrar bloques."
      },
      {
        pattern: /\bfunc\b/,
        message: "Keyword 'func' detectado. Este es código Go. TypeScript usa 'function' para declarar funciones."
      },
      {
        pattern: /\$[a-zA-Z_]\w*\s*=/,
        message: "Variable con sigilo '$' detectada (estilo PHP). TypeScript usa 'let/const' sin el prefijo '$'."
      },
      {
        pattern: /\bfmt\.\w+/,
        message: "Paquete 'fmt' detectado. Este es código Go. TypeScript usa 'console.log()' para imprimir."
      }
    ]
  },

  python: {
    blockStyle: 'indent',
    indentSize: 4,
    forbidden: [
      {
        pattern: /^\s*[{}]\s*$/m,
        message: "Caracter '{' o '}' detectado como delimitador de bloque. Python no usa llaves para delimitar bloques. Usa sangría de 4 espacios en su lugar. Las llaves solo son válidas en diccionarios como 'x = {\"key\": value}'."
      },
      {
        pattern: /\bfunction\b/,
        message: "Keyword 'function' detectado. Python define funciones exclusivamente con 'def nombre(params):'. La keyword 'function' pertenece a JavaScript o PHP."
      },
      {
        pattern: /\bpublic\s+static\b/,
        message: "Modificadores 'public static' detectados. Python no usa modificadores de acceso orientados a objetos. Define tu función simplemente como 'def nombre(params):'."
      },
      {
        pattern: /std::/,
        message: "Namespace 'std::' detectado. Este es código C++. Python usa 'print()' para imprimir en consola."
      },
      {
        pattern: /\bfn\s+[a-zA-Z_]\w*/,
        message: "Keyword 'fn' detectado. Este es código Rust. Python declara funciones con 'def nombre(params):'."
      },
      {
        pattern: /console\.log/,
        message: "Función 'console.log' detectada. Este es código JavaScript. Python usa 'print()' para imprimir en consola."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. Python usa 'print()' para imprimir en consola."
      },
      {
        pattern: /Console\.Write/,
        message: "Método 'Console.WriteLine' detectado (sintaxis C#). Python usa 'print()' para imprimir."
      },
      {
        pattern: /\bfmt\.\w+/,
        message: "Paquete 'fmt' detectado. Este es código Go. Python usa 'print()' para imprimir."
      },
      {
        pattern: /\becho\b/,
        message: "Keyword 'echo' detectado (sintaxis PHP). Python usa 'print()' para imprimir."
      },
      {
        pattern: /\bputs\b/,
        message: "Keyword 'puts' detectado (sintaxis Ruby). Python usa 'print()' para imprimir."
      },
      {
        pattern: /^\s*end\s*$/m,
        message: "Token 'end' detectado (sintaxis Ruby). Python usa bloques basados en indentación."
      },
      {
        pattern: /\bfunc\b/,
        message: "Keyword 'func' detectado. Este es código Go. Python declara funciones con 'def nombre(params):'."
      },
      {
        pattern: /\$[a-zA-Z_]\w*\s*=/,
        message: "Variable con sigilo '$' detectada (estilo PHP). Python no usa el prefijo '$' para variables."
      }
    ]
  },

  go: {
    blockStyle: 'braces',
    indentSize: 2,
    forbidden: [
      {
        pattern: /\bdef\b/,
        message: "Keyword 'def' detectado. Go declara funciones exclusivamente con 'func nombre(params TipoParam) TipoRetorno {}'. El keyword 'def' no existe en Go."
      },
      {
        pattern: /\bfunction\b/,
        message: "Keyword 'function' detectado. Go usa 'func', no 'function'. Ejemplo: 'func saludar(nombre string) {}'."
      },
      {
        pattern: /\bclass\b/,
        message: "Keyword 'class' detectado. Go no tiene clases OOP. Usa 'type NombreStruct struct {}' junto con métodos receptores."
      },
      {
        pattern: /std::/,
        message: "Namespace 'std::' detectado. Este es código C++. Go usa el paquete 'fmt' para imprimir (fmt.Println())."
      },
      {
        pattern: /^\s*print\s*\(/m,
        message: "Función 'print()' detectada (sintaxis Python/PHP). Go usa 'fmt.Println()' para imprimir."
      },
      {
        pattern: /console\.log/,
        message: "Función 'console.log' detectada. Este es código JavaScript. Go usa 'fmt.Println()' para imprimir."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. Go usa 'fmt.Println()' para imprimir."
      },
      {
        pattern: /Console\.Write/,
        message: "Método 'Console.WriteLine' detectado (sintaxis C#). Go usa 'fmt.Println()' para imprimir."
      },
      {
        pattern: /\becho\b/,
        message: "Keyword 'echo' detectado (sintaxis PHP). Go usa 'fmt.Println()' para imprimir."
      },
      {
        pattern: /\bputs\b/,
        message: "Keyword 'puts' detectado (sintaxis Ruby). Go usa 'fmt.Println()' para imprimir."
      },
      {
        pattern: /^\s*end\s*$/m,
        message: "Token 'end' detectado (sintaxis Ruby). Go usa llaves '{}'."
      },
      {
        pattern: /\bfn\s+[a-zA-Z_]\w*/,
        message: "Keyword 'fn' detectado. Este es código Rust. Go usa 'func' para declarar funciones."
      },
      {
        pattern: /\$[a-zA-Z_]\w*\s*=/,
        message: "Variable con sigilo '$' detectada (estilo PHP). Go no usa '$' en variables."
      }
    ]
  },

  rust: {
    blockStyle: 'braces',
    indentSize: 4,
    forbidden: [
      {
        pattern: /\bdef\b/,
        message: "Keyword 'def' detectado. Rust declara funciones con 'fn nombre(param: Tipo) -> TipoRetorno {}'. El keyword 'def' pertenece a Python."
      },
      {
        pattern: /\bfunction\b/,
        message: "Keyword 'function' detectado. Rust usa 'fn'. Ejemplo: 'fn suma(x: i32, y: i32) -> i32 {}'."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. Rust usa la macro 'println!(\"{}\", valor)' para imprimir."
      },
      {
        pattern: /console\.log/,
        message: "Función 'console.log' detectada. Este es código JavaScript. Rust usa la macro 'println!(\"{}\", valor)' para imprimir."
      },
      {
        pattern: /^\s*print\s*\(/m,
        message: "Función 'print()' detectada (sintaxis Python/PHP). Rust usa la macro 'println!()' o 'print!()' para imprimir."
      },
      {
        pattern: /Console\.Write/,
        message: "Método 'Console.WriteLine' detectado (sintaxis C#). Rust usa la macro 'println!()'."
      },
      {
        pattern: /\bfmt\.\w+/,
        message: "Paquete 'fmt' detectado. Este es código Go. Rust usa la macro 'println!()' para imprimir."
      },
      {
        pattern: /\becho\b/,
        message: "Keyword 'echo' detectado (sintaxis PHP). Rust usa 'println!()'."
      },
      {
        pattern: /\bputs\b/,
        message: "Keyword 'puts' detectado (sintaxis Ruby). Rust usa 'println!()'."
      },
      {
        pattern: /^\s*end\s*$/m,
        message: "Token 'end' detectado (sintaxis Ruby). Rust usa llaves '{}'."
      },
      {
        pattern: /\bfunc\b/,
        message: "Keyword 'func' detectado. Este es código Go. Rust declara funciones con 'fn'."
      },
      {
        pattern: /\$[a-zA-Z_]\w*\s*=/,
        message: "Variable con sigilo '$' detectada (estilo PHP). Rust no usa '$' en variables."
      }
    ]
  },

  csharp: {
    blockStyle: 'braces',
    indentSize: 4,
    forbidden: [
      {
        pattern: /\bdef\b/,
        message: "Keyword 'def' detectado. C# declara métodos con modificadores de acceso y tipo de retorno (ej: 'public void Nombre(params) {}'). El keyword 'def' pertenece a Python."
      },
      {
        pattern: /\bfunction\b/,
        message: "Keyword 'function' detectado. C# no usa 'function'. Define métodos con su tipo de retorno (ej: 'void Nombre() {}' o 'static int Calcular(int x) {}')."
      },
      {
        pattern: /console\.log/,
        message: "Función 'console.log' detectada (JavaScript). C# usa 'Console.WriteLine()' (con C mayúscula) para imprimir en consola."
      },
      {
        pattern: /std::/,
        message: "Namespace 'std::' detectado. Este es código C++. C# usa el namespace 'System' y 'Console.WriteLine()' para imprimir."
      },
      {
        pattern: /^\s*print\s*\(/m,
        message: "Función 'print()' detectada (sintaxis Python/PHP). C# usa 'Console.WriteLine()' para imprimir."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. C# usa 'Console.WriteLine()' para imprimir."
      },
      {
        pattern: /\bfmt\.\w+/,
        message: "Paquete 'fmt' detectado. Este es código Go. C# usa 'Console.WriteLine()' para imprimir."
      },
      {
        pattern: /\becho\b/,
        message: "Keyword 'echo' detectado (sintaxis PHP). C# usa 'Console.WriteLine()' para imprimir."
      },
      {
        pattern: /\bputs\b/,
        message: "Keyword 'puts' detectado (sintaxis Ruby). C# usa 'Console.WriteLine()' para imprimir."
      },
      {
        pattern: /^\s*end\s*$/m,
        message: "Token 'end' detectado (sintaxis Ruby). C# usa llaves '{}'."
      },
      {
        pattern: /\bfn\s+[a-zA-Z_]\w*/,
        message: "Keyword 'fn' detectado. Este es código Rust. C# define métodos con modificadores y tipo de retorno."
      },
      {
        pattern: /\bfunc\b/,
        message: "Keyword 'func' detectado. Este es código Go. C# define métodos con modificadores y tipo de retorno."
      },
      {
        pattern: /\$[a-zA-Z_]\w*\s*=/,
        message: "Variable con sigilo '$' detectada (estilo PHP). C# no usa '$' en variables."
      }
    ]
  },

  php: {
    blockStyle: 'braces',
    indentSize: 4,
    forbidden: [
      {
        pattern: /\bdef\b/,
        message: "Keyword 'def' detectado. PHP declara funciones con 'function nombre($params) {}'. El keyword 'def' pertenece a Python/Ruby, no a PHP."
      },
      {
        pattern: /std::/,
        message: "Namespace 'std::' detectado. Este es código C++. PHP usa 'echo' o 'print()' para imprimir y no tiene namespaces de este tipo."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. PHP usa 'echo $variable;' para imprimir en consola."
      },
      {
        pattern: /console\.log/,
        message: "Función 'console.log' detectada. Este es código JavaScript. PHP usa 'echo' para imprimir (ej: 'echo \"Hola\";')."
      },
      {
        pattern: /Console\.Write/,
        message: "Método 'Console.WriteLine' detectado (sintaxis C#). PHP usa 'echo' para imprimir."
      },
      {
        pattern: /\bfmt\.\w+/,
        message: "Paquete 'fmt' detectado. Este es código Go. PHP usa 'echo' para imprimir."
      },
      {
        pattern: /\bputs\b/,
        message: "Keyword 'puts' detectado (sintaxis Ruby). PHP usa 'echo' para imprimir."
      },
      {
        pattern: /^\s*end\s*$/m,
        message: "Token 'end' detectado (sintaxis Ruby). PHP usa llaves '{}'."
      },
      {
        pattern: /\bfn\s+[a-zA-Z_]\w*/,
        message: "Keyword 'fn' detectado. Este es código Rust. PHP declara funciones con 'function nombre($params) {}'."
      },
      {
        pattern: /\bfunc\b/,
        message: "Keyword 'func' detectado. Este es código Go. PHP declara funciones con 'function nombre($params) {}'."
      },
      {
        pattern: /^\s*(?!(?:return|if|for|while|function|class|echo|print)\b)[a-zA-Z_]\w*\s*=\s*/m,
        message: "Asignación de variable sin el sigilo '$' detectada. En PHP, todas las variables deben comenzar con '$' (ej. '$miVar = valor;')."
      }
    ]
  },

  ruby: {
    blockStyle: 'end',
    indentSize: 2,
    forbidden: [
      {
        pattern: /^\s*\{\s*$/m,
        message: "Caracter '{' detectado como delimitador de bloque. Ruby usa 'def…end' para métodos e 'if…end' para condicionales. Las llaves en Ruby solo se usan en hashes: '{key: value}'."
      },
      {
        pattern: /\bfunction\b/,
        message: "Keyword 'function' detectado. Ruby define métodos con 'def nombre(params)' y los cierra con 'end'. No existe la keyword 'function' en Ruby."
      },
      {
        pattern: /\bpublic\s+static\b/,
        message: "Modificadores 'public static' detectados. Ruby no usa modificadores de estilo Java. Para métodos de clase usa 'def self.nombre(params)' y cierra con 'end'."
      },
      {
        pattern: /std::/,
        message: "Namespace 'std::' detectado. Este es código C++. Ruby usa 'puts' o 'print' para imprimir en consola."
      },
      {
        pattern: /console\.log/,
        message: "Función 'console.log' detectada. Este es código JavaScript. Ruby usa 'puts' o 'print' para imprimir."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. Ruby usa 'puts' o 'print' para imprimir."
      },
      {
        pattern: /Console\.Write/,
        message: "Método 'Console.WriteLine' detectado (sintaxis C#). Ruby usa 'puts' o 'print' para imprimir."
      },
      {
        pattern: /\bfmt\.\w+/,
        message: "Paquete 'fmt' detectado. Este es código Go. Ruby usa 'puts' o 'print' para imprimir."
      },
      {
        pattern: /\becho\b/,
        message: "Keyword 'echo' detectado (sintaxis PHP). Ruby usa 'puts' o 'print' para imprimir."
      },
      {
        pattern: /\bfn\s+[a-zA-Z_]\w*/,
        message: "Keyword 'fn' detectado. Este es código Rust. Ruby declara funciones con 'def nombre(params)'."
      },
      {
        pattern: /\bfunc\b/,
        message: "Keyword 'func' detectado. Este es código Go. Ruby declara funciones con 'def nombre(params)'."
      },
      {
        pattern: /\$[a-zA-Z_]\w*\s*=/,
        message: "Variable con sigilo '$' detectada (estilo PHP). Ruby usa variables locales normales sin el prefijo '$'."
      }
    ]
  },

  cpp: {
    blockStyle: 'braces',
    indentSize: 4,
    forbidden: [
      {
        pattern: /\bdef\b/,
        message: "Keyword 'def' detectado. C++ declara funciones con tipo de retorno explícito (ej: 'void nombre(params) {}' o 'int calcular(int a, int b) {}'). El keyword 'def' pertenece a Python."
      },
      {
        pattern: /\bfunction\b/,
        message: "Keyword 'function' detectado. C++ no usa 'function'. Declara funciones con su tipo de retorno (ej: 'void nombre() {}' o 'auto calcular(int a) -> int {}')."
      },
      {
        pattern: /console\.log/,
        message: "Función 'console.log' detectada. Este es código JavaScript. C++ usa 'std::cout << valor << std::endl;' para imprimir en consola."
      },
      {
        pattern: /System\.out/,
        message: "Método 'System.out' detectado. Este es código Java. C++ usa 'std::cout << valor << std::endl;' para imprimir."
      },
      {
        pattern: /^\s*print\s*\(/m,
        message: "Función 'print()' detectada (sintaxis Python/PHP). C++ usa 'std::cout << valor << std::endl;' para imprimir."
      },
      {
        pattern: /Console\.Write/,
        message: "Método 'Console.WriteLine' detectado (sintaxis C#). C++ usa 'std::cout << valor << std::endl;' para imprimir."
      },
      {
        pattern: /\bfmt\.\w+/,
        message: "Paquete 'fmt' detectado. Este es código Go. C++ usa 'std::cout << valor << std::endl;' para imprimir."
      },
      {
        pattern: /\becho\b/,
        message: "Keyword 'echo' detectado (sintaxis PHP). C++ usa 'std::cout << valor << std::endl;' para imprimir."
      },
      {
        pattern: /\bputs\b/,
        message: "Keyword 'puts' detectado (sintaxis Ruby). C++ usa 'std::cout << valor << std::endl;' para imprimir."
      },
      {
        pattern: /^\s*end\s*$/m,
        message: "Token 'end' detectado (sintaxis Ruby). C++ usa llaves '{}' para cerrar bloques."
      },
      {
        pattern: /\bfn\s+[a-zA-Z_]\w*/,
        message: "Keyword 'fn' detectado. Este es código Rust. C++ declara funciones con su tipo de retorno."
      },
      {
        pattern: /\bfunc\b/,
        message: "Keyword 'func' detectado. Este es código Go. C++ declara funciones con su tipo de retorno."
      },
      {
        pattern: /\$[a-zA-Z_]\w*\s*=/,
        message: "Variable con sigilo '$' detectada (estilo PHP). C++ no usa '$' en variables."
      }
    ]
  },

  java: {
    blockStyle: 'braces',
    indentSize: 4,
    forbidden: [
      {
        pattern: /\bdef\b/,
        message: "Keyword 'def' detectado. Java declara métodos dentro de clases con modificadores y tipo de retorno (ej: 'public void nombre(params) {}'). El keyword 'def' pertenece a Python."
      },
      {
        pattern: /\bfunction\b/,
        message: "Keyword 'function' detectado. Java no usa 'function'. Los métodos se declaran con tipo de retorno dentro de una clase (ej: 'public static void nombre() {}')."
      },
      {
        pattern: /console\.log/,
        message: "Función 'console.log' detectada. Este es código JavaScript. Java usa 'System.out.println()' para imprimir en consola."
      },
      {
        // 'std::' es C++ — inválido en Java
        pattern: /std::/,
        message: "Namespace 'std::' detectado. Este es código C++. Java usa 'System.out.println()' y el package 'java.lang' para I/O básico."
      },
      {
        // 'print(' sin prefijo es Python — Java usa System.out.println
        pattern: /^\s*print\s*\(/m,
        message: "Función 'print()' detectada (sintaxis Python). Java usa 'System.out.println()' para imprimir en consola."
      }
    ]
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// § 1.  CAPA 1: DOMAIN LINTER — Validación Sintáctica por Lenguaje de Origen
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DomainLinter
 * ─────────────────────────────────────────────────────────────────────────────
 * Valida que el código fuente sea coherente con el lenguaje declarado.
 * Itera CADA LÍNEA contra CADA REGLA del lenguaje de origen.
 * En el primer match retorna el error específico de ESA regla con el número de línea.
 *
 * Retorna: { valid: true } | { valid: false, error: string }
 */
const DomainLinter = {
  /**
   * @param {string} sourceLang - Lenguaje de origen declarado ('python', 'java', etc.)
   * @param {string} code       - Código fuente completo a validar
   * @returns {{ valid: boolean, error?: string }}
   */
  validate(sourceLang, code) {
    const spec = LANGUAGE_SPECS[sourceLang];
    if (!spec) {
      return {
        valid: false,
        error: `Lenguaje de origen '${sourceLang}' no está registrado en el motor. Lenguajes disponibles: ${Object.keys(LANGUAGE_SPECS).join(', ')}.`
      };
    }

    const lines = code.split('\n');
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      for (const rule of spec.forbidden) {
        if (rule.pattern.test(line)) {
          return {
            valid: false,
            error: `[Línea ${lineIdx + 1}] ${rule.message}\n\n` +
                   `  ✗ Código inválido encontrado: "${line.trim()}"\n` +
                   `  ✓ Recuerda: estás escribiendo en ${sourceLang.toUpperCase()}.`
          };
        }
      }
    }

    return { valid: true };
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// § 2.  CAPA 2: LEXER / PARSER — Construcción del AST Agnóstico
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Expresiones regulares del Lexer ─────────────────────────────────────────
//
// Cada RE captura un patrón semántico UNIVERSAL.
// Son agnósticas al lenguaje: reconocen el CONCEPTO, no la sintaxis específica.
//
// Estructura general: /^(?:alternativas_de_keyword)\s+CAPTURA\s*TERMINADORES?$/
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RE_FUNCTION
 * Detecta declaraciones de función/método en cualquiera de los 10 lenguajes.
 *
 * Grupo 1: nombre de la función
 * Grupo 2: lista de parámetros (puede estar vacía)
 *
 * Cubre:
 *   JS/TS  : function foo(a, b) {
 *   Python : def foo(a, b):
 *   Go     : func foo(a, b) {
 *   Rust   : fn foo(a: i32, b: i32) {   / pub fn foo() {
 *   C++    : void foo(int a) { / auto foo(auto b) {
 *   Java   : public static void foo(int a) {
 *   C#     : public static void Foo(object a) {
 *   PHP    : function foo($a) {
 *   Ruby   : def foo(a)
 */
const RE_FUNCTION = /^(?:pub(?:lic)?\s+)?(?:(?:public|private|protected)\s+)?(?:static\s+)?(?:(?:void|int|long|float|double|bool|string|String|Object|auto|object)\s+)?(?:function|def|fn|func)\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*(?:->\s*[\w<>\[\]]+)?\s*(?::\s*[\w\s]+)?\s*:?\s*\{?$|^(?:public\s+)?(?:static\s+)?(?:void|int|long|float|double|bool|String|Object|auto)\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*\{?$/;

/**
 * RE_CLASS
 * Detecta declaraciones de clase en cualquiera de los lenguajes soportados.
 */
const RE_CLASS = /^(?:pub(?:lic)?\s+)?class\s+([a-zA-Z_]\w*)(?:\s*(?:extends|:|\(|\{)\s*.*?)?\s*\{?\s*$/;

/**
 * RE_IMPORT
 * Detecta directivas de inclusión, imports, using o packages.
 */
const RE_IMPORT = /^(?:import|using|#include|package|require|from)\s+(.+?)\s*;?\s*$/;

/**
 * RE_IF
 * Detecta sentencias condicionales 'if' en cualquier lenguaje.
 *
 * Grupo 1: la condición lógica
 *
 * Cubre: if (cond) { / if cond: / if cond { / if(cond){
 */
const RE_IF = /^if\s*\(?(.*?)\)?\s*(?:then|:)?\s*\{?\s*$/;

/**
 * RE_FOR
 * Detecta bucles 'for' y 'foreach'.
 *
 * Grupo 1: la expresión completa del bucle
 *
 * Cubre: for (int i = 0; ...) { / for i in range(10): / foreach ($arr as $v) {
 */
const RE_FOR = /^(?:for(?:each)?)\s+(.+?)\s*:?\s*\{?\s*$/;

/**
 * RE_WHILE
 * Detecta bucles 'while'.
 *
 * Grupo 1: la condición del bucle
 *
 * Cubre: while (cond) { / while cond: / while(cond){
 */
const RE_WHILE = /^while\s*\(?(.*?)\)?\s*:?\s*\{?\s*$/;

/**
 * RE_PRINT
 * Detecta sentencias de impresión en TODOS los lenguajes soportados.
 *
 * Grupo 1: el argumento/expresión a imprimir
 *
 * Cubre:
 *   JS/TS  : console.log("hola")
 *   Java   : System.out.println("hola")
 *   C#     : Console.WriteLine("hola")
 *   Go     : fmt.Println("hola") / fmt.Printf("hola")
 *   Python : print("hola")
 *   PHP    : echo "hola"
 *   Ruby   : puts "hola" / print "hola"
 *   Rust   : println!("hola") / print!("hola")
 */
const RE_PRINT = /^(?:console\.log|System\.out\.println|Console\.WriteLine|fmt\.Print(?:ln|f)?|println!?|print!?|echo|puts)\s*\(?(.*?)\)?\s*;?\s*$/;

/**
 * RE_ASSIGN
 * Detecta asignaciones de variables con o sin declaración de tipo.
 *
 * Dos variantes:
 *   A) Con keyword de tipo/declaración — Grupos 1 (nombre) y 2 (valor)
 *      Cubre: let x = ..., const x = ..., var x = ..., auto x = ...,
 *             int x = ..., String x = ..., $x = ..., x := ...
 *   B) Sin keyword — Grupos 3 (nombre) y 4 (valor)
 *      Cubre: x = ..., x_var = ..., miVariable = ...
 */
const RE_ASSIGN = /^(?:let|const|var|auto|int|long|float|double|String|bool|string|object|Object)\s+\$?([a-zA-Z_]\w*)\s*=\s*(.+?)\s*;?\s*$|^\$?([a-zA-Z_]\w*)\s*:?=\s*(.+?)\s*;?\s*$/;

/**
 * RE_RETURN
 * Detecta sentencias de retorno.
 *
 * Grupo 1: el valor de retorno
 *
 * Cubre: return valor; / return valor
 */
const RE_RETURN = /^return\s+(.*?)\s*;?\s*$/;

// ─── Utilidades de conversión de nomenclatura ─────────────────────────────────

/** camelCase: myVariableName — usado por JS, TS, Java, C#, Go, C++, PHP */
const toCamelCase = (s) =>
  String(s)
    .replace(/[-_]+(\w)/g, (_, c) => c.toUpperCase())
    .replace(/^[A-Z]/, c => c.toLowerCase());

/** snake_case: my_variable_name — usado por Python, Rust, Ruby */
const toSnakeCase = (s) =>
  String(s)
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');

/** PascalCase: MyVariableName — usado por C# (nombres de método) */
const toPascalCase = (s) => {
  const c = toCamelCase(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
};

// ─── Lexer.tokenizeLine — Parsea una sola línea a un nodo AST ──────────────

/**
 * Lexer
 * ─────────────────────────────────────────────────────────────────────────────
 * Convierte el código fuente en un Array de nodos AST.
 * Es completamente AGNÓSTICO al lenguaje de origen: solo reconoce patrones semánticos.
 *
 * Tipos de nodo AST producidos:
 *   { type: 'empty' }
 *   { type: 'comment',    value }
 *   { type: 'block_close' }
 *   { type: 'function',   name, params: string[] }
 *   { type: 'if',         condition }
 *   { type: 'else' }
 *   { type: 'else_if',    condition }
 *   { type: 'for',        expression }
 *   { type: 'while',      condition }
 *   { type: 'print',      expression, isString: boolean }
 *   { type: 'return',     value }
 *   { type: 'assignment', name, value }
 *   { type: 'raw',        value }         ← passthrough para líneas no reconocidas
 */
const Lexer = {

  /**
   * tokenizeLine: Clasifica una sola línea y retorna el nodo AST correspondiente.
   * @param {string} line - Línea de código (sin modificar, puede tener espacios)
   * @returns {ASTNode}
   */
  tokenizeLine(line) {
    const trimmed = line.trim();

    // ── Línea vacía ──────────────────────────────────────────────────────────
    if (!trimmed) return { type: 'empty' };


    // ── Directivas de include C++ (#include) — ANTES del chequeo de comentario
    // porque #include empieza con '#' y sería malclasificado como comentario
    if (/^#include\b/.test(trimmed)) {
      const incMatch = trimmed.match(/^#include\s*[<"](.*?)[">]\s*$/);
      if (incMatch) return { type: 'import', module: incMatch[1].trim() };
      return { type: 'import_ignore' };
    }

    // ── Comentario: //, #, -- ─────────────────────────────────────────
    if (/^(?:\/\/|#|--\s*)/.test(trimmed)) {
      return { type: 'comment', value: trimmed };
    }

    // ── Cierre de bloque: } o 'end' ─────────────────────────────────────────
    if (/^\}$/.test(trimmed) || /^end$/.test(trimmed)) {
      return { type: 'block_close' };
    }

    // ── Sentencia else ───────────────────────────────────────────────────────
    if (/^(?:else\s*:?|\}?\s*else\s*\{?)$/.test(trimmed)) {
      return { type: 'else' };
    }

    // ── Sentencia else if / elif / elsif ─────────────────────────────────────
    const elseIfMatch = trimmed.match(/^(?:elif|elsif|\}?\s*else\s+if)\s*\(?(.*?)\)?\s*(?:then|:)?\s*\{?\s*$/);
    if (elseIfMatch) {
      return { type: 'else_if', condition: elseIfMatch[1].trim() };
    }

    // ── Directiva de Import / Include ────────────────────────────────────────
    const importMatch = trimmed.match(RE_IMPORT);
    if (importMatch) {
      // "using namespace std" no es un import real — se ignora (estilo C++)
      if (/^using\s+namespace\b/.test(trimmed)) {
        return { type: 'import_ignore' }; // Se descarta en el emitter
      }
      // "package main" de Go se descarta en destinos no-Go
      let mod = importMatch[1].trim();
      mod = mod.replace(/^["'<](.*?)["'>]$/, '$1'); // Extraer el nombre real
      return { type: 'import', module: mod };
    }

    // ── Declaración de clase ─────────────────────────────────────────────────
    const classMatch = trimmed.match(RE_CLASS);
    if (classMatch) {
      return { type: 'class', name: classMatch[1].trim() };
    }

    // ── Declaración de función ────────────────────────────────────────────────
    const funcMatch = trimmed.match(RE_FUNCTION);
    if (funcMatch) {
      // RE_FUNCTION tiene 2 variantes de captura (grupos 1-2 o grupos 3-4)
      const name   = funcMatch[1] || funcMatch[3];
      const rawParams = funcMatch[2] ?? funcMatch[4] ?? '';
      const params = rawParams
        .split(',')
        .map(p => {
          let cleaned = p.trim();
          // Elimina anotaciones de tipo C-style: "String[] x" → "x", "int x" → "x"
          // Primero quita el tipo (incluyendo brackets []) dejando sólo el identificador final
          cleaned = cleaned.replace(/^(?:[\w$]+(?:\[\])*\s+)+/, '');
          // Elimina anotaciones de tipo Rust/TS: "x: i32" → "x"
          cleaned = cleaned.replace(/:\s*[\w<>\[\]&?*]+/, '');
          // Elimina el $ de PHP
          cleaned = cleaned.replace(/^\$/, '');
          return cleaned.trim();
        })
        .filter(Boolean);
      return { type: 'function', name, params };
    }

    // ── Sentencia if ─────────────────────────────────────────────────────────
    const ifMatch = trimmed.match(RE_IF);
    if (ifMatch) {
      return { type: 'if', condition: ifMatch[1].trim() };
    }

    // ── Bucle for / foreach ──────────────────────────────────────────────────
    const forMatch = trimmed.match(RE_FOR);
    if (forMatch) {
      return { type: 'for', expression: forMatch[1].trim() };
    }

    // ── Bucle while ──────────────────────────────────────────────────────────
    const whileMatch = trimmed.match(RE_WHILE);
    if (whileMatch) {
      return { type: 'while', condition: whileMatch[1].trim() };
    }

    // ── Sentencia de impresión ───────────────────────────────────────────────
    const printMatch = trimmed.match(RE_PRINT);
    if (printMatch) {
      let expr = (printMatch[1] || '').trim();
      // Detecta si el argumento es un literal de string (empieza y termina con cita)
      const isString = /^["'].*["']$/.test(expr);
      if (isString) expr = expr.slice(1, -1);  // Extrae el contenido sin comillas
      return { type: 'print', expression: expr, isString };
    }

    // ── C++ std::cout << expresión (se mapea como print) ────────────────────
    const coutMatch = trimmed.match(/^(?:std::)?cout\s*<<\s*(.*?)\s*(?:<<\s*(?:std::)?endl\s*)?;?\s*$/);
    if (coutMatch) {
      let expr = coutMatch[1].trim();
      const isString = /^["'].*["']$/.test(expr);
      if (isString) expr = expr.slice(1, -1);
      return { type: 'print', expression: expr, isString };
    }

    // ── Sentencia return ─────────────────────────────────────────────────────
    const returnMatch = trimmed.match(RE_RETURN);
    if (returnMatch) {
      return { type: 'return', value: returnMatch[1].replace(/;$/, '').trim() };
    }

    // ── Asignación de variable ───────────────────────────────────────────────
    const assignMatch = trimmed.match(RE_ASSIGN);
    if (assignMatch) {
      const name  = assignMatch[1] || assignMatch[3];
      const value = (assignMatch[2] || assignMatch[4] || '').replace(/;$/, '').trim();
      // Guarda para no clasificar keywords reservadas como asignaciones
      const RESERVED = new Set(['print', 'echo', 'return', 'if', 'for', 'while', 'else', 'elsif', 'elif', 'func', 'def', 'fn']);
      if (name && !RESERVED.has(name)) {
        return { type: 'assignment', name, value };
      }
    }

    // ── Llamada a función como sentencia: foo(args) ──────────────────────
    // Captura: identificador(cualquier cosa) sin ser declaración ni print
    const callMatch = trimmed.match(/^([a-zA-Z_][\w.]*?)\s*\((.*)\)\s*;?\s*$/);
    if (callMatch) {
      return { type: 'call_expr', callee: callMatch[1], args: callMatch[2].trim() };
    }

    // ── Línea no reconocida — error estructurado (NUNCA copiar tal cual) ─────
    // Toda línea sin clasificar se registra como error. El orquestador abortará.
    return { type: 'unsupported', value: trimmed };
  },

  /**
   * parse: Construye el AST completo del código fuente.
   *
   * Enriquece cada nodo con su `depth` (profundidad de bloque).
   * El cálculo de depth varía según el blockStyle del lenguaje origen:
   *
   *   'indent' (Python): depth = Math.floor(espacios_iniciales / indentSize)
   *   'braces' (C-family): depth = contador incremental por cada bloque abierto
   *   'end'    (Ruby):    idem a braces, pero cierra con 'end' en vez de '}'
   *
   * @param {string} sourceLang - Lenguaje de origen (para calcular depth)
   * @param {string} code       - Código fuente completo
   * @returns {ASTNode[]}       - Array de nodos enriquecidos con { ...token, depth }
   */
  parse(sourceLang, code) {
    const spec  = LANGUAGE_SPECS[sourceLang];
    const lines = code.split('\n');
    const ast   = [];

    if (spec.blockStyle === 'indent') {
      // ── Python: depth determinado por la indentación de espacios ────────────
      for (const line of lines) {
        const leadingSpaces = (line.match(/^\s*/) || [''])[0].length;
        const depth = Math.floor(leadingSpaces / spec.indentSize);
        const token = this.tokenizeLine(line);
        ast.push({ ...token, depth });
      }
    } else {
      // ── C-family / Ruby / Go: depth determinado por llaves o end ────────────
      let depth = 0;
      for (const line of lines) {
        const token = this.tokenizeLine(line);
        const trimmed = line.trim();

        // Si la línea cierra un bloque anterior (empieza con } o end, o es exactamente })
        const hasLeadingClose = /^\}/.test(trimmed) || /^end\b/.test(trimmed);

        if (token.type === 'block_close') {
          // El cierre reduce la profundidad ANTES de emitir el nodo
          depth = Math.max(0, depth - 1);
          ast.push({ ...token, depth });
        } else {
          if (hasLeadingClose) {
            depth = Math.max(0, depth - 1);
          }
          ast.push({ ...token, depth });
          // Los aperturas de bloque incrementan depth PARA las líneas siguientes
          if (['class', 'function', 'if', 'else', 'else_if', 'for', 'while'].includes(token.type)) {
            depth++;
          }
        }
      }
    }

    return ast;
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// § 3.  EMITTER STRATEGIES — Generación de Código por Lenguaje Destino
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * emitCallExpr — Helper compartido por todos los emitters
 * Genera una llamada a función como sentencia, normalizando el nombre
 * del callee según la convención de case del lenguaje destino.
 *
 * @param {ASTNode} node  - nodo call_expr { callee, args }
 * @param {Function} caseFn - toCamelCase | toSnakeCase | toPascalCase
 * @param {string} semi  - terminador (';' o '')
 */
const emitCallExpr = (node, caseFn, semi) => {
  const callee = node.callee.split('.').map(caseFn).join('.');
  return `${callee}(${node.args})${semi}`;
};


/**
 * EMITTERS
 * ─────────────────────────────────────────────────────────────────────────────
 * Cada entrada implementa la interfaz EmitterStrategy (patrón Strategy):
 *
 *   indent      : string  — Cadena de indentación por nivel (ej: '    ' o '\t')
 *   openBlock   : (node) → string  — Genera la línea de apertura de bloque
 *   closeBlock  : ()     → string  — Genera el cierre de bloque ('' si Python)
 *   emitLine    : (node) → string  — Traduce nodos simples (print, assign, return)
 *
 * Cada estrategia es completamente independiente — principio Open/Closed de SOLID.
 */
const EMITTERS = {

  // ── JavaScript ─────────────────────────────────────────────────────────────
  javascript: {
    indent: '  ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `class ${toPascalCase(node.name)} {`,
        if:      () => `if (${node.condition}) {`,
        else:    () => `else {`,
        else_if: () => `else if (${node.condition}) {`,
        for:     () => `for (${node.expression}) {`,
        while:   () => `while (${node.condition}) {`,
        function: () => {
          const name   = toCamelCase(node.name);
          const params = node.params.map(toCamelCase).join(', ');
          return `function ${name}(${params}) {`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `// [WARN] Bloque desconocido: ${node.type}`))();
    },
    closeBlock: () => '}',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `console.log(${node.isString ? `"${node.expression}"` : toCamelCase(node.expression)});`,
        import:     () => `import "${node.module}";`,
        call_expr:  () => emitCallExpr(node, toCamelCase, ';'),
        assignment: () => `let ${toCamelCase(node.name)} = ${node.value};`,
        return:     () => `return ${node.value};`,
        comment:    () => node.value.startsWith('#') ? `// ${node.value.slice(1).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  },

  // ── TypeScript ─────────────────────────────────────────────────────────────
  typescript: {
    indent: '  ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `class ${toPascalCase(node.name)} {`,
        if:      () => `if (${node.condition}) {`,
        else:    () => `else {`,
        else_if: () => `else if (${node.condition}) {`,
        for:     () => `for (${node.expression}) {`,
        while:   () => `while (${node.condition}) {`,
        function: () => {
          const name   = toCamelCase(node.name);
          const params = node.params.map(p => `${toCamelCase(p)}: unknown`).join(', ');
          return `function ${name}(${params}): void {`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `// [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => '}',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `console.log(${node.isString ? `"${node.expression}"` : toCamelCase(node.expression)});`,
        import:     () => `import "${node.module}";`,
        call_expr:  () => emitCallExpr(node, toCamelCase, ';'),
        assignment: () => `const ${toCamelCase(node.name)}: unknown = ${node.value};`,
        return:     () => `return ${node.value};`,
        comment:    () => node.value.startsWith('#') ? `// ${node.value.slice(1).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  },

  // ── Python ─────────────────────────────────────────────────────────────────
  python: {
    indent: '    ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `class ${toPascalCase(node.name)}:`,
        if:      () => `if ${node.condition}:`,
        else:    () => `else:`,
        else_if: () => `elif ${node.condition}:`,
        for:     () => `for ${node.expression}:`,
        while:   () => `while ${node.condition}:`,
        function: () => {
          const name   = toSnakeCase(node.name);
          const params = node.params.map(toSnakeCase).join(', ');
          return `def ${name}(${params}):`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `# [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => '',  // Python cierra con indentación, no con un caracter
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `print(${node.isString ? `"${node.expression}"` : toSnakeCase(node.expression)})`,
        // Para Python: solo emitir import si el módulo tiene sentido en Python.
        // Cabeceras de C++ (iostream, string, vector…) no tienen equivalente — se omiten.
        import:     () => {
          const cppHeaders = /^(iostream|string|vector|map|set|algorithm|cmath|cstdio|fstream|sstream|memory|utility|functional|stdexcept|cassert|cstring|cstdlib|ctime)$/;
          if (cppHeaders.test(node.module)) return null; // Descartar silenciosamente
          return `import ${node.module}`;
        },
        call_expr:  () => emitCallExpr(node, toSnakeCase, ''),
        assignment: () => `${toSnakeCase(node.name)} = ${node.value}`,
        return:     () => `return ${node.value}`,
        comment:    () => node.value.startsWith('//') ? `# ${node.value.slice(2).trim()}` : node.value
      };
      const result = (LINE_MAP[node.type] || (() => ''))();
      return result;
    }
  },


  // ── Go ─────────────────────────────────────────────────────────────────────
  go: {
    indent: '\t',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `type ${toPascalCase(node.name)} struct {`,
        if:      () => `if ${node.condition} {`,
        else:    () => `else {`,
        else_if: () => `else if ${node.condition} {`,
        for:     () => `for ${node.expression} {`,
        while:   () => `for ${node.condition} {`,  // Go usa 'for' como while
        function: () => {
          const name   = toCamelCase(node.name);
          const params = node.params.map(p => `${toCamelCase(p)} interface{}`).join(', ');
          return `func ${name}(${params}) {`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `// [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => '}',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `fmt.Println(${node.isString ? `"${node.expression}"` : toCamelCase(node.expression)})`,
        import:     () => `import "${node.module}"`,
        call_expr:  () => emitCallExpr(node, toCamelCase, ''),
        assignment: () => `${toCamelCase(node.name)} := ${node.value}`,
        return:     () => `return ${node.value}`,
        comment:    () => node.value.startsWith('#') ? `// ${node.value.slice(1).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  },

  // ── Rust ───────────────────────────────────────────────────────────────────
  rust: {
    indent: '    ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `struct ${toPascalCase(node.name)} {`,
        if:      () => `if ${node.condition} {`,
        else:    () => `else {`,
        else_if: () => `else if ${node.condition} {`,
        for:     () => `for ${node.expression} {`,
        while:   () => `while ${node.condition} {`,
        function: () => {
          const name   = toSnakeCase(node.name);
          const params = node.params.map(p => `${toSnakeCase(p)}: &str`).join(', ');
          return `fn ${name}(${params}) {`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `// [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => '}',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => node.isString
                            ? `println!("${node.expression}");`
                            : `println!("{}", ${toSnakeCase(node.expression)});`,
        import:     () => `use ${node.module};`,
        call_expr:  () => emitCallExpr(node, toSnakeCase, ';'),
        assignment: () => `let ${toSnakeCase(node.name)} = ${node.value};`,
        return:     () => `return ${node.value};`,
        comment:    () => node.value.startsWith('#') ? `// ${node.value.slice(1).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  },

  // ── C# ─────────────────────────────────────────────────────────────────────
  csharp: {
    indent: '    ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `public class ${toPascalCase(node.name)}\n{`,
        if:      () => `if (${node.condition})\n{`,
        else:    () => `else\n{`,
        else_if: () => `else if (${node.condition})\n{`,
        for:     () => `for (${node.expression})\n{`,
        while:   () => `while (${node.condition})\n{`,
        function: () => {
          const name   = toPascalCase(node.name);
          const params = node.params.map(p => `object ${toPascalCase(p)}`).join(', ');
          return `public static void ${name}(${params})\n{`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `// [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => '}',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `Console.WriteLine(${node.isString ? `"${node.expression}"` : toPascalCase(node.expression)});`,
        import:     () => `using ${node.module};`,
        call_expr:  () => emitCallExpr(node, toPascalCase, ';'),
        assignment: () => `var ${toCamelCase(node.name)} = ${node.value};`,
        return:     () => `return ${node.value};`,
        comment:    () => node.value.startsWith('#') ? `// ${node.value.slice(1).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  },

  // ── PHP ────────────────────────────────────────────────────────────────────
  php: {
    indent: '    ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `class ${toPascalCase(node.name)} {`,
        if:      () => `if (${node.condition}) {`,
        else:    () => `else {`,
        else_if: () => `elseif (${node.condition}) {`,
        for:     () => `for (${node.expression}) {`,
        while:   () => `while (${node.condition}) {`,
        function: () => {
          const name   = toCamelCase(node.name);
          const params = node.params.map(p => `$${toCamelCase(p)}`).join(', ');
          return `function ${name}(${params}) {`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `// [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => '}',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `echo ${node.isString ? `"${node.expression}"` : `$${toCamelCase(node.expression)}`};`,
        import:     () => `require_once "${node.module}";`,
        call_expr:  () => emitCallExpr(node, toCamelCase, ';'),
        assignment: () => `$${toCamelCase(node.name)} = ${node.value};`,
        return:     () => `return ${node.value};`,
        comment:    () => node.value.startsWith('#') ? `// ${node.value.slice(1).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  },


  // ── Ruby ───────────────────────────────────────────────────────────────────
  ruby: {
    indent: '  ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `class ${toPascalCase(node.name)}`,
        if:      () => `if ${node.condition}`,
        else:    () => `else`,
        else_if: () => `elsif ${node.condition}`,
        for:     () => `${node.expression}.each do`,
        while:   () => `while ${node.condition}`,
        function: () => {
          const name   = toSnakeCase(node.name);
          const params = node.params.map(toSnakeCase).join(', ');
          return params ? `def ${name}(${params})` : `def ${name}`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `# [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => 'end',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `puts ${node.isString ? `"${node.expression}"` : toSnakeCase(node.expression)}`,
        import:     () => `require "${node.module}"`,
        call_expr:  () => emitCallExpr(node, toSnakeCase, ''),
        assignment: () => `${toSnakeCase(node.name)} = ${node.value}`,
        return:     () => `return ${node.value}`,
        comment:    () => node.value.startsWith('//') ? `# ${node.value.slice(2).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  },


  // ── C++ ────────────────────────────────────────────────────────────────────
  cpp: {
    indent: '    ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `class ${toPascalCase(node.name)} {`,
        if:      () => `if (${node.condition}) {`,
        else:    () => `else {`,
        else_if: () => `else if (${node.condition}) {`,
        for:     () => `for (${node.expression}) {`,
        while:   () => `while (${node.condition}) {`,
        function: () => {
          const name   = toCamelCase(node.name);
          const params = node.params.map(p => `auto ${toCamelCase(p)}`).join(', ');
          return `auto ${name}(${params}) {`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `// [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => '}',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `std::cout << ${node.isString ? `"${node.expression}"` : toCamelCase(node.expression)} << std::endl;`,
        import:     () => `#include <${node.module}>`,
        call_expr:  () => emitCallExpr(node, toCamelCase, ';'),
        assignment: () => `auto ${toCamelCase(node.name)} = ${node.value};`,
        return:     () => `return ${node.value};`,
        comment:    () => node.value.startsWith('#') ? `// ${node.value.slice(1).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  },

  // ── Java ───────────────────────────────────────────────────────────────────
  java: {
    indent: '    ',
    openBlock(node) {
      const OPEN_MAP = {
        class:   () => `public class ${toPascalCase(node.name)} {`,
        if:      () => `if (${node.condition}) {`,
        else:    () => `else {`,
        else_if: () => `else if (${node.condition}) {`,
        for:     () => `for (${node.expression}) {`,
        while:   () => `while (${node.condition}) {`,
        function: () => {
          const name   = toCamelCase(node.name);
          const params = node.params.map(p => `Object ${toCamelCase(p)}`).join(', ');
          return `public static void ${name}(${params}) {`;
        }
      };
      return (OPEN_MAP[node.type] || (() => `// [WARN] Bloque: ${node.type}`))();
    },
    closeBlock: () => '}',
    emitLine(node) {
      const LINE_MAP = {
        print:      () => `System.out.println(${node.isString ? `"${node.expression}"` : toCamelCase(node.expression)});`,
        import:     () => `import ${node.module};`,
        call_expr:  () => emitCallExpr(node, toCamelCase, ';'),
        assignment: () => `var ${toCamelCase(node.name)} = ${node.value};`,
        return:     () => `return ${node.value};`,
        comment:    () => node.value.startsWith('#') ? `// ${node.value.slice(1).trim()}` : node.value
      };
      return (LINE_MAP[node.type] || (() => ''))();
    }
  }

};



// ═══════════════════════════════════════════════════════════════════════════════
// § 4.  INDENTATION ENGINE — Motor de Gestión de Profundidad de Bloques
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IndentationEngine
 * ─────────────────────────────────────────────────────────────────────────────
 * Serializa el AST al código destino gestionando la profundidad de bloques
 * de forma universal para CUALQUIER combinación de lenguaje origen/destino.
 *
 * PROBLEMA RESUELTO: La transición entre estilos de bloques distintos.
 *
 *   Python → Java   : Lee profundidades de indentación, emite llaves {}
 *   Java   → Python : Lee profundidades de llaves, emite indentación
 *   Ruby   → Go     : Lee 'end', emite llaves {}
 *   Go     → Ruby   : Lee llaves {}, emite 'end'
 *
 * ALGORITMO CENTRAL:
 *   - Mantiene `prevDepth` para rastrear el nivel del bloque anterior.
 *   - Cuando la profundidad actual (node.depth) es MENOR que prevDepth,
 *     emite los cierres de bloque necesarios ('}', 'end', o nada si Python).
 *   - Al finalizar el archivo, cierra todos los bloques que queden abiertos.
 *
 * @param {ASTNode[]} ast         - AST producido por Lexer.parse()
 * @param {EmitterStrategy} emitter - Estrategia del lenguaje destino
 * @returns {string[]} - Array de líneas del código destino
 */
const IndentationEngine = {
  serialize(ast, emitter) {
    const outputLines = [];
    let prevDepth = 0;

    for (const node of ast) {

      // ── Saltar nodos vacíos sin afectar la lógica de depth ──────────────────
      if (node.type === 'empty') {
        outputLines.push('');
        continue;
      }

      // ── Línea no soportada — abortar con error claro ───────────────────────
      if (node.type === 'unsupported') {
        return {
          lines: null,
          error: `Construcción no soportada por el traductor: "${node.value}"\n` +
                 `El motor no puede traducir esta línea automáticamente.\n` +
                 `Simplifica o reescribe la línea antes de transpilar.`
        };
      }

      // ── Ignorar directivas descartables (using namespace, etc.) ───────────
      if (node.type === 'import_ignore') continue;

      // ── Saltar marcadores de cierre del AST origen ───────────────────────────
      // Los 'block_close' del origen ya están codificados en el `depth` del AST.
      // No los emitimos directamente; el engine los infiere de los cambios de depth.
      if (node.type === 'block_close') continue;

      // ── Emitir cierres de bloque cuando la profundidad disminuye ─────────────
      // Esta es la lógica que convierte Python→Java (inserta '}') y Java→Python (no hace nada)
      while (prevDepth > node.depth) {
        prevDepth--;
        const closer = emitter.closeBlock();
        if (closer) {
          outputLines.push(emitter.indent.repeat(prevDepth) + closer);
        }
      }


      // ── Emitir el nodo actual ─────────────────────────────────────────────────
      const BLOCK_OPENERS = new Set(['class', 'function', 'if', 'else', 'else_if', 'for', 'while']);

      if (BLOCK_OPENERS.has(node.type)) {
        // Nodo de apertura de bloque: genera la firma con openBlock()
        const blockLine = emitter.openBlock(node);

        // Soporte para C# (Allman style): openBlock puede retornar dos líneas con \n
        const subLines = blockLine.split('\n');
        for (const subLine of subLines) {
          outputLines.push(emitter.indent.repeat(node.depth) + subLine);
        }
        prevDepth = node.depth + 1;

      } else {
        // Nodo simple: genera la línea con emitLine()
        const line = emitter.emitLine(node);
        if (line !== null && line !== undefined) {
          outputLines.push(emitter.indent.repeat(node.depth) + line);
        }
        prevDepth = node.depth;
      }
    }

    // ── Cerrar todos los bloques que permanezcan abiertos al final del archivo ──
    while (prevDepth > 0) {
      prevDepth--;
      const closer = emitter.closeBlock();
      if (closer) {
        outputLines.push(emitter.indent.repeat(prevDepth) + closer);
      }
    }

    return { lines: outputLines, error: null };
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// § 5.  ORQUESTADOR — translateCode (Punto de Entrada Público)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * translateCode
 * ─────────────────────────────────────────────────────────────────────────────
 * Orquesta las 3 capas del motor de transpilación en orden secuencial:
 *
 *   1. DomainLinter.validate()         → Si falla: error inmediato con mensaje exacto
 *   2. Lexer.parse()                   → Construye el AST con depth
 *   3. IndentationEngine.serialize()   → Serializa el AST al código destino
 *
 * Mantiene TOTAL COMPATIBILIDAD con el contrato de App.js:
 *   Retorna Promise<{ code: string, explicacion: string, esError: boolean }>
 *
 * @param {string} sourceLang - Lenguaje de origen ('python', 'java', 'cpp', etc.)
 * @param {string} targetLang - Lenguaje de destino
 * @param {string} code       - Código fuente a transpilar
 * @returns {Promise<{ code: string, explicacion: string, esError: boolean }>}
 */
export const translateCode = (sourceLang, targetLang, code) => {
  return new Promise((resolve) => {

    // ── GUARDIA: Editor vacío ─────────────────────────────────────────────────
    if (!code || !code.trim()) {
      return setTimeout(() => resolve({
        code: '',
        explicacion: '⚠️  El editor de origen está vacío. Escribe código para transpilar.',
        esError: false
      }), 100);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // CAPA 1 — DOMAIN LINTER
    // Valida sintaxis ANTES de cualquier procesamiento.
    // Si falla, retorna inmediatamente con un error descriptivo y exacto.
    // ────────────────────────────────────────────────────────────────────────────
    const lintResult = DomainLinter.validate(sourceLang, code);

    if (!lintResult.valid) {
      return setTimeout(() => resolve({
        code: [
          `// ❌ ERROR DE VALIDACIÓN SINTÁCTICA`,
          `// El código no es compatible con ${sourceLang.toUpperCase()}`,
          `//`,
          `// Revisa la sección de "Análisis" para ver el detalle del error.`
        ].join('\n'),
        explicacion: `⛔ LINTER BLOQUEÓ LA COMPILACIÓN\n${'─'.repeat(45)}\n${lintResult.error}\n\n💡 Selecciona el lenguaje de origen correcto o corrige la sintaxis antes de transpilar.`,
        esError: true
      }), 200);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // CAPA 2 — LEXER / PARSER  →  Construcción del AST
    // ────────────────────────────────────────────────────────────────────────────
    const ast = Lexer.parse(sourceLang, code);

    // ────────────────────────────────────────────────────────────────────────────
    // CAPA 3 — INDENTATION ENGINE + EMITTER  →  Generación del código destino
    // ────────────────────────────────────────────────────────────────────────────
    const emitter        = EMITTERS[targetLang] || EMITTERS['javascript'];
    const serializeResult = IndentationEngine.serialize(ast, emitter);

    // ── Abortar si el engine encontró una construcción no soportada ───────────
    if (serializeResult.error) {
      return setTimeout(() => resolve({
        code: [
          `// ❌ ERROR: CONSTRUCCIÓN NO SOPORTADA`,
          `// El motor no pudo traducir una línea del código fuente.`,
          `//`,
          `// Revisa la sección de "Análisis" para ver el detalle del error.`
        ].join('\n'),
        explicacion: `⛔ TRADUCCIÓN ABORTADA\n${'─'.repeat(45)}\n${serializeResult.error}\n\n💡 El motor solo soporta: funciones, clases, imports, if/else, for, while, print, asignaciones y return.\nSimplifica o adapta el código antes de transpilar.`,
        esError: true
      }), 200);
    }

    const outputLines = serializeResult.lines;

    // ── Construir reporte de análisis AST ─────────────────────────────────────
    const srcSpec     = LANGUAGE_SPECS[sourceLang];
    const dstSpec     = LANGUAGE_SPECS[targetLang] || LANGUAGE_SPECS['javascript'];

    const blockNodes  = ast.filter(n => ['class', 'function', 'if', 'for', 'while'].includes(n.type));
    const maxDepth    = ast.reduce((max, n) => Math.max(max, n.depth || 0), 0);
    const totalLines  = ast.filter(n => n.type !== 'empty').length;
    const importNodes = ast.filter(n => n.type === 'import').length;

    // Mensaje de conversión de estilo de bloques (el punto más crítico del transpilador)
    const blockStyleMsg = srcSpec.blockStyle !== dstSpec.blockStyle
      ? (() => {
          const transitions = {
            'indent→braces': `⚙️  Conversión de bloques: Indentación Python → Llaves {} (${blockNodes.length} bloque${blockNodes.length !== 1 ? 's' : ''} cerrado${blockNodes.length !== 1 ? 's' : ''} automáticamente)`,
            'braces→indent': `⚙️  Conversión de bloques: Llaves {} → Indentación Python (${blockNodes.length} cierre${blockNodes.length !== 1 ? 's' : ''} eliminado${blockNodes.length !== 1 ? 's' : ''})`,
            'end→braces':    `⚙️  Conversión de bloques: Ruby end…end → Llaves {}`,
            'end→indent':    `⚙️  Conversión de bloques: Ruby end…end → Indentación Python`,
            'braces→end':    `⚙️  Conversión de bloques: Llaves {} → Ruby end…end`,
            'indent→end':    `⚙️  Conversión de bloques: Indentación Python → Ruby end…end`
          };
          const key = `${srcSpec.blockStyle}→${dstSpec.blockStyle}`;
          return transitions[key] || `⚙️  Conversión de estilos de bloque: ${srcSpec.blockStyle} → ${dstSpec.blockStyle}`;
        })()
      : `✓  Mismo estilo de bloques (${srcSpec.blockStyle}): sin conversión necesaria`;

    const astBreakdown = blockNodes.length > 0
      ? [
          `\n🔍 Nodos de bloque detectados en el AST:`,
          ...blockNodes.map(n => {
            const label = n.name || n.condition || n.expression || '—';
            return `   [${n.type.toUpperCase().padEnd(8)}]  "${label}"  (profundidad: ${n.depth})`;
          })
        ].join('\n')
      : '';

    const explicacion = [
      `✅ TRANSPILACIÓN EXITOSA: ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}`,
      `${'─'.repeat(45)}`,
      `📊 Análisis AST:`,
      `   • Líneas procesadas    : ${totalLines}`,
      `   • Bloques (fn/if/for)  : ${blockNodes.length}`,
      `   • Profundidad máxima   : ${maxDepth} nivel${maxDepth !== 1 ? 'es' : ''}`,
      `   • Imports traducidos   : ${importNodes}`,
      `\n${blockStyleMsg}`,
      astBreakdown
    ].join('\n');

    setTimeout(() => resolve({
      code: outputLines.join('\n'),
      explicacion,
      esError: false
    }), 350);
  });
};