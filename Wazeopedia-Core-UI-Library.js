// ==UserScript==
// @name         Wazeopedia Core UI Library
// @namespace    http://tampermonkey.net/
// @version      6.5.0
// @description  Biblioteca de componentes de UI (modales, botones, estilos) para las herramientas de Wazeopedia.
// @author       Annthizze
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

'use strict';
(function() {
    const WazeopediaUI = (function() {
        const i18n = { es: { yes: 'Sí', no: 'No', accept: 'Aceptar', modalLabel: 'Mensaje emergente' }, en: { yes: 'Yes', no: 'No', accept: 'OK', modalLabel: 'Popup message' } };
        let currentLang = 'es';
        function setLanguage(lang) { if (i18n[lang]) currentLang = lang; }
        function t(key) { return i18n[currentLang][key] || key; }
        
        function loadStyles() {
            const css = `
                /* ... (Estilos anteriores) ... */
                /* *** NUEVOS ESTILOS PARA LA BARRA DE HERRAMIENTAS DE FORMATO *** */
                .wz-format-toolbar {
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    border-bottom: none;
                    padding: 4px;
                    display: flex;
                    gap: 5px;
                    border-radius: 4px 4px 0 0;
                }
                .wz-format-toolbar button {
                    background: none;
                    border: 1px solid transparent;
                    border-radius: 3px;
                    cursor: pointer;
                    padding: 3px 6px;
                    font-weight: bold;
                    font-family: sans-serif;
                    font-size: 14px;
                    color: #333;
                    min-width: 28px;
                }
                .wz-format-toolbar button:hover {
                    background-color: #e0e0e0;
                    border-color: #bbb;
                }
                .wz-dark-mode .wz-format-toolbar {
                    background-color: #3a3a3a;
                    border-color: #555;
                }
                .wz-dark-mode .wz-format-toolbar button {
                    color: #e0e0e0;
                }
                .wz-dark-mode .wz-format-toolbar button:hover {
                    background-color: #4a4a4a;
                    border-color: #777;
                }
            `;
            if (typeof GM_addStyle === 'function') { GM_addStyle(css); } else { let style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); }
        }

        function globalEventListener(event) { if (!event.target.closest('.wz-dropdown')) { publicApi.closeAllDropdowns(); } }
        document.addEventListener('click', globalEventListener);
        
        const publicApi = {
            setLanguage, getLanguage: () => currentLang,
            closeAllDropdowns: function() { document.querySelectorAll('.wz-dropdown-content.wz-show').forEach(dd => dd.classList.remove('wz-show')); },
            toggleDropdown: function(dropdownContentElement) { if (!dropdownContentElement) return; const isCurrentlyShown = dropdownContentElement.classList.contains('wz-show'); publicApi.closeAllDropdowns(); if (!isCurrentlyShown) dropdownContentElement.classList.add('wz-show'); },
            
            // *** FUNCIÓN DE INSERCIÓN MEJORADA PARA SOPORTAR ENVOLTURA ***
            insertTextAtCursor: function(textarea, text, cursorConfig = {}) {
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                // Nueva lógica para envolver texto seleccionado
                if (cursorConfig.wrap) {
                    const selectedText = textarea.value.substring(start, end);
                    const [before, after] = cursorConfig.wrap;
                    const newText = before + selectedText + after;
                    
                    textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
                    textarea.selectionStart = start + before.length;
                    textarea.selectionEnd = start + before.length + selectedText.length;

                } else { // Lógica existente
                    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
                    if (cursorConfig.select) { textarea.selectionStart = start; textarea.selectionEnd = start + text.length; }
                    else if (typeof cursorConfig.position === 'number') { textarea.selectionStart = textarea.selectionEnd = start + cursorConfig.position; }
                    else { textarea.selectionStart = textarea.selectionEnd = start + text.length; }
                }
                
                textarea.focus();
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            },
            
            closeAllModals: function() { document.querySelectorAll('.wz-modal-overlay, .wz-toc-guide-modal').forEach(modal => modal.remove()); },
            createButton: function(text, className, onClick) { const button = document.createElement('button'); button.textContent = text; button.className = className; button.onclick = onClick; return button; },
            setupModalEscape: function(overlay) { const escapeHandler = e => { if (e.key === 'Escape') { publicApi.closeAllModals(); document.removeEventListener('keydown', escapeHandler); } }; overlay.tabIndex = -1; overlay.focus(); document.addEventListener('keydown', escapeHandler, { once: true }); },
            showModal: function(message, type = 'alert', callback, isSubModal = false) { if (!isSubModal) publicApi.closeAllModals(); const overlay = document.createElement('div'); overlay.className = 'wz-modal-overlay'; overlay.setAttribute('role', 'dialog'); if (isSubModal) overlay.style.zIndex = 2000 + document.querySelectorAll('.wz-modal-overlay').length; const content = document.createElement('div'); content.className = 'wz-modal-content'; const messageP = document.createElement('p'); messageP.style.textAlign = 'center'; messageP.textContent = message; content.appendChild(messageP); const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'wz-modal-buttons'; buttonsDiv.style.textAlign = 'center'; if (type === 'confirm') { buttonsDiv.appendChild(publicApi.createButton(t('yes'), 'wz-confirm', () => { publicApi.closeAllModals(); if (callback) callback(true); })); buttonsDiv.appendChild(publicApi.createButton(t('no'), 'wz-cancel', () => { publicApi.closeAllModals(); if (callback) callback(false); })); } else { buttonsDiv.appendChild(publicApi.createButton(t('accept'), 'wz-confirm', () => { overlay.remove(); if (callback) callback(true); })); } content.appendChild(buttonsDiv); overlay.appendChild(content); document.body.appendChild(overlay); publicApi.setupModalEscape(overlay); },
            applyHrFormatting: function(textarea) { const textBefore = textarea.value.substring(0, textarea.selectionStart); let textToInsert = '---'; if (!textBefore.endsWith('\n\n')) { textToInsert = (textBefore.endsWith('\n') ? '\n' : '\n\n') + textToInsert; } textToInsert += '\n\n'; publicApi.insertTextAtCursor(textarea, textToInsert); },
            applyHeadingFormatting: function(textarea, level, text = '') { const selectedText = text || textarea.value.substring(textarea.selectionStart, textarea.selectionEnd); const markdownPrefix = '#'.repeat(level) + ' '; const wzhTagOpen = `[wzh=${level}]`; const wzhTagClose = `[/wzh]`; let coreText = selectedText ? `${wzhTagOpen}${selectedText}${wzhTagClose}` : `${wzhTagOpen}${wzhTagClose}`; let textToInsert = markdownPrefix + coreText; const textBeforeSelection = textarea.value.substring(0, textarea.selectionStart); if (textarea.selectionStart > 0 && !textBeforeSelection.endsWith('\n\n')) { textToInsert = (textBeforeSelection.endsWith('\n') ? '\n' : '\n\n') + textToInsert; } const cursorPosition = selectedText ? textToInsert.length : (textToInsert.length - wzhTagClose.length); publicApi.insertTextAtCursor(textarea, textToInsert, { position: cursorPosition }); },
            showTocGuideModal: function(textarea, tocTemplates) { publicApi.closeAllModals(); const modal = document.createElement('div'); modal.className = 'wz-toc-guide-modal'; modal.innerHTML = `<h3>Guía de Plantillas TOC</h3><select id="wz-toc-template-select"></select><div id="wz-toc-outline-display"></div><div class="wz-modal-buttons"><button id="wz-toc-insert-btn" class="wz-confirm">Insertar Esquema</button><button id="wz-toc-close-btn" class="wz-cancel">Cerrar</button></div>`; document.body.appendChild(modal); const select = modal.querySelector('#wz-toc-template-select'); const display = modal.querySelector('#wz-toc-outline-display'); Object.keys(tocTemplates).forEach(key => { const option = document.createElement('option'); option.value = key; option.textContent = tocTemplates[key].title; select.appendChild(option); }); const updateDisplay = () => { const template = tocTemplates[select.value]; if (!template) return; display.innerHTML = ''; template.structure.forEach(line => { const numberMatch = line.match(/^([\d\.]+)/); if (!numberMatch) return; const level = (numberMatch[1].match(/\d+/g) || []).length; const indent = '  '.repeat(Math.max(0, level - 1)); const item = document.createElement('div'); item.className = 'wz-toc-item'; item.innerHTML = indent + line; item.onclick = () => { const headerText = line.replace(/^[\d\.]+\s*/, '').trim(); publicApi.applyHeadingFormatting(textarea, level, headerText); }; display.appendChild(item); }); }; modal.querySelector('#wz-toc-insert-btn').onclick = () => { const template = tocTemplates[select.value]; if (!template) return; const textToInsert = template.structure.map(line => { const text = line.replace(/^[\d\.]+\s*/, '').trim(); const level = (line.match(/^([\d\.]+)/)[1].match(/\d+/g) || []).length; return `${'#'.repeat(level)} [wzh=${level}]${text}[/wzh]`; }).join('\n\n'); publicApi.insertTextAtCursor(textarea, textToInsert); publicApi.closeAllModals(); }; select.onchange = updateDisplay; modal.querySelector('#wz-toc-close-btn').onclick = publicApi.closeAllModals; updateDisplay(); publicApi.setupModalEscape(modal); },
            
            // *** NUEVA FUNCIÓN PARA CREAR LA BARRA DE HERRAMIENTAS ***
            createFormattingToolbar: function(textarea, buttonsToShow = ['bold', 'italic', 'link']) {
                const toolbar = document.createElement('div');
                toolbar.className = 'wz-format-toolbar';

                const buttonActions = {
                    'bold': { label: 'B', title: 'Negrita', action: () => publicApi.insertTextAtCursor(textarea, '', { wrap: ['**', '**'] }) },
                    'italic': { label: 'I', title: 'Cursiva', style: 'font-style: italic;', action: () => publicApi.insertTextAtCursor(textarea, '', { wrap: ['*', '*'] }) },
                    'link': { label: '🔗', title: 'Hipervínculo', action: () => {
                        const url = prompt("Introduce la URL del enlace:");
                        if (url) {
                            publicApi.insertTextAtCursor(textarea, '', { wrap: [`[`, `](${url})`] });
                        }
                    }},
                    'quote': { label: '“', title: 'Cita', action: () => publicApi.insertTextAtCursor(textarea, '> ', { position: 2 }) },
                    // El botón de emojis de Discourse es complejo de replicar, por ahora usamos el del sistema
                    'emoji': { label: '😀', title: 'Emojis', action: () => UI.showModal("Usa el selector de emojis de tu sistema (Tecla Windows + .)", "alert") }
                };

                buttonsToShow.forEach(key => {
                    if (buttonActions[key]) {
                        const config = buttonActions[key];
                        const button = document.createElement('button');
                        button.innerHTML = config.label;
                        button.title = config.title;
                        if (config.style) button.style.cssText = config.style;
                        button.onclick = (e) => {
                            e.preventDefault();
                            config.action();
                        };
                        toolbar.appendChild(button);
                    }
                });
                
                // Inserta la barra de herramientas justo antes del textarea
                textarea.parentNode.insertBefore(toolbar, textarea);
                // Ajusta el estilo del textarea para que coincida con la barra
                textarea.style.borderTopLeftRadius = '0';
                textarea.style.borderTopRightRadius = '0';
                textarea.style.borderTop = 'none';

                return toolbar;
            }
        };
        
        loadStyles();
        return publicApi;
    })();

    if (window.WazeopediaUI) { console.warn('Wazeopedia UI Library está siendo cargada de nuevo.'); }
    else { window.WazeopediaUI = WazeopediaUI; console.log('Wazeopedia Core UI Library 6.5.0 loaded.'); }
})();
