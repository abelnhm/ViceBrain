# AI Command Center v2

Navegador Chromium de escritorio con múltiples servicios de IA en paralelo.

## Servicios incluidos

Gemini · ChatGPT · Claude · Kimi · DeepSeek · Qwen · Mistral · Grok · Z · Copilot · Perplexity · Meta AI · Luzia

## Instalación

```bash
cd ai-trio-browser
npm install   # solo la primera vez (~150 MB)
npm start
```

## Uso

- **☰ Servicios** → panel lateral para activar/desactivar columnas
- **Broadcast** → inyecta el mismo prompt en todos los modelos activos
- **Ctrl+Enter** → atajo para enviar
- **↺** → recarga una columna individual
- **★** → marcar como favorito (aparece al principio)
- **◐ Iconos** → alternar entre iconos y colores
- **+ Añadir servicio** → agregar servicios personalizados

## Login con Google/Microsoft (Gemini / ChatGPT / Copilot)

Google bloquea el OAuth en cualquier WebView embebido (es una restricción
de Google, no un bug de la app). El flujo correcto es:

1. Haz clic en "Iniciar sesión con Google" en la columna
2. La app abre automáticamente tu **navegador predeterminado** (Chrome, Edge, etc.)
3. Completa el login normal en ese navegador
4. Vuelve a la app y pulsa **↺ Recargar** en esa columna
5. La sesión se recargará y el login estará activo

La sesión se guarda en disco y no necesitarás repetir este proceso.

## Dónde se guardan las sesiones

- Windows: `%APPDATA%\ai-trio-browser\Partitions\`
- macOS:   `~/Library/Application Support/ai-trio-browser/Partitions/`
- Linux:   `~/.config/ai-trio-browser/Partitions/`

## Generar ejecutable

### Requisitos

- Node.js instalado
- npm install ejecutado

### Comandos

```bash
# Windows (.exe)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage)
npm run build:linux

# Todas las plataformas
npm run build
```

El ejecutable se generará en la carpeta `dist/`.

### Notas

- **Windows**: Genera un instalador `.exe` (NSIS)
- **macOS**: Genera un `.dmg` (requiere macOS)
- **Linux**: Genera un `.AppImage` (funciona en la mayoría de distribuciones)
