// ==UserScript==
// @name         Wazeopedia Core UI Library
// @namespace    http://tampermonkey.net/
// @version      6.1.0
// @description  Biblioteca de componentes de UI (modales, botones, estilos) para las herramientas de Wazeopedia, ahora con i18n.
// @author       Annthizze
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

'use strict';

(function() {
    const WazeopediaUI = (function() {
        // --- i18n Diccionario ---
        const i18n = {
            es: { yes: 'Sí', no: 'No', accept: 'Aceptar', modalLabel: 'Mensaje emergente' },
            en: { yes: 'Yes', no: 'No', accept: 'OK', modalLabel: 'Popup message' }
        };
        let currentLang = 'es';
        function setLanguage(lang) { if (i18n[lang]) currentLang = lang; }
        function t(key) { return i18n[currentLang][key] || key; }

        // --- ESTILOS CSS ---
        function loadStyles() {
            const css = `
                /* ... (LOS MISMOS ESTILOS DE ANTES, NO SE MUESTRAN AQUÍ POR BREVEDAD) ... */
                /* --- ESTILOS GENERALES Y MODO CLARO --- */
                div.d-editor-button-bar, div.discourse-markdown-toolbar { display: flex !important; flex-wrap: wrap !important; padding-bottom: 5px !important; }
                .wz-button-container { display: inline-flex; flex-wrap: wrap; align-items: center; border-left: 1px solid #ddd; margin-left: 10px; padding-left: 10px; }
                .wz-custom-button { background-color: #32CD32; color: white; padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9em; font-weight: bold; text-shadow: 1px 1px 2px #1d6a1d; margin-left: 6px; margin-bottom: 5px; transition: background 0.2s, color 0.2s; }
                .wz-custom-button:hover { background-color: #28a428; }
                .wz-button-container > .wz-custom-button:first-child, .wz-button-container > .wz-dropdown:first-child { margin-left: 0; }
                .wz-dropdown { position: relative; display: inline-block; margin-left: 6px; margin-bottom: 5px; }
                .wz-dropdown-content { display: none; position: absolute; background-color: #f9f9f9; min-width: 160px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1001; border-radius: 4px; border: 1px solid #ddd; }
                .wz-dropdown-content.wz-show { display: block; }
                .wz-dropdown-content button { color: black; padding: 8px 12px; text-decoration: none; display: block; width: 100%; text-align: left; background-color: transparent; border: none; cursor: pointer; font-size: 0.95em; }
                .wz-dropdown-content button:hover { background-color: #e9e9e9; }
                .wz-dropdown-content hr { margin: 4px 8px; border-color: #ddd; border-style: solid; border-width: 1px 0 0 0; }
                .wz-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
                .wz-modal-content { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); min-width: 400px; max-width: 700px; text-align: left; max-height: 85vh; display: flex; flex-direction: column; }
                .wz-modal-content h3 { margin-top: 0; margin-bottom: 15px; text-align: center; color: #333; }
                .wz-modal-content p { margin-bottom: 15px; font-size: 1em; color: #333; }
                .wz-modal-content label { display: block; margin-bottom: 5px; font-weight: bold; color: #444; }
                .wz-modal-content input[type="text"], .wz-modal-content textarea, .wz-modal-content select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px; font-size: 1em; box-sizing: border-box; }
                .wz-modal-content textarea { min-height: 60px; }
                .wz-modal-content .wz-checkbox-group { margin-bottom: 10px; display: flex; align-items: center; }
                .wz-modal-content .wz-checkbox-group input[type="checkbox"] { margin-right: 8px; }
                .wz-modal-content .wz-hidden-section { display: none; }
                .wz-modal-scrollable-content { overflow-y: auto; flex-grow: 1; padding-right: 10px; }
                .wz-modal-buttons { text-align: right; margin-top: 20px; padding-top:10px; border-top: 1px solid #eee;}
                .wz-modal-buttons button { padding: 8px 15px; margin-left: 10px; border-radius: 4px; border: 1px solid #ccc; cursor: pointer; font-size: 0.9em; }
                .wz-modal-buttons button.wz-confirm { background-color: #4CAF50; color: white; border-color: #4CAF50; }
                .wz-modal-buttons button.wz-cancel { background-color: #f44336; color: white; border-color: #f44336; }
                .wz-toc-guide-modal { position: fixed; top: 20px; right: 20px; width: 450px; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); z-index: 2100; display: flex; flex-direction: column; max-height: 90vh; }
                .wz-toc-guide-modal select { width: 100%; margin-bottom: 10px; padding: 8px; }
                #wz-toc-outline-display { background-color: #f4f4f4; border: 1px solid #ddd; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.9em; flex-grow: 1; overflow-y: auto; }
                .wz-toc-item { padding: 4px 8px; border-radius: 3px; cursor: pointer; white-space: pre; }
                .wz-toc-item:hover { background-color: #d4edff; color: #004085; }
                #wz-toc-copy-feedback { color: green; font-style: italic; display: inline-block; margin-right: auto; }
                .wz-bio-entry details, .wz-faq-entry details { border: 1px solid #eee; border-radius: 4px; margin-bottom: 10px; }
                .wz-bio-entry summary, .wz-faq-entry summary { padding: 10px; background-color: #f9f9f9; cursor: pointer; font-weight: bold; border-radius: 3px 3px 0 0; color: #555; }
                .wz-bio-entry summary:hover, .wz-faq-entry summary:hover { background-color: #efefef; }
                .wz-bio-entry details[open] summary, .wz-faq-entry details[open] summary { background-color: #e0e0e0; }
                .wz-bio-entry .wz-bio-entry-content, .wz-faq-entry .wz-faq-entry-content { padding: 10px; border-top: 1px solid #eee; }
                .wz-bio-entry .wz-bio-remove-btn, .wz-faq-entry .wz-faq-remove-btn { background-color: #ff6b6b; color:white; border:none; padding: 5px 10px; border-radius:3px; cursor:pointer; float:right; margin-left:10px; }
                .wz-bio-add-entry-btn, .wz-faq-add-entry-btn { display:block; margin: 10px auto 0; padding: 8px 15px; }
                .wz-bio-modal-error, .wz-title-modal-error, .wz-faq-modal-error { color: #D32F2F; font-size: 0.9em; text-align: center; margin-bottom: 10px; padding: 5px; border: 1px solid #ffcdd2; background-color: #ffebee; border-radius: 4px; }
                .wz-bio-preview-label, .wz-faq-preview-label { font-weight: bold; margin-top:10px; margin-bottom:3px; font-size:0.9em; color: #444;}
                .wz-bio-entry-preview, .wz-faq-entry-preview { margin-top: 5px; padding: 8px; background-color: #f0f0f0; color: #333; border: 1px dashed #ccc; border-radius: 4px; font-size: 0.9em; white-space: pre-line;}
                .wz-bio-entry-preview a, .wz-faq-entry-preview a { color: blue; text-decoration: underline; cursor: help; }
                /* --- ESTILOS MODO OSCURO --- */
                .wz-dark-mode .wz-button-container { border-left-color: #555; }
                .wz-dark-mode .wz-custom-button { background-color: #3a3a3a; color: #e0e0e0; border: 1px solid #555; text-shadow: none; }
                .wz-dark-mode .wz-custom-button:hover { background-color: #007bff; border-color: #007bff; color: white; }
                .wz-dark-mode .wz-modal-content, .wz-dark-mode .wz-toc-guide-modal { background-color: #2b2b2b; color: #e0e0e0; border: 1px solid #555; }
                .wz-dark-mode .wz-modal-content h3, .wz-dark-mode .wz-modal-content p, .wz-dark-mode .wz-modal-content label { color: #e0e0e0; }
                .wz-dark-mode .wz-modal-content input[type="text"], .wz-dark-mode .wz-modal-content textarea, .wz-dark-mode .wz-modal-content select, .wz-dark-mode .wz-toc-guide-modal select { background-color: #272727; color: #e0e0e0; border: 1px solid #555; }
                .wz-dark-mode .wz-modal-content input[type="text"]:focus, .wz-dark-mode .wz-modal-content textarea:focus, .wz-dark-mode .wz-modal-content select:focus { border-color: #007bff; box-shadow: 0 0 3px #007bff; }
                .wz-dark-mode .wz-modal-buttons { border-top-color: #444; }
                .wz-dark-mode .wz-modal-buttons button.wz-confirm { background-color: #007bff; border-color: #007bff; }
                .wz-dark-mode .wz-modal-buttons button.wz-cancel { background-color: #555; border-color: #555; color: #e0e0e0; }
                .wz-dark-mode .wz-dropdown-content { background-color: #3a3a3a; border: 1px solid #555; }
                .wz-dark-mode .wz-dropdown-content button { color: #e0e0e0; }
                .wz-dark-mode .wz-dropdown-content button:hover { background-color: #007bff; color: white; }
                .wz-dark-mode .wz-dropdown-content hr { border-color: #555; }
                .wz-dark-mode #wz-toc-outline-display { background-color: #3a3a3a; color: #e0e0e0; border-color: #555; }
                .wz-dark-mode .wz-toc-item:hover { background-color: #007bff; color: white; }
                .wz-dark-mode #wz-toc-copy-feedback { color: #28a745; }
                .wz-dark-mode .wz-bio-entry details, .wz-dark-mode .wz-faq-entry details { border-color: #444; }
                .wz-dark-mode .wz-bio-entry summary, .wz-dark-mode .wz-faq-entry summary { background-color: #3a3a3a; color: #e0e0e0; }
                .wz-dark-mode .wz-bio-entry summary:hover, .wz-dark-mode .wz-faq-entry summary:hover { background-color: #4a4a4a; }
                .wz-dark-mode .wz-bio-entry details[open] summary, .wz-dark-mode .wz-faq-entry details[open] summary { background-color: #007bff; color: white; }
                .wz-dark-mode .wz-bio-entry .wz-bio-entry-content, .wz-dark-mode .wz-faq-entry .wz-faq-entry-content { border-top-color: #444; }
                .wz-dark-mode .wz-bio-entry-preview, .wz-dark-mode .wz-faq-entry-preview { background-color: #3a3a3a; color: #e0e0e0; border-color: #555; }
                .wz-dark-mode .wz-bio-modal-error, .wz-dark-mode .wz-title-modal-error, .wz-dark-mode .wz-faq-modal-error { background-color: #5d3434; color: #ffcdd2; border-color: #8b4444; }
                .wz-dark-mode .wz-forum-update-modal-item { background-color: #3a3a3a; border-color: #555; }
                .wz-dark-mode .wz-forum-update-modal-item .label { color: #bbb; }
                .wz-dark-mode .wz-forum-update-modal-item .value { background-color: #2b2b2b; border-color: #555; }
            `;
            if (typeof GM_addStyle === 'function') { GM_addStyle(css); }
            else { let style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); }
        }

        // --- Gestión de eventos global ---
        function globalEventListener(event) {
            if (!event.target.closest('.wz-dropdown')) { publicApi.closeAllDropdowns(); }
        }
        document.addEventListener('click', globalEventListener);

        // --- Funciones Públicas ---
        const publicApi = {
            setLanguage,
            getLanguage: () => currentLang,

            // --- Lógica de Desplegables ---
            closeAllDropdowns: function() {
                document.querySelectorAll('.wz-dropdown-content.wz-show').forEach(dd => dd.classList.remove('wz-show'));
            },
            toggleDropdown: function(dropdownContentElement) {
                if (!dropdownContentElement) return;
                const isCurrentlyShown = dropdownContentElement.classList.contains('wz-show');
                publicApi.closeAllDropdowns();
                if (!isCurrentlyShown) {
                    dropdownContentElement.classList.add('wz-show');
                }
            },

            // --- Funciones de Utilidad de Texto ---
            insertTextAtCursor: function(textarea, text, cursorOffsetInfo = false) {
                if (!textarea || typeof textarea.value !== 'string' || typeof text !== 'string') return;
                const start = textarea.selectionStart, end = textarea.selectionEnd;
                const textBefore = textarea.value.substring(0, start), textAfter = textarea.value.substring(end);
                textarea.value = textBefore + text + textAfter;
                if (cursorOffsetInfo && typeof cursorOffsetInfo.position === 'number') {
                    textarea.selectionStart = textarea.selectionEnd = start + cursorOffsetInfo.position;
                } else if (cursorOffsetInfo === false) {
                    textarea.selectionStart = start;
                    textarea.selectionEnd = start + text.length;
                } else {
                    textarea.selectionStart = textarea.selectionEnd = start + text.length;
                }
                textarea.focus();
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            },

            // --- Funciones de Modal General ---
            closeAllModals: function() {
                document.querySelectorAll('.wz-modal-overlay, .wz-toc-guide-modal').forEach(modal => modal.remove());
            },
            createButton: function(text, className, onClick) {
                const button = document.createElement('button');
                button.textContent = text;
                button.className = className;
                button.onclick = onClick;
                return button;
            },
            setupModalEscape: function(overlay) {
                const escapeHandler = e => {
                    if (e.key === 'Escape') {
                        publicApi.closeAllModals();
                        document.removeEventListener('keydown', escapeHandler);
                    }
                };
                overlay.tabIndex = -1;
                overlay.focus();
                document.addEventListener('keydown', escapeHandler, { once: true });
            },
            showModal: function(message, type = 'alert', callback, isSubModal = false) {
                if (!isSubModal) publicApi.closeAllModals();
                const overlay = document.createElement('div');
                overlay.className = 'wz-modal-overlay';
                overlay.setAttribute('role', 'dialog');
                if (isSubModal) overlay.style.zIndex = 2000 + document.querySelectorAll('.wz-modal-overlay').length;
                const content = document.createElement('div');
                content.className = 'wz-modal-content';
                const messageP = document.createElement('p');
                messageP.style.textAlign = 'center';
                messageP.textContent = message;
                content.appendChild(messageP);
                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'wz-modal-buttons';
                buttonsDiv.style.textAlign = 'center';

                if (type === 'confirm') {
                    buttonsDiv.appendChild(publicApi.createButton(t('yes'), 'wz-confirm', () => { publicApi.closeAllModals(); if (callback) callback(true); }));
                    buttonsDiv.appendChild(publicApi.createButton(t('no'), 'wz-cancel', () => { publicApi.closeAllModals(); if (callback) callback(false); }));
                } else {
                    buttonsDiv.appendChild(publicApi.createButton(t('accept'), 'wz-confirm', () => { overlay.remove(); if (callback) callback(true); }));
                }

                content.appendChild(buttonsDiv);
                overlay.appendChild(content);
                document.body.appendChild(overlay);
                publicApi.setupModalEscape(overlay);
            },
            
            // --- NUEVAS FUNCIONES AÑADIDAS ---
            applyHrFormatting: function(textarea) {
                publicApi.insertTextAtCursor(textarea, '\n\n---\n\n');
            },
            applyHeadingFormatting: function(textarea, level) {
                const prefix = '#'.repeat(level) + ' ';
                publicApi.insertTextAtCursor(textarea, prefix, { position: prefix.length });
            },
            showTocGuideModal: function(textarea, tocTemplates) {
                publicApi.closeAllModals();
                const modal = document.createElement('div');
                modal.className = 'wz-modal-overlay';
                modal.innerHTML = `
                    <div class="wz-toc-guide-modal">
                        <h3>Guía de Tabla de Contenidos (TOC)</h3>
                        <p>Selecciona una plantilla para generar la estructura.</p>
                        <select id="wz-toc-template-select">
                            <option value="">-- Seleccionar Plantilla --</option>
                            ${Object.keys(tocTemplates).map(key => `<option value="${key}">${tocTemplates[key].title}</option>`).join('')}
                        </select>
                        <div id="wz-toc-outline-display">Selecciona una plantilla para ver la estructura.</div>
                        <div class="wz-modal-buttons">
                            <span id="wz-toc-copy-feedback" style="display:none;">¡Copiado!</span>
                            <button id="wz-toc-copy-btn" class="wz-confirm">Copiar al Portapapeles</button>
                            <button id="wz-toc-close-btn" class="wz-cancel">Cerrar</button>
                        </div>
                    </div>`;
                document.body.appendChild(modal);

                const select = modal.querySelector('#wz-toc-template-select');
                const display = modal.querySelector('#wz-toc-outline-display');
                const copyBtn = modal.querySelector('#wz-toc-copy-btn');
                const closeBtn = modal.querySelector('#wz-toc-close-btn');
                const feedback = modal.querySelector('#wz-toc-copy-feedback');

                select.onchange = () => {
                    const selectedKey = select.value;
                    if (selectedKey && tocTemplates[selectedKey]) {
                        const structure = tocTemplates[selectedKey].structure;
                        display.innerHTML = structure.map(item => `<div class="wz-toc-item">${item}</div>`).join('');
                    } else {
                        display.textContent = 'Selecciona una plantilla para ver la estructura.';
                    }
                };

                copyBtn.onclick = () => {
                    const selectedKey = select.value;
                    if (selectedKey && tocTemplates[selectedKey]) {
                        const tocText = tocTemplates[selectedKey].structure.map(item => {
                            const level = (item.match(/^\d+(\.\d+)*/) || [''])[0].split('.').length;
                            const text = item.replace(/^\d+(\.\d+)*\s*/, '');
                            return `${'#'.repeat(level)} ${text}`;
                        }).join('\n\n');

                        navigator.clipboard.writeText(tocText).then(() => {
                            feedback.style.display = 'inline-block';
                            setTimeout(() => { feedback.style.display = 'none'; }, 2000);
                        });
                    }
                };
                closeBtn.onclick = publicApi.closeAllModals;
                publicApi.setupModalEscape(modal);
            }
        };

        loadStyles();
        return publicApi;
    })();

    window.WazeopediaUI = WazeopediaUI;
    console.log('Wazeopedia Core UI Library 6.1.0 loaded.');
})();
