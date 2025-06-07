// ==UserScript==
// @name         Herramientas Wazeopedia
// @namespace    http://tampermonkey.net/
// @version      3.1.5
// @description  Añade botones y herramientas para la edición en Wazeopedia desde el foro de Waze (Discourse).
// @author       Annthizze
// @match        https://www.waze.com/discuss/*
// @require      https://update.greasyfork.org/scripts/538610/1603073/Wazeopedia%20Core%20UI%20Library.js
// @require      https://update.greasyfork.org/scripts/538615/1603086/Wazeopedia%20Blocks-Library.js
// @grant        GM_info
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/YOUR_MAIN_SCRIPT_ID/Herramientas%20Wazeopedia.user.js
// @updateURL    https://update.greasyfork.org/scripts/YOUR_MAIN_SCRIPT_ID/Herramientas%20Wazeopedia.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // --- ESTRUCTURA DE DATOS PARA PLANTILLAS DE TOC ---
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

    // --- CONFIGURACIÓN DE BOTONES (usa funciones de las bibliotecas) ---
    const buttonConfigs = [{
            id: 'wz-btn-toc',
            text: 'TOC',
            title: 'Mostrar guía de Tabla de Contenidos',
            action: showTocGuideModal
        },
        {
            id: 'wz-btn-hr',
            text: '---',
            title: 'Insertar línea horizontal',
            action: applyHrFormatting
        },
        {
            id: 'wz-btn-headings',
            text: 'H↕',
            title: 'Insertar Encabezado (H1-H6)',
            isDropdown: true,
            dropdownItems: [
                { text: 'H1', title: 'Insertar Encabezado de Nivel 1', action: (textarea) => applyHeadingFormatting(textarea, 1) },
                { text: 'H2', title: 'Insertar Encabezado de Nivel 2', action: (textarea) => applyHeadingFormatting(textarea, 2) },
                { text: 'H3', title: 'Insertar Encabezado de Nivel 3', action: (textarea) => applyHeadingFormatting(textarea, 3) },
                { text: 'H4', title: 'Insertar Encabezado de Nivel 4', action: (textarea) => applyHeadingFormatting(textarea, 4) },
                { text: 'H5', title: 'Insertar Encabezado de Nivel 5', action: (textarea) => applyHeadingFormatting(textarea, 5) },
                { text: 'H6', title: 'Insertar Encabezado de Nivel 6', action: (textarea) => applyHeadingFormatting(textarea, 6) },
            ]
        },
        {
            id: 'wz-btn-blocks-dropdown',
            text: '🧱 Bloques',
            title: 'Insertar bloques de contenido comunes',
            isDropdown: true,
            dropdownItems: [
                { text: '👑 Título y Estado', title: 'Insertar/Editar bloque de Título y Estado', action: WazeopediaBlocks.showTitleConfigModal },
                { text: '📰 Introducción', title: 'Insertar/Editar bloque de Introducción', action: WazeopediaBlocks.showIntroductionConfigModal },
                { text: '📜 Biografía', title: 'Insertar/Editar bloque de Biografía y Enlaces', action: WazeopediaBlocks.showBiographyConfigModal },
                { text: '💬 Foro Discusión', title: 'Insertar/Actualizar bloque de Foro de Discusión', action: WazeopediaBlocks.applyForumDiscussionFormatting },
                { isSeparator: true },
                { text: '❔ FAQs', title: 'Insertar/Editar bloque de Preguntas Frecuentes', action: WazeopediaBlocks.showFaqConfigModal }
            ]
        }
    ];

    // --- FUNCIONES DE HERRAMIENTAS (no son bloques) ---

    function applyHeadingFormatting(textarea, level, text = '') {
        const selectedText = text || textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        const markdownPrefix = '#'.repeat(level) + ' ';
        const wzhTagOpen = `[wzh=${level}]`; const wzhTagClose = `[/wzh]`;
        let coreText = selectedText ? `${markdownPrefix}${wzhTagOpen}${selectedText}${wzhTagClose}` : `${markdownPrefix}${wzhTagOpen}${wzhTagClose}`;
        const textBeforeSelection = textarea.value.substring(0, textarea.selectionStart);
        let prefix = "";
        if (textarea.selectionStart > 0 && !textBeforeSelection.endsWith("\n\n") && !textBeforeSelection.endsWith("\n")) { prefix = "\n\n"; }
        else if (textarea.selectionStart > 0 && textBeforeSelection.endsWith("\n") && !textBeforeSelection.endsWith("\n\n")) { prefix = "\n"; }
        let textToInsert = prefix + coreText;
        const cursorPosition = selectedText ? textToInsert.length : (prefix + markdownPrefix + wzhTagOpen).length;
        WazeopediaUI.insertTextAtCursor(textarea, textToInsert, { position: cursorPosition });
    }

    function applyHrFormatting(textarea) {
        let textToInsert = "\n---\n";
        const textBefore = textarea.value.substring(0, textarea.selectionStart);
        if (textBefore.trim() === '') { textToInsert = "---\n\n"; }
        else if (!textBefore.endsWith('\n\n')) { textToInsert = (textBefore.endsWith('\n') ? '\n' : '\n\n') + '---'; }
        else { textToInsert = '---'; }
        const textAfter = textarea.value.substring(textarea.selectionEnd);
        if (textAfter.trim() === '') { textToInsert += '\n'; }
        else if (!textAfter.startsWith('\n\n')) { textToInsert += (textAfter.startsWith('\n') ? '\n' : '\n\n'); }
        WazeopediaUI.insertTextAtCursor(textarea, textToInsert, { position: textToInsert.length });
    }

    // --- Lógica para Guía de Plantillas TOC ---
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
        modal.innerHTML = `
            <h3>Guía de Plantillas TOC</h3>
            <label for="wz-toc-template-select">Selecciona un modelo de contenido:</label>
            <select id="wz-toc-template-select">
                ${Object.keys(tocTemplates).map(key => `<option value="${key}">${tocTemplates[key].title}</option>`).join('')}
            </select>
            <div id="wz-toc-outline-display"></div>
            <div class="wz-modal-buttons">
                <span id="wz-toc-copy-feedback"></span>
            </div>
        `;

        const display = modal.querySelector('#wz-toc-outline-display');
        const buttonsDiv = modal.querySelector('.wz-modal-buttons');
        const copyFeedback = modal.querySelector('#wz-toc-copy-feedback');
        const select = modal.querySelector('#wz-toc-template-select');

        const copyBtn = WazeopediaUI.createButton('Copiar Esquema', 'wz-confirm', () => {
            const template = tocTemplates[select.value];
            if (!template) return;
            const textToCopy = template.structure.map(formatLineAsHeader).join('\n\n');
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyFeedback.textContent = '¡Esquema copiado!';
                setTimeout(() => { copyFeedback.textContent = ''; }, 2500);
            });
        });

        const closeBtn = WazeopediaUI.createButton('Cerrar', 'wz-cancel', () => modal.remove());
        buttonsDiv.append(copyFeedback, copyBtn, closeBtn);
        document.body.appendChild(modal);

        const formatTocOutlineForDisplay = (structure) => {
            display.innerHTML = '';
            const textarea = document.querySelector('textarea.d-editor-input, #reply-control textarea, .composer-container textarea');
            structure.forEach(line => {
                const numberMatch = line.match(/^([\d\.]+)/);
                if (!numberMatch) return;
                const level = (numberMatch[1].match(/\d+/g) || []).length;
                const indent = '  '.repeat(Math.max(0, level - 1));
                const item = document.createElement('div');
                item.className = 'wz-toc-item';
                item.innerHTML = indent + line;
                item.onclick = () => {
                    if (textarea) {
                        const headerText = line.replace(/^[\d\.]+\s*/, '').trim();
                        applyHeadingFormatting(textarea, level, headerText);
                    }
                };
                display.appendChild(item);
            });
        };

        const updateDisplay = () => formatTocOutlineForDisplay(tocTemplates[select.value].structure);
        select.addEventListener('change', updateDisplay);
        updateDisplay();
        select.focus();
    }


    // --- MONTAJE E INICIALIZACIÓN ---

    function addCustomButtons() {
        if (typeof WazeopediaUI === 'undefined' || typeof WazeopediaBlocks === 'undefined') {
            console.error("Herramientas Wazeopedia: Una o más bibliotecas no se cargaron correctamente.");
            return;
        }

        const editorToolbar = document.querySelector('div.d-editor-button-bar, div.discourse-markdown-toolbar, .editor-toolbar');
        if (!editorToolbar) return;
        let buttonBarContainer = editorToolbar.querySelector('.wz-button-container');
        if (buttonBarContainer && buttonBarContainer.dataset.wzToolsProcessed === 'true') return;

        if (!buttonBarContainer) {
            buttonBarContainer = document.createElement('div');
            buttonBarContainer.className = 'wz-button-container';
            const lastGroup = Array.from(editorToolbar.children).filter(el => el.matches('.btn-group, button')).pop();
            if (lastGroup) lastGroup.insertAdjacentElement('afterend', buttonBarContainer); else editorToolbar.appendChild(buttonBarContainer);
        }
        buttonBarContainer.innerHTML = '';
        buttonBarContainer.dataset.wzToolsProcessed = 'true';

        const textarea = document.querySelector('textarea.d-editor-input, #reply-control textarea, .composer-container textarea');
        if (!textarea) return;

        buttonConfigs.forEach(config => {
            if (config.isDropdown) {
                const wrapper = document.createElement('div');
                wrapper.className = 'wz-dropdown';
                const btn = WazeopediaUI.createButton(config.text, 'wz-custom-button btn wz-dropdown-toggle', e => {
                    e.stopPropagation();
                    WazeopediaUI.toggleDropdown(btn, content);
                });
                btn.id = config.id;
                btn.title = config.title;
                const content = document.createElement('div');
                content.className = 'wz-dropdown-content';
                config.dropdownItems.forEach(item => {
                    if (item.isSeparator) {
                        content.appendChild(document.createElement('hr'));
                    } else {
                        const ddBtn = WazeopediaUI.createButton(item.text, '', e => {
                            e.stopPropagation();
                            if (typeof item.action === 'function') { item.action(textarea); }
                            WazeopediaUI.closeAllDropdowns();
                        });
                        ddBtn.title = item.title || `Insertar ${item.text}`;
                        content.appendChild(ddBtn);
                    }
                });
                wrapper.append(btn, content);
                buttonBarContainer.appendChild(wrapper);
            } else {
                const btn = WazeopediaUI.createButton(config.text, 'wz-custom-button btn', e => {
                    e.preventDefault(); e.stopPropagation();
                    if (typeof config.action === 'function') { config.action(textarea); }
                });
                btn.id = config.id;
                btn.title = config.title;
                buttonBarContainer.appendChild(btn);
            }
        });
    }

    function applyTheme() {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('wz-dark-mode', isDark);
    }

    const editorObserver = new MutationObserver(() => {
        if (document.querySelector('div.d-editor-button-bar, div.discourse-markdown-toolbar, .editor-toolbar') && !document.getElementById('wz-btn-toc')) {
            addCustomButtons();
            applyTheme();
        }
    });

    // Iniciar el script
    editorObserver.observe(document.body, { childList: true, subtree: true });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    addCustomButtons();
    applyTheme();

    console.log(`Herramientas Wazeopedia: Script cargado y observando (v${GM_info.script.version}).`);
})();
