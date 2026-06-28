import React, { useState, useCallback, useRef } from 'react';
import {
  ArrowLeftRight,
  Loader2,
  Code,
  BookOpen,
  Terminal,
  Copy,
  Check,
  Trash2,
  History,
  Palette,
  Layout,
  Sun,
  Moon
} from 'lucide-react';
import { translateCode } from './mockService'; // Pronto cambiaremos esto al nuevo motor

// ─────────────────────────────────────────────────────────────────────────────
// § 1. CONFIGURACIÓN ESTÁTICA
// ─────────────────────────────────────────────────────────────────────────────

const LANGUAGES = {
  javascript: { label: 'JavaScript', ext: '.js',    color: '#f0db4f' },
  typescript: { label: 'TypeScript', ext: '.ts',    color: '#3178c6' },
  python:     { label: 'Python',     ext: '.py',    color: '#3572A5' },
  go:         { label: 'Go',         ext: '.go',    color: '#00ADD8' },
  rust:       { label: 'Rust',       ext: '.rs',    color: '#dea584' },
  cpp:        { label: 'C++',        ext: '.cpp',   color: '#f34b7d' },
  java:       { label: 'Java',       ext: '.java',  color: '#b07219' },
  ruby:       { label: 'Ruby',       ext: '.rb',    color: '#701516' },
  php:        { label: 'PHP',        ext: '.php',   color: '#4F5D95' },
  csharp:     { label: 'C#',         ext: '.cs',    color: '#178600' }
};

const THEMES = {
  manuscrito: 'Manuscrito (Papel/Tinta)',
  terminal: 'Terminal (Fósforo Ámbar)',
  cobre: 'Cobre (Óxido)'
};

const BG_STYLES = {
  solid: 'Liso',
  grid: 'Ficha Perforada',
  gradient: 'Viñeta'
};

const MODES = {
  oscuro: 'Modo Oscuro',
  claro: 'Modo Claro'
};

// ─────────────────────────────────────────────────────────────────────────────
// § 2. SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────

const LineNumberGutter = ({ content, gutterRef }) => {
  const lines = content ? content.split('\n') : [''];
  const count = Math.max(lines.length, 1);

  return (
    <div ref={gutterRef} className="cs-editor-gutter" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="cs-gutter-num">{i + 1}</span>
      ))}
    </div>
  );
};

const LanguageBadge = ({ langId }) => {
  const lang = LANGUAGES[langId];
  if (!lang) return null;

  return (
    <span className="cs-lang-badge" style={{ backgroundColor: `${lang.color}15`, color: lang.color, border: `1px solid ${lang.color}35` }}>
      <span className="cs-lang-badge-dot" style={{ backgroundColor: lang.color }} />
      {lang.label}{lang.ext}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// § 3. CONTROLADOR PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [theme, setTheme] = useState('manuscrito');
  const [bgStyle, setBgStyle] = useState('solid');
  const [mode, setMode] = useState('claro');

  const [langOrigen, setLangOrigen] = useState('python');
  const [langDestino, setLangDestino] = useState('javascript');
  
  const [codigoOrigen, setCodigoOrigen] = useState(`def saludar(nombre):\n    print("Hola")`);
  const [codigoDestino, setCodigoDestino] = useState('');
  const [explicacion, setExplicacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [esErrorDestino, setEsErrorDestino] = useState(false);

  const [copiado, setCopiado] = useState(false);
  const [historial, setHistorial] = useState([]);

  const origenGutterRef = useRef(null);
  const destinoGutterRef = useRef(null);
  const textareaOrigenRef = useRef(null);

  const handleScroll = useCallback((event, gutterRef) => {
    if (gutterRef.current) gutterRef.current.scrollTop = event.target.scrollTop;
  }, []);

  const handleSwapLanguages = useCallback(() => {
    setLangOrigen(langDestino);
    setLangDestino(langOrigen);
    setCodigoDestino('');
    setExplicacion('');
    setEsErrorDestino(false);
    setError(null);
  }, [langOrigen, langDestino]);

  const handleTranslate = useCallback(async () => {
    setError(null); setCodigoDestino(''); setExplicacion(''); setEsErrorDestino(false); setCargando(true);
    try {
      const response = await translateCode(langOrigen, langDestino, codigoOrigen);
      setCodigoDestino(response.code); setExplicacion(response.explicacion); setEsErrorDestino(response.esError);
      if (response.esError) setError(`[Fallo] Discrepancias sintácticas en el origen.`);
      else {
        setHistorial(prev => [{
          id: Date.now(), origen: langOrigen, destino: langDestino, codigo: codigoOrigen,
          resultado: response.code, explicacion: response.explicacion, esError: response.esError,
          time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 5));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [langOrigen, langDestino, codigoOrigen]);

  const handleClear = useCallback(() => {
    setCodigoOrigen(''); setCodigoDestino(''); setExplicacion(''); setEsErrorDestino(false); setError(null);
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    if (!codigoDestino) return;
    navigator.clipboard.writeText(codigoDestino).then(() => {
      setCopiado(true); setTimeout(() => setCopiado(false), 2000);
    });
  }, [codigoDestino]);

  const handleRestoreHistory = useCallback((item) => {
    setLangOrigen(item.origen); setLangDestino(item.destino); setCodigoOrigen(item.codigo);
    setCodigoDestino(item.resultado); setExplicacion(item.explicacion); setEsErrorDestino(item.esError);
    setError(item.esError ? `[Fallo] Restaurando compilación fallida.` : null);
  }, []);

 const handleSourceKeyDown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Detiene el comportamiento nativo para evitar saltos dobles o bugs de foco
    
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    // Obtener el contenido de la línea actual antes del cursor
    const textBeforeCursor = value.substring(0, start);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];

    // Detectar espacios o tabulaciones al inicio de la línea actual
    const indentMatch = currentLine.match(/^\s*/);
    let nextIndent = indentMatch ? indentMatch[0] : '';

    // Regla de auto-indentación para Python si la línea termina con dos puntos
    if (langOrigen === 'python' && currentLine.trim().endsWith(':')) {
      nextIndent += '    '; // Añade 4 espacios de bloque anidado
    }

    // Construir el nuevo bloque de texto insertando el salto y la indentación calculada
    const newValue = value.substring(0, start) + '\n' + nextIndent + value.substring(end);
    setCodigoOrigen(newValue);

    // Reposicionar el cursor sincrónicamente en el siguiente renderizado
    const newCursorPos = start + 1 + nextIndent.length;
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    }, 0);
  }
};
  const countLines = (code) => (code ? code.split('\n').length : 0);

  return (
    <div className={`cs-app-container mode-${mode} theme-${theme}`} data-bg-style={bgStyle}>
      <header className="cs-header">
        <div className="cs-badge-runtime">
          <Terminal size={15} /><span>MOTOR SOLID v3.0</span>
        </div>
        <h1 className="cs-title">CODE SWAPPER</h1>
        <p className="cs-subtitle">Transpilador y verificador sintáctico en tiempo real.</p>
      </header>

      <section className="cs-toolbar" aria-label="Controles del Compilador">
        <div className="cs-toolbar-group">
          <label htmlFor="select-origen" className="cs-toolbar-label">ORIGEN</label>
          <select id="select-origen" className="cs-select" value={langOrigen} disabled={cargando} onChange={(e) => { setLangOrigen(e.target.value); handleClear(); }}>
            {Object.entries(LANGUAGES).map(([key, lang]) => <option key={key} value={key}>{lang.label}</option>)}
          </select>
        </div>

        <button className="cs-swap-btn" disabled={cargando} onClick={handleSwapLanguages} title="Intercambiar lenguajes"><ArrowLeftRight size={18} /></button>

        <div className="cs-toolbar-group">
          <label htmlFor="select-destino" className="cs-toolbar-label">DESTINO</label>
          <select id="select-destino" className="cs-select" value={langDestino} disabled={cargando} onChange={(e) => { setLangDestino(e.target.value); setCodigoDestino(''); }}>
            {Object.entries(LANGUAGES).map(([key, lang]) => <option key={key} value={key}>{lang.label}</option>)}
          </select>
        </div>

        <button className="cs-mode-toggle" onClick={() => setMode(prev => prev === 'oscuro' ? 'claro' : 'oscuro')}>
          {mode === 'oscuro' ? <Sun size={16} /> : <Moon size={16} />} <span>{mode === 'oscuro' ? 'Claro' : 'Oscuro'}</span>
        </button>

        <div className="cs-toolbar-group" style={{ flex: '0 1 auto', minWidth: '150px' }}>
          <Palette size={16} color="var(--signal)" style={{ marginRight: '4px' }} />
          <select className="cs-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
            {Object.entries(THEMES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>

        <button className="cs-btn-secondary" onClick={handleClear} disabled={cargando}><Trash2 size={15} /><span>Limpiar</span></button>
        <button className="cs-btn-primary" disabled={cargando} onClick={handleTranslate}>
          {cargando ? <><Loader2 size={16} className="cs-spin-icon" />Traduciendo...</> : <><Code size={16} />Traducir Registro</>}
        </button>
      </section>

      {error && <div className="cs-error-banner" role="alert"><span>⚠</span>{error}</div>}

      <main className="cs-editors-grid">
        <article className="cs-ide-card">
          <header className="cs-ide-header">
            <div className="cs-ide-header-left"><span className="cs-ide-header-icon"><Code size={15} /></span><span className="cs-ide-header-title">Editor de Origen</span></div>
            <LanguageBadge langId={langOrigen} />
          </header>
          <div className="cs-editor-canvas">
            <LineNumberGutter content={codigoOrigen} gutterRef={origenGutterRef} />
            <textarea
              ref={textareaOrigenRef}
              className="cs-textarea"
              value={codigoOrigen} disabled={cargando} spellCheck={false}
              onChange={(e) => setCodigoOrigen(e.target.value)}
              onScroll={(e) => handleScroll(e, origenGutterRef)}
              onKeyDown={handleSourceKeyDown}
              placeholder="// Escribe tu código aquí..."
            />
          </div>
        </article>

        <article className={`cs-ide-card ${esErrorDestino ? 'cs-error-card' : codigoDestino ? 'cs-accented' : ''}`}>
          <header className="cs-ide-header">
            <div className="cs-ide-header-left"><span className="cs-ide-header-icon"><Terminal size={15} /></span><span className="cs-ide-header-title">Salida</span></div>
            <div className="cs-ide-header-actions">
              {codigoDestino && !esErrorDestino && (
                <button className="cs-btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleCopyToClipboard}>
                  {copiado ? <Check size={14} color="var(--success)" /> : <Copy size={14} />} <span>{copiado ? 'Copiado' : 'Copiar'}</span>
                </button>
              )}
              <LanguageBadge langId={langDestino} />
            </div>
          </header>
          <div className="cs-editor-canvas">
            <LineNumberGutter content={codigoDestino} gutterRef={destinoGutterRef} />
            <textarea
              className="cs-textarea cs-readonly" value={codigoDestino} readOnly spellCheck={false}
              onScroll={(e) => handleScroll(e, destinoGutterRef)}
              placeholder={cargando ? '// Procesando...' : '// El código traducido aparecerá aquí...'}
              style={{ color: esErrorDestino ? 'var(--error)' : 'var(--text-code)' }}
            />
          </div>
        </article>
      </main>

      {explicacion && (
        <article className={`cs-ide-card cs-analysis-card ${esErrorDestino ? 'cs-error-card' : 'cs-accented'}`}>
          <header className="cs-ide-header">
            <div className="cs-ide-header-left">
              <span className="cs-ide-header-icon"><BookOpen size={15} /></span>
              <span className="cs-ide-header-title">Análisis Sintáctico y Reporte de AST</span>
            </div>
          </header>
          <div className="cs-editor-canvas" style={{ padding: '1rem', flexDirection: 'column' }}>
            <pre style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              color: esErrorDestino ? 'var(--error)' : 'var(--text-primary)',
              margin: 0
            }}>
              {explicacion}
            </pre>
          </div>
        </article>
      )}
    </div>
  );
}

export default App;