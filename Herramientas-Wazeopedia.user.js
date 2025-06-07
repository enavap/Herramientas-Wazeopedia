// ==UserScript==
// @name         Herramientas Wazeopedia
// @namespace    http://tampermonkey.net/
// @version      4.0.0
// @description  Añade botones y herramientas para la edición en Wazeopedia desde el foro de Waze (Discourse).
// @author       Annthizze & Gemini
// @match        https://www.waze.com/discuss/*
// @grant        GM_addStyle
// @grant        GM_info
// @require      https://update.greasyfork.org/scripts/538610/1602961/Wazeopedia%20Core%20UI%20Library.js
// @require      https://update.greasyfork.org/scripts/538615/1602964/Wazeopedia%20Blocks-Library.js
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/538279/Herramientas%20Wazeopedia.user.js
// @updateURL    https://update.greasyfork.org/scripts/538279/Herramientas%20Wazeopedia.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // La configuración de los botones se mantiene en el script principal para una fácil personalización.
    // Las funciones de acción (ej: WazeopediaBlocks.showTitleConfigModal) ahora provienen de las bibliotecas.
    const buttonConfigs = [{
            id: 'wz-btn-toc',
            text: 'TOC',
            title: 'Mostrar guía de Tabla de Contenidos',
            action: (textarea) => WazeopediaBlocks.showTocGuideModal(textarea)
        },
        {
            id: 'wz-btn-hr',
            text: '---',
            title: 'Insertar línea horizontal',
            action: (textarea) => WazeopediaUI.applyHrFormatting(textarea)
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
                { text: '👑 Título y Estado', title: 'Insertar/Editar bloque de Título y Estado', action: (textarea) => WazeopediaBlocks.showTitleConfigModal(textarea) },
                { text: '📰 Introducción', title: 'Insertar/Editar bloque de Introducción', action: (textarea) => WazeopediaBlocks.showIntroductionConfigModal(textarea) },
                { text: '📜 Biografía', title: 'Insertar/Editar bloque de Biografía y Enlaces', action: (textarea) => WazeopediaBlocks.showBiographyConfigModal(textarea) },
                { text: '💬 Foro Discusión', title: 'Insertar/Actualizar bloque de Foro de Discusión', action: (textarea) => WazeopediaBlocks.applyForumDiscussionFormatting(textarea) },
                { isSeparator: true },
                { text: '❔ FAQs', title: 'Insertar/Editar bloque de Preguntas Frecuentes', action: (textarea) => WazeopediaBlocks.showFaqConfigModal(textarea) }
            ]
        }
    ];

    // Inicializa la UI y los botones usando la biblioteca Core.
    if (typeof WazeopediaUI !== 'undefined' && typeof WazeopediaBlocks !== 'undefined') {
        WazeopediaUI.init(buttonConfigs);
    } else {
        console.error("Error: Las bibliotecas de Wazeopedia no se han cargado correctamente.");
    }
    
    console.log(`Herramientas Wazeopedia: Script principal cargado (v${GM_info.script.version}).`);

})();
