// ==UserScript==
// @name         Wazeopedia Core UI Library
// @namespace    http://tampermonkey.net/
// @version      8.0.0.2
// @description  Biblioteca de componentes de UI (modales, botones, estilos) para las herramientas de Wazeopedia.
// @author       Annthizze
// @grant        GM_addStyle
// @grant        GM_info
// @license      MIT
// ==/UserScript==

'use strict';
(function() {
    if (window.WazeopediaUI) return;

    // --- Definimos todas las funciones en el ámbito principal de la IIFE ---

    const i18n = { es: { yes: 'Sí', no: 'No', accept: 'Aceptar', cancel: 'Cancelar', modalLabel: 'Mensaje emergente' }, en: { yes: 'Yes', no: 'No', accept: 'OK', cancel: 'Cancel', modalLabel: 'Popup message' } };
    let currentLang = 'es';

    function setLanguage(lang) { if (i18n[lang]) currentLang = lang; }
    function t(key) { return i18n[currentLang][key] || key; }
    
    function loadStyles() {
        const css = `
            .wz-main-toolbar { background-color: #f9f9f9; padding: 5px 8px; border: 1px solid #ddd; border-bottom: none; border-radius: 5px 5px 0 0; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
            .wz-dark-mode .wz-main-toolbar { background-color: #2b2b2b; border-color: #555; }
            .wz-button-container { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; border-left: none; margin-left: 0; padding-left: 0; }
            .wz-custom-button { background-color: #f0f0f0; color: #333; padding: 6px 12px; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; font-size: 0.9em; font-weight: bold; transition: background-color 0.2s, border-color 0.2s; }
            .wz-custom-button:hover { background-color: #e0e0e0; border-color: #bbb; }
            .wz-dark-mode .wz-custom-button { background-color: #3a3a3a; color: #e0e0e0; border: 1px solid #555; }
            .wz-dark-mode .wz-custom-button:hover { background-color: #4a4a4a; border-color: #777; }
            .wz-format-toolbar { background-color: #f0f0f0; border: 1px solid #ccc; border-bottom: none; padding: 4px; display: flex; gap: 5px; border-radius: 4px 4px 0 0; }
            .wz-format-toolbar button { background: none; border: 1px solid transparent; border-radius: 3px; cursor: pointer; padding: 3px 6px; font-weight: bold; font-family: sans-serif; font-size: 14px; color: #333; min-width: 28px; }
            .wz-format-toolbar button:hover { background-color: #e0e0e0; border-color: #bbb; }
            .wz-dark-mode .wz-format-toolbar { background-color: #3a3a3a; border-color: #555; }
            .wz-dark-mode .wz-format-toolbar button { color: #e0e0e0; }
            .wz-dark-mode .wz-format-toolbar button:hover { background-color: #4a4a4a; border-color: #777; }
            .wz-dropdown { position: relative; display: inline-block; }
            .wz-dropdown-content { display: none; position: absolute; background-color: #f9f9f9; min-width: 160px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1001; border-radius: 4px; border: 1px solid #ddd; top: 105%; }
            .wz-dropdown-content.wz-show { display: block; }
            .wz-dropdown-content button { color: black; padding: 8px 12px; text-decoration: none; display: block; width: 100%; text-align: left; background-color: transparent; border: none; cursor: pointer; font-size: 0.95em; }
            .wz-dropdown-content button:hover { background-color: #e9e9e9; }
            .wz-dropdown-content hr { margin: 4px 8px; border-color: #ddd; border-style: solid; border-width: 1px 0 0 0; }
            .wz-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
            .wz-modal-content { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); min-width: 400px; max-width: 700px; text-align: left; max-height: 85vh; display: flex; flex-direction: column; } .wz-modal-content h3 { margin-top: 0; margin-bottom: 15px; text-align: center; color: #333; } .wz-modal-content p { margin-bottom: 15px; font-size: 1em; color: #333; } .wz-modal-content label { display: block; margin-bottom: 5px; font-weight: bold; color: #444; } .wz-modal-content input[type="text"], .wz-modal-content textarea, .wz-modal-content select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px; font-size: 1em; box-sizing: border-box; } .wz-modal-content textarea { min-height: 60px; } .wz-modal-content .wz-checkbox-group { margin-bottom: 10px; display: flex; align-items: center; } .wz-modal-content .wz-checkbox-group input[type="checkbox"] { margin-right: 8px; } .wz-modal-content .wz-hidden-section { display: none; } .wz-modal-scrollable-content { overflow-y: auto; flex-grow: 1; padding-right: 10px; } .wz-modal-buttons { text-align: right; margin-top: 20px; padding-top:10px; border-top: 1px solid #eee;} .wz-modal-buttons button { padding: 8px 15px; margin-left: 10px; border-radius: 4px; border: 1px solid #ccc; cursor: pointer; font-size: 0.9em; } .wz-modal-buttons button.wz-confirm { background-color: #4CAF50; color: white; border-color: #4CAF50; } .wz-modal-buttons button.wz-cancel { background-color: #f44336; color: white; border-color: #f44336; }
            .wz-toc-guide-modal { position: fixed; top: 20px; right: 20px; width: 450px; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); z-index: 2100; display: flex; flex-direction: column; max-height: 90vh; } .wz-toc-guide-modal select { width: 100%; margin-bottom: 10px; padding: 8px; } #wz-toc-outline-display { background-color: #f4f4f4; border: 1px solid #ddd; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.9em; flex-grow: 1; overflow-y: auto; } .wz-toc-item { padding: 4px 8px; border-radius: 3px; cursor: pointer; white-space: pre; } .wz-toc-item:hover { background-color: #d4edff; color: #004085; } #wz-toc-copy-feedback { color: green; font-style: italic; display: inline-block; margin-right: auto; } .wz-bio-entry details, .wz-faq-entry details { border: 1px solid #eee; border-radius: 4px; margin-bottom: 10px; } .wz-bio-entry summary, .wz-faq-entry summary { padding: 10px; background-color: #f9f9f9; cursor: pointer; font-weight: bold; border-radius: 3px 3px 0 0; color: #555; } .wz-bio-entry summary:hover, .wz-faq-entry summary:hover { background-color: #efefef; } .wz-bio-entry details[open] summary, .wz-faq-entry details[open] summary { background-color: #e0e0e0; } .wz-bio-entry .wz-bio-entry-content, .wz-faq-entry .wz-faq-entry-content { padding: 10px; border-top: 1px solid #eee; } .wz-bio-entry .wz-bio-remove-btn, .wz-faq-entry .wz-faq-remove-btn { background-color: #ff6b6b; color:white; border:none; padding: 5px 10px; border-radius:3px; cursor:pointer; float:right; margin-left:10px; } .wz-bio-add-entry-btn, .wz-faq-add-entry-btn { display:block; margin: 10px auto 0; padding: 8px 15px; } .wz-bio-modal-error, .wz-title-modal-error, .wz-faq-modal-error { color: #D32F2F; font-size: 0.9em; text-align: center; margin-bottom: 10px; padding: 5px; border: 1px solid #ffcdd2; background-color: #ffebee; border-radius: 4px; } .wz-bio-preview-label, .wz-faq-preview-label { font-weight: bold; margin-top:10px; margin-bottom:3px; font-size:0.9em; color: #444;} .wz-bio-entry-preview, .wz-faq-entry-preview { margin-top: 5px; padding: 8px; background-color: #f0f0f0; color: #333; border: 1px dashed #ccc; border-radius: 4px; font-size: 0.9em; white-space: pre-wrap; line-height: 1.4; } .wz-bio-entry-preview ul { margin: 0; padding-left: 20px; } .wz-bio-entry-preview a, .wz-faq-entry-preview a { color: blue; text-decoration: underline; cursor: help; } .wz-faq-entry-preview blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 10px; color: #666; }
            .wz-dark-mode .wz-modal-content, .wz-dark-mode .wz-toc-guide-modal { background-color: #2b2b2b; color: #e0e0e0; border: 1px solid #555; } .wz-dark-mode .wz-modal-content h3, .wz-dark-mode .wz-modal-content p, .wz-dark-mode .wz-modal-content label { color: #e0e0e0; } .wz-dark-mode .wz-modal-content input[type="text"], .wz-dark-mode .wz-modal-content textarea, .wz-dark-mode .wz-modal-content select, .wz-dark-mode .wz-toc-guide-modal select { background-color: #272727; color: #e0e0e0; border: 1px solid #555; } .wz-dark-mode .wz-modal-content input[type="text"]:focus, .wz-dark-mode .wz-modal-content textarea:focus, .wz-dark-mode .wz-modal-content select:focus { border-color: #007bff; box-shadow: 0 0 3px #007bff; } .wz-dark-mode .wz-modal-buttons { border-top-color: #444; } .wz-dark-mode .wz-modal-buttons button.wz-confirm { background-color: #007bff; border-color: #007bff; } .wz-dark-mode .wz-modal-buttons button.wz-cancel { background-color: #555; border-color: #555; color: #e0e0e0; } .wz-dark-mode .wz-dropdown-content { background-color: #3a3a3a; border-color: #555; } .wz-dark-mode .wz-dropdown-content button { color: #e0e0e0; } .wz-dark-mode .wz-dropdown-content button:hover { background-color: #4a4a4a; } .wz-dark-mode #wz-toc-outline-display { background-color: #3a3a3a; color: #e0e0e0; border-color: #555; } .wz-dark-mode .wz-toc-item:hover { background-color: #007bff; color: white; } .wz-dark-mode #wz-toc-copy-feedback { color: #28a745; } .wz-dark-mode .wz-bio-entry details, .wz-dark-mode .wz-faq-entry details { border-color: #444; } .wz-dark-mode .wz-bio-entry summary, .wz-dark-mode .wz-faq-entry summary { background-color: #3a3a3a; color: #e0e0e0; } .wz-dark-mode .wz-bio-entry summary:hover, .wz-dark-mode .wz-faq-entry summary:hover { background-color: #4a4a4a; } .wz-dark-mode .wz-bio-entry details[open] summary, .wz-dark-mode .wz-faq-entry details[open] summary { background-color: #007bff; color: white; } .wz-dark-mode .wz-bio-entry .wz-bio-entry-content, .wz-dark-mode .wz-faq-entry .wz-faq-entry-content { border-top-color: #444; } .wz-dark-mode .wz-bio-entry-preview, .wz-dark-mode .wz-faq-entry-preview { background-color: #3a3a3a; color: #e0e0e0; border-color: #555; } .wz-dark-mode .wz-bio-entry-preview a, .wz-dark-mode .wz-faq-entry-preview a { color: #61afef; } .wz-dark-mode .wz-bio-modal-error, .wz-dark-mode .wz-title-modal-error, .wz-dark-mode .wz-faq-modal-error { background-color: #5d3434; color: #ffcdd2; border-color: #8b4444; } .wz-dark-mode .wz-faq-entry-preview blockquote { border-left-color: #666; color: #ccc; }
            `;
            if (typeof GM_addStyle === 'function') { GM_addStyle(css); } else { let style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); }
        }

        // --- Definición de funciones ---
        function closeAllDropdowns() { document.querySelectorAll('.wz-dropdown-content.wz-show').forEach(dd => dd.classList.remove('wz-show')); }
        function closeAllModals() { document.querySelectorAll('.wz-modal-overlay, .wz-toc-guide-modal').forEach(modal => modal.remove()); }
        function toggleDropdown(dropdownContentElement) { if (!dropdownContentElement) return; const isCurrentlyShown = dropdownContentElement.classList.contains('wz-show'); closeAllDropdowns(); if (!isCurrentlyShown) dropdownContentElement.classList.add('wz-show'); }
        function insertTextAtCursor(textarea, text, cursorConfig = {}) { if (!textarea) return; const start = textarea.selectionStart; const end = textarea.selectionEnd; if (cursorConfig.wrap) { const selectedText = textarea.value.substring(start, end); const [before, after] = cursorConfig.wrap; const newText = before + selectedText + after; textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end); textarea.selectionStart = start + before.length; textarea.selectionEnd = start + before.length + selectedText.length; } else { textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end); if (cursorConfig.select) { textarea.selectionStart = start; textarea.selectionEnd = start + text.length; } else if (typeof cursorConfig.position === 'number') { textarea.selectionStart = textarea.selectionEnd = start + cursorConfig.position; } else { textarea.selectionStart = textarea.selectionEnd = start + text.length; } } textarea.focus(); textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); }
        function createButton(text, className, onClick) { const button = document.createElement('button'); button.textContent = text; button.className = className; button.onclick = onClick; return button; }
        function setupModalEscape(overlay, onEscape) { const escapeHandler = e => { if (e.key === 'Escape') { onEscape(); document.removeEventListener('keydown', escapeHandler); } }; overlay.tabIndex = -1; overlay.focus(); document.addEventListener('keydown', escapeHandler, { once: true }); }
        
        function showModal(message, type = 'alert', callback, isSubModal = false) {
            if (!isSubModal) closeAllModals();
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
            const closeModalFunc = isSubModal ? () => overlay.remove() : closeAllModals;
            if (type === 'confirm') {
                buttonsDiv.appendChild(createButton(t('yes'), 'wz-confirm', () => { closeModalFunc(); if (callback) callback(true); }));
                buttonsDiv.appendChild(createButton(t('no'), 'wz-cancel', () => { closeModalFunc(); if (callback) callback(false); }));
            } else {
                buttonsDiv.appendChild(createButton(t('accept'), 'wz-confirm', () => { closeModalFunc(); if (callback) callback(true); }));
            }
            content.appendChild(buttonsDiv);
            overlay.appendChild(content);
            document.body.appendChild(overlay);
            setupModalEscape(overlay, closeModalFunc);
        }

        function applyHrFormatting(textarea) { const textBefore = textarea.value.substring(0, textarea.selectionStart); let textToInsert = '---'; if (!textBefore.endsWith('\n\n')) { textToInsert = (textBefore.endsWith('\n') ? '\n' : '\n\n') + textToInsert; } textToInsert += '\n\n'; insertTextAtCursor(textarea, textToInsert); }
        function applyHeadingFormatting(textarea, level, text = '') { const selectedText = text || textarea.value.substring(textarea.selectionStart, textarea.selectionEnd); const markdownPrefix = '#'.repeat(level) + ' '; const wzhTagOpen = `[wzh=${level}]`; const wzhTagClose = `[/wzh]`; let coreText = selectedText ? `${wzhTagOpen}${selectedText}${wzhTagClose}` : `${wzhTagOpen}${wzhTagClose}`; let textToInsert = markdownPrefix + coreText; const textBeforeSelection = textarea.value.substring(0, textarea.selectionStart); if (textarea.selectionStart > 0 && !textBeforeSelection.endsWith('\n\n')) { textToInsert = (textBeforeSelection.endsWith('\n') ? '\n' : '\n\n') + textToInsert; } const cursorPosition = selectedText ? textToInsert.length : (textToInsert.length - wzhTagClose.length); insertTextAtCursor(textarea, textToInsert, { position: cursorPosition }); }
        function showTocGuideModal(textarea, tocTemplates) { closeAllModals(); const modal = document.createElement('div'); modal.className = 'wz-toc-guide-modal'; modal.innerHTML = `<h3>Guía de Plantillas TOC</h3><select id="wz-toc-template-select"></select><div id="wz-toc-outline-display"></div><div class="wz-modal-buttons"><button id="wz-toc-insert-btn" class="wz-confirm">Insertar Esquema</button><button id="wz-toc-close-btn" class="wz-cancel">Cerrar</button></div>`; document.body.appendChild(modal); const select = modal.querySelector('#wz-toc-template-select'); const display = modal.querySelector('#wz-toc-outline-display'); Object.keys(tocTemplates).forEach(key => { const option = document.createElement('option'); option.value = key; option.textContent = tocTemplates[key].title; select.appendChild(option); }); const updateDisplay = () => { const template = tocTemplates[select.value]; if (!template) return; display.innerHTML = ''; template.structure.forEach(line => { const numberMatch = line.match(/^([\d\.]+)/); if (!numberMatch) return; const level = (numberMatch[1].match(/\d+/g) || []).length; const indent = '  '.repeat(Math.max(0, level - 1)); const item = document.createElement('div'); item.className = 'wz-toc-item'; item.innerHTML = indent + line; item.onclick = () => { const headerText = line.replace(/^[\d\.]+\s*/, '').trim(); applyHeadingFormatting(textarea, level, headerText); }; display.appendChild(item); }); }; modal.querySelector('#wz-toc-insert-btn').onclick = () => { const template = tocTemplates[select.value]; if (!template) return; const textToInsert = template.structure.map(line => { const text = line.replace(/^[\d\.]+\s*/, '').trim(); const level = (line.match(/^([\d\.]+)/)[1].match(/\d+/g) || []).length; return `${'#'.repeat(level)} [wzh=${level}]${text}[/wzh]`; }).join('\n\n'); insertTextAtCursor(textarea, textToInsert); closeAllModals(); }; select.onchange = updateDisplay; modal.querySelector('#wz-toc-close-btn').onclick = closeAllModals; updateDisplay(); setupModalEscape(modal, closeAllModals); }
        function createFormattingToolbar(textarea, buttonsToShow = ['bold', 'italic', 'link']) {
            const toolbar = document.createElement('div');
            toolbar.className = 'wz-format-toolbar';
            const buttonActions = {
                'bold': { label: 'B', title: 'Negrita', action: () => insertTextAtCursor(textarea, '', { wrap: ['**', '**'] }) },
                'italic': { label: 'I', title: 'Cursiva', style: 'font-style: italic;', action: () => insertTextAtCursor(textarea, '', { wrap: ['*', '*'] }) },
                'link': { label: '🔗', title: 'Hipervínculo', action: () => {
                    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                    const overlay = document.createElement('div');
                    overlay.className = 'wz-modal-overlay';
                    overlay.style.zIndex = '2100';
                    const modalContent = document.createElement('div');
                    modalContent.className = 'wz-modal-content';
                    modalContent.innerHTML = `<h3>Insertar hipervínculo</h3><div class="wz-modal-scrollable-content"><label for="wz-link-url">URL del enlace</label><input type="text" id="wz-link-url" placeholder="https://ejemplo.com"><label for="wz-link-title">Texto del enlace (opcional)</label><input type="text" id="wz-link-title" value="${selectedText}"></div><div class="wz-modal-buttons"><button class="wz-cancel">${t('cancel')}</button><button class="wz-confirm">${t('accept')}</button></div>`;
                    overlay.appendChild(modalContent); document.body.appendChild(overlay);
                    const urlInput = modalContent.querySelector('#wz-link-url');
                    const titleInput = modalContent.querySelector('#wz-link-title');
                    urlInput.focus();
                    const closeThisModal = () => overlay.remove();
                    modalContent.querySelector('.wz-confirm').onclick = () => { const url = urlInput.value.trim(); const title = titleInput.value.trim(); if (url) { const linkText = title || url; if (selectedText) { insertTextAtCursor(textarea, '', { wrap: [`[`, `](${url})`] }); } else { insertTextAtCursor(textarea, `[${linkText}](${url})`); } } closeThisModal(); };
                    modalContent.querySelector('.wz-cancel').onclick = closeThisModal;
                    setupModalEscape(overlay, closeThisModal);
                }},
                'quote': { label: '“', title: 'Cita', action: () => { const textBefore = textarea.value.substring(0, textarea.selectionStart); const prefix = textBefore.length === 0 || textBefore.endsWith('\n\n') ? '> ' : (textBefore.endsWith('\n') ? '\n> ' : '\n\n> '); insertTextAtCursor(textarea, prefix); } },
                'emoji': { label: '😀', title: 'Emojis', action: () => showModal("Usa el selector de emojis de tu sistema (Tecla Windows + .)", "alert", null, true) }
            };
            buttonsToShow.forEach(key => { if (buttonActions[key]) { const config = buttonActions[key]; const button = createButton(config.label, '', config.action); button.title = config.title; if (config.style) button.style.cssText = config.style; toolbar.appendChild(button); } });
            textarea.parentNode.insertBefore(toolbar, textarea);
            textarea.style.borderTopLeftRadius = '0';
            textarea.style.borderTopRightRadius = '0';
            textarea.style.borderTop = 'none';
            return toolbar;
        }

        // Ensamblar el objeto público final
        const publicApi = {
            setLanguage, getLanguage: () => currentLang,
            closeAllDropdowns, closeAllModals, closeTopModal, toggleDropdown, insertTextAtCursor, createButton, setupModalEscape,
            showModal, applyHrFormatting, applyHeadingFormatting, showTocGuideModal, createFormattingToolbar
        };
        
        loadStyles();
        document.addEventListener('click', () => publicApi.closeAllDropdowns());
        return publicApi;
    })();
    console.log(`Wazeopedia Core UI Library v${GM_info.script.version} loaded.`);
})();
