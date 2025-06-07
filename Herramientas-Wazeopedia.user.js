// ==UserScript==
// @name         Herramientas Wazeopedia
// @namespace    http://tampermonkey.net/
// @version      5.0.0
// @description  Añade botones y herramientas para la edición en Wazeopedia desde el foro de Waze (Discourse).
// @author       Annthizze
// @match        https://www.waze.com/discuss/*
// @require      https://update.greasyfork.org/scripts/538610/1603321/Wazeopedia%20Core%20UI%20Library.js
// @require      https://update.greasyfork.org/scripts/538615/1603316/Wazeopedia%20Blocks-Library.js
// @grant        GM_info
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/YOUR_MAIN_SCRIPT_ID/Herramientas%20Wazeopedia.user.js
// @updateURL    https://update.greasyfork.org/scripts/YOUR_MAIN_SCRIPT_ID/Herramientas%20Wazeopedia.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Mecanismo de seguridad: Esperar a que las bibliotecas estén cargadas.
    // Esto previene errores si el script se ejecuta antes de que los @require terminen.
    if (typeof WazeopediaUI === 'undefined' || typeof window.WazeopediaBlocks === 'undefined') {
        console.error("FATAL: El script principal de Herramientas Wazeopedia no puede iniciarse. Faltan bibliotecas.");
        // Opcional: reintentar tras un breve lapso
        setTimeout(arguments.callee, 100);
        return;
    }

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
            action: () => WazeopediaUI.showTocGuideModal(tocTemplates)
        },
        {
            id: 'wz-btn-hr',
            text: '---',
            title: 'Insertar línea horizontal',
            action: WazeopediaUI.applyHrFormatting
        },
        {
            id: 'wz-btn-headings',
            text: 'H↕',
            title: 'Insertar Encabezado (H1-H6)',
            isDropdown: true,
            dropdownItems: [
                { text: 'H1', title: 'Insertar Encabezado de Nivel 1', action: (textarea) => WazeopediaUI.applyHeadingFormatting(textarea, 1) },
                { text: 'H2', title: 'Insertar Encabezado de Nivel 2', action: (textarea) => WazeopediaUI.applyHeadingFormatting(textarea, 2) },
                { text: 'H3', title: 'Insertar Encabezado de Nivel 3', action: (textarea) => WazeopediaUI.applyHeadingFormatting(textarea, 3) },
                { text: 'H4', title: 'Insertar Encabezado de Nivel 4', action: (textarea) => WazeopediaUI.applyHeadingFormatting(textarea, 4) },
                { text: 'H5', title: 'Insertar Encabezado de Nivel 5', action: (textarea) => WazeopediaUI.applyHeadingFormatting(textarea, 5) },
                { text: 'H6', title: 'Insertar Encabezado de Nivel 6', action: (textarea) => WazeopediaUI.applyHeadingFormatting(textarea, 6) },
            ]
        },
        {
            id: 'wz-btn-blocks-dropdown',
            text: '🧱 Bloques',
            title: 'Insertar bloques de contenido comunes',
            isDropdown: true,
            dropdownItems: [
                { text: '👑 Título y Estado', title: 'Insertar/Editar bloque de Título y Estado', action: window.WazeopediaBlocks.showTitleConfigModal },
                { text: '📰 Introducción', title: 'Insertar/Editar bloque de Introducción', action: window.WazeopediaBlocks.showIntroductionConfigModal },
                { text: '📜 Biografía', title: 'Insertar/Editar bloque de Biografía y Enlaces', action: window.WazeopediaBlocks.showBiographyConfigModal },
                { text: '💬 Foro Discusión', title: 'Insertar/Actualizar bloque de Foro de Discusión', action: window.WazeopediaBlocks.applyForumDiscussionFormatting },
                { isSeparator: true },
                { text: '❔ FAQs', title: 'Insertar/Editar bloque de Preguntas Frecuentes', action: window.WazeopediaBlocks.showFaqConfigModal }
            ]
        }
    ];

    // --- MONTAJE E INICIALIZACIÓN ---
    function addCustomButtons() {
        const editorToolbar = document.querySelector('div.d-editor-button-bar, div.discourse-markdown-toolbar, .editor-toolbar');
        if (!editorToolbar || editorToolbar.querySelector('.wz-button-container')) return;

        let buttonBarContainer = document.createElement('div');
        buttonBarContainer.className = 'wz-button-container';
        const lastGroup = Array.from(editorToolbar.children).filter(el => el.matches('.btn-group, button')).pop();
        if (lastGroup) lastGroup.insertAdjacentElement('afterend', buttonBarContainer); else editorToolbar.appendChild(buttonBarContainer);
        
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
                            if (typeof item.action === 'function') item.action(textarea);
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
                    if (typeof config.action === 'function') config.action(textarea);
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

    const editorObserver = new MutationObserver(addCustomButtons);

    // Iniciar el script
    editorObserver.observe(document.body, { childList: true, subtree: true });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    addCustomButtons();
    applyTheme();

    console.log(`Herramientas Wazeopedia: Script cargado y observando (v${GM_info.script.version}).`);
})();
