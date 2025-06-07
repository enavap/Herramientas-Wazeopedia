// ==UserScript==
// @name         Wazeopedia Blocks Library
// @namespace    http://tampermonkey.net/
// @version      5.0.0
// @description  Biblioteca de lógica para bloques de contenido de Wazeopedia (Título, Bio, FAQ, etc.).
// @author       Annthizze
// @require      https://update.greasyfork.org/scripts/538610/1602967/Wazeopedia%20Core%20UI%20Library.js
// @license      MIT
// ==/UserScript==

'use strict';

// Envolvemos toda la lógica en una función para evitar la ejecución inmediata
// y la asignamos a una propiedad de `window` para un acceso global seguro.
(function() {
    // Comprobación robusta: Espera a que WazeopediaUI esté definido.
    if (typeof WazeopediaUI === 'undefined') {
        console.error("FATAL: Wazeopedia Blocks Library no puede iniciarse porque WazeopediaUI no está cargada. Verifique el orden de @require.");
        return;
    }

    // El resto de tu código de WazeopediaBlocks va aquí, dentro de una IIFE
    const WazeopediaBlocks = (function() {

        // --- CONSTANTES DE BLOQUES ---
        // (Sin cambios, van aquí)
        
        // --- FUNCIONES PRIVADAS DE LA BIBLIOTECA (Helpers) ---
        // (Sin cambios, van aquí)

        // --- API PÚBLICA DE LA BIBLIOTECA ---
        return {
            showTitleConfigModal: function(textarea) {
                // ... implementación ...
            },
            showIntroductionConfigModal: function(textarea) {
                // ... implementación ...
            },
            showBiographyConfigModal: function(textarea) {
                // ... implementación ...
            },
            applyForumDiscussionFormatting: function(textarea) {
                // ... implementación ...
            },
            showFaqConfigModal: function(textarea) {
                // ... implementación ...
            },
            // El resto de tus funciones de la API de Bloques
        };
    })(); // Fin de la IIFE de WazeopediaBlocks

    // Asignar al objeto global para que el script principal pueda usarlo.
    window.WazeopediaBlocks = WazeopediaBlocks;
    console.log("Wazeopedia Blocks Library loaded.");

})(); // Fin de la envoltura de seguridad
