
// ==UserScript==
// @name         Wazeopedia Blocks-Library
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Biblioteca con la lógica para los bloques de contenido de Wazeopedia.
// @author       Annthizze
// @match        https://www.waze.com/discuss/*
// @license      MIT
// @require https://update.greasyfork.org/scripts/538610/1602961/Wazeopedia%20Core%20UI%20Library.js
// ==/UserScript==

var WazeopediaBlocks = (function() {
    'use strict';
    // Importar funciones de la biblioteca UI
    const {
        showModal,
        createButton,
        setupModalEscape,
        closeAllModals,
        insertTextAtCursor,
        applyHeadingFormatting,
        ensureProperSpacing
    } = WazeopediaUI;

    // --- Estructura de Datos para TOC ---
    const tocTemplates = {
        laneGuidance: {
            title: "GUIAS DE CARRIL",
            structure: ["1. Introducción", "2. Trabajando con guías de carril", "2.1. Creación", "2.2. Asignación de carriles", "2.3. Modificación de giros", "2.4. Instrucciones proporcionadas por Waze", "2.5. Instrucciones forzadas de giro", "3. Criterios para utilizar la guía de carril", "3.1. Autopistas y autovías", "3.2. Vías de servicio", "3.3. Carreteras", "3.4. Vías urbanas", "4. Dónde no utilizar una guía de carril", "5. Otras consideraciones", "6. Biografía y Enlaces", "7. Foro de discusión"]
        },
        tolls: {
            title: "PEAJES",
            structure: ["1. Introducción", "2. Restricciones en la edición de peajes", "3. Navegación y Penalizaciones por Peajes", "4. Gestión y Precios de Peajes", "5. Preguntas Frecuentes", "6. Biografía y Enlaces", "7. Foro de discusión"]
        },
        levelCrossings: {
            title: "PASOS A NIVEL",
            structure: ["1. Introducción", "2. Cómo funciona", "3. Mapeando pasos a nivel", "4. Consideraciones a tener en cuenta", "5. Preguntas Frecuentes", "6. Biografía y Enlaces", "7. Foro de discusión"]
        },
        chargingStations: {
            title: "ESTACIONES DE CARGA",
            structure: ["1. Introducción", "2. Características de los puntos de carga", "3. Cómo manejamos los PURs", "3.1. Qué información debemos verificar:", "3.2. Cómo resolvemos los problemas", "3.3. Cómo los nombramos", "4. Situaciones", "4.1. PUR en un lugar donde no existía el POI", "4.2. PUR en un lugar donde existía el POI", "4.3. PUR no está en la hoja", "4.4. Consideraciones a tener en cuenta", "5. Biografía y Enlaces", "6. Foro de discusión"]
        },
        gasStations: {
            title: "ESTACIONES DE GAS",
            structure: ["1. Introducción", "2. Trabajando con las estaciones de gas", "3. Consideraciones a tener en cuenta", "4. Creando nuevas estaciones de gas", "4.1. Qué información debemos verificar:", "4.2. Como las nombramos", "5. Editando estaciones de gas", "5.1. Establecer opciones", "5.1.1. General", "5.1.2. Más información", "5.2. Consideraciones a la hora de editar una estación de gas", "6. Biografía y Enlaces", "7. Foro de discusión"]
        }
    };

    // --- Lógica de Bloque de TOC ---
    function formatLineAsHeader(line) {
        if (!line.trim()) return "";
        const text = line.replace(/^[\d\.]+\s*/, '').trim();
        const numberMatch = line.match(/^([\d\.]+)/);
        const level = numberMatch ? (numberMatch[1].match(/\d+/g) || []).length : 1;
        const markdownPrefix = '#'.repeat(level) + ' ';
        return `${markdownPrefix}[wzh=${level}]${text}[/wzh]`;
    }
    function showTocGuideModal() {
        if (document.getElementById('wz-toc-guide-modal')) return;
        const modal = document.createElement('div');
        modal.className = 'wz-toc-guide-modal';
        modal.id = 'wz-toc-guide-modal';
        const title = document.createElement('h3');
        title.textContent = 'Guía de Plantillas TOC';
        const selectLabel = document.createElement('label');
        selectLabel.textContent = 'Selecciona un modelo de contenido:';
        selectLabel.htmlFor = 'wz-toc-template-select';
        const select = document.createElement('select');
        select.id = 'wz-toc-template-select';
        Object.keys(tocTemplates).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = tocTemplates[key].title;
            select.appendChild(option);
        });
        const display = document.createElement('div');
        display.id = 'wz-toc-outline-display';
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'wz-modal-buttons';
        const copyFeedback = document.createElement('span');
        copyFeedback.id = 'wz-toc-copy-feedback';
        const copyBtn = createButton('Copiar Esquema', 'wz-confirm', () => {
            const selectedKey = select.value;
            const template = tocTemplates[selectedKey];
            if (!template) return;
            const textToCopy = template.structure.map(formatLineAsHeader).join('\n\n');
            const tempTextarea = document.createElement('textarea');
            tempTextarea.style.position = 'absolute'; tempTextarea.style.left = '-9999px';
            tempTextarea.value = textToCopy;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            copyFeedback.textContent = '¡Esquema copiado!';
            setTimeout(() => { copyFeedback.textContent = ''; }, 2500);
        });
        const closeBtn = createButton('Cerrar', 'wz-cancel', () => modal.remove());
        buttonsDiv.append(copyFeedback, copyBtn, closeBtn);
        modal.append(title, selectLabel, select, display, buttonsDiv);
        document.body.appendChild(modal);

        const formatTocOutlineForDisplay = (structure) => {
            display.innerHTML = '';
            const textarea = document.querySelector('textarea.d-editor-input, #reply-control textarea, .composer-container textarea');
            structure.forEach(line => {
                const numberMatch = line.match(/^([\d\.]+)/);
                if (!numberMatch) return;
                const level = (numberMatch[1].match(/\d+/g) || []).length;
                const indent = '&nbsp;&nbsp;'.repeat(Math.max(0, level - 1));
                const item = document.createElement('div');
                item.className = 'wz-toc-item';
                item.innerHTML = indent + line;
                item.addEventListener('click', () => {
                    if (textarea) {
                        const headerText = line.replace(/^[\d\.]+\s*/, '').trim();
                        applyHeadingFormatting(textarea, level, headerText);
                    }
                });
                display.appendChild(item);
            });
        };
        const updateDisplay = () => {
            const template = tocTemplates[select.value];
            if (template) { formatTocOutlineForDisplay(template.structure); }
        };
        select.addEventListener('change', updateDisplay);
        updateDisplay();
        select.focus();

        const editorObserver = new MutationObserver(() => {
            if (!document.querySelector('div.d-editor-button-bar, div.discourse-markdown-toolbar, .editor-toolbar')) {
                modal.remove();
                editorObserver.disconnect();
            }
        });
        editorObserver.observe(document.body, { childList: true, subtree: true });
    }

    // --- Lógica de Bloques Finales (Refactorizada) ---
    const FORUM_BLOCK_IDENTIFIER = "# [wzh=1]Foro de discusión:[/wzh]";
    const FORUM_BLOCK_IMAGE = "[center]![image|128x128, 50%](upload://2cmYNNfUCAykbh8vW92usPC9Sf3.png)[/center]";
    const FORUM_BLOCK_REGEX_STR = `(?:^|\n)---\s*\n+${FORUM_BLOCK_IMAGE.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}` + `\\s*${FORUM_BLOCK_IDENTIFIER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}` + `[\\s\\S]*?` + `href="https://www\\.waze\\.com/discuss/new-topic\\?category=spain-usuarios-y-editores/wazeopedia-es/4779[^"]*">→aquí←</a>`;
    const BIO_BLOCK_IMAGE_AND_HEADER = "[center][wzh=0]![image|128x128, 50%](upload://UTuWTJ1XEX6BVzoj1FIhLjAb6i.png)[/wzh][/center]\n\n# [wzh=1]Biografía y Enlaces[/wzh]";
    const BIO_BLOCK_REGEX = /(?:^|\n)---\s*\n+\[center\]\[wzh=0\].*?\[\/wzh\]\[\/center\]\s*\n+# \[wzh=1\]Biografía y Enlaces\[\/wzh\]\s*\n([\s\S]*?)(?=\n---)/;
    const FAQ_BLOCK_HEADER = "# [wzh=1]Preguntas Frecuentes[/wzh]";
    const FAQ_BLOCK_REGEX = /(?:^|\n)---\s*\n+# \[wzh=1\]Preguntas Frecuentes\[\/wzh\]\s*\n+([\s\S]*?)\n+---\s*(?:\n|$)/;

    // (Aquí irían todas las funciones de los bloques: showFaqConfigModal, showBiographyConfigModal, etc.)

    // API Pública
    return {
        showTocGuideModal,
        showTitleConfigModal,
        showIntroductionConfigModal,
        showBiographyConfigModal,
        applyForumDiscussionFormatting,
        showFaqConfigModal
    };
})();
