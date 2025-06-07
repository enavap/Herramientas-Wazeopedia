// ==UserScript==
// @name         Wazeopedia Core UI Library
// @namespace    http://tampermonkey.net/
// @version      5.0.0
// @description  Biblioteca de componentes de UI (modales, botones, estilos) para las herramientas de Wazeopedia.
// @author       Annthizze
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

'use strict';

const WazeopediaUI = (function() {

    // --- ESTILOS CSS ---
    function loadStyles() {
        GM_addStyle(`
            /* --- ESTILOS GENERALES Y MODO CLARO --- */
            div.d-editor-button-bar, div.discourse-markdown-toolbar { display: flex !important; flex-wrap: wrap !important; padding-bottom: 5px !important; }
            .wz-button-container { display: inline-flex; flex-wrap: wrap; align-items: center; border-left: 1px solid #ddd; margin-left: 10px; padding-left: 10px; }
            .wz-custom-button { background-color: #32CD32; color: white; padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9em; font-weight: bold; text-shadow: 1px 1px 1px rgba(0,0,0,0.2); transition: background-color 0.2s ease; margin-left: 6px; margin-bottom: 5px; }
            .wz-custom-button:hover { background-color: #28a428; }
            .wz-button-container > .wz-custom-button:first-child, .wz-button-container > .wz-dropdown:first-child { margin-left: 0; }
            .wz-dropdown { position: relative; display: inline-block; margin-left: 6px; margin-bottom: 5px; }
            .wz-dropdown-content { display: none; position: absolute; background-color: #f9f9f9; min-width: 160px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 1001; border-radius: 4px; padding: 5px 0; top: 100%; left: 0; margin-top: 3px; }
            .wz-dropdown-content.wz-show { display: block; }
            .wz-dropdown-content button { color: black; padding: 8px 12px; text-decoration: none; display: block; width: 100%; text-align: left; background-color: transparent; border: none; cursor: pointer; font-size: 0.9em; }
            .wz-dropdown-content button:hover { background-color: #e9e9e9; }
            .wz-dropdown-content hr { margin: 4px 8px; border-color: #ddd; border-style: solid; border-width: 1px 0 0 0; }
            .wz-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
            .wz-modal-content { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); min-width: 400px; max-width: 700px; text-align: left; max-height: 80vh; display: flex; flex-direction: column; border: 1px solid #ccc; }
            .wz-modal-content h3 { margin-top: 0; margin-bottom: 15px; text-align: center; color: #333; }
            .wz-modal-content p { margin-bottom: 15px; font-size: 1em; color: #333; }
            .wz-modal-content label { display: block; margin-bottom: 5px; font-weight: bold; color: #444; }
            .wz-modal-content input[type="text"], .wz-modal-content textarea, .wz-modal-content select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px; font-size: 0.9em; box-sizing: border-box; background-color: #fff; color: #222; }
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
            .wz-toc-guide-modal select { width: 100%; }
            #wz-toc-outline-display { background-color: #f4f4f4; border: 1px solid #ddd; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 0.9em; flex-grow: 1; overflow-y: auto; margin-top: 10px; min-height: 200px; }
            .wz-toc-item { padding: 4px 8px; border-radius: 3px; cursor: pointer; white-space: pre; }
            .wz-toc-item:hover { background-color: #d4edff; color: #004085; }
            #wz-toc-copy-feedback { color: green; font-style: italic; display: inline-block; margin-right: auto; }
            .wz-bio-entry details, .wz-faq-entry details { border: 1px solid #eee; border-radius: 4px; margin-bottom: 10px; }
            .wz-bio-entry summary, .wz-faq-entry summary { padding: 10px; background-color: #f9f9f9; cursor: pointer; font-weight: bold; border-radius: 3px 3px 0 0; color: #555; }
            .wz-bio-entry summary:hover, .wz-faq-entry summary:hover { background-color: #efefef; }
            .wz-bio-entry details[open] summary, .wz-faq-entry details[open] summary { background-color: #e0e0e0; }
            .wz-bio-entry .wz-bio-entry-content, .wz-faq-entry .wz-faq-entry-content { padding: 10px; border-top: 1px solid #eee; }
            .wz-bio-entry .wz-bio-remove-btn, .wz-faq-entry .wz-faq-remove-btn { background-color: #ff6b6b; color:white; border:none; padding: 5px 10px; border-radius:3px; cursor:pointer; float:right; margin-top: -5px; }
            .wz-bio-add-entry-btn, .wz-faq-add-entry-btn { display:block; margin: 10px auto 0; padding: 8px 15px; }
            .wz-bio-modal-error, .wz-title-modal-error, .wz-faq-modal-error { color: #D32F2F; font-size: 0.9em; text-align: center; margin-bottom: 10px; padding: 5px; border: 1px solid #ffcdd2; background-color: #ffebee; border-radius: 3px; }
            .wz-bio-preview-label, .wz-faq-preview-label { font-weight: bold; margin-top:10px; margin-bottom:3px; font-size:0.9em; color: #444;}
            .wz-bio-entry-preview, .wz-faq-entry-preview { margin-top: 5px; padding: 8px; background-color: #f0f0f0; color: #333; border: 1px dashed #ccc; border-radius: 4px; font-size: 0.9em; white-space: pre-wrap; word-wrap: break-word; min-height: 2em; }
            .wz-bio-entry-preview a, .wz-faq-entry-preview a { color: blue; text-decoration: underline; cursor: help; }

            /* --- ESTILOS MODO OSCURO --- */
            .wz-dark-mode .wz-button-container { border-left-color: #555; }
            .wz-dark-mode .wz-custom-button { background-color: #3a3a3a; color: #e0e0e0; border: 1px solid #555; text-shadow: none; }
            .wz-dark-mode .wz-custom-button:hover { background-color: #007bff; border-color: #007bff; color: white; }
            .wz-dark-mode .wz-modal-content, .wz-dark-mode .wz-toc-guide-modal { background-color: #2b2b2b; color: #e0e0e0; border: 1px solid #555; }
            .wz-dark-mode .wz-modal-content h3, .wz-dark-mode .wz-modal-content p, .wz-dark-mode .wz-modal-content label { color: #e0e0e0; }
            .wz-dark-mode .wz-modal-content input[type="text"], .wz-dark-mode .wz-modal-content textarea, .wz-dark-mode .wz-modal-content select, .wz-dark-mode .wz-toc-guide-modal select { background-color: #3a3a3a; color: #e0e0e0; border: 1px solid #666; }
            .wz-dark-mode .wz-modal-content input[type="text"]:focus, .wz-dark-mode .wz-modal-content textarea:focus, .wz-dark-mode .wz-modal-content select:focus { border-color: #007bff; box-shadow: 0 0 0 1px #007bff; }
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
        `);
    }

    // --- Funciones privadas auxiliares ---
    function formatLineAsHeader(line) {
        if (!line.trim()) return "";
        const text = line.replace(/^[\d\.]+\s*/, '').trim();
        const numberMatch = line.match(/^([\d\.]+)/);
        const level = numberMatch ? (numberMatch[1].match(/\d+/g) || []).length : 1;
        const markdownPrefix = '#'.repeat(level) + ' ';
        return `${markdownPrefix}[wzh=${level}]${text}[/wzh]`;
    }

    // --- API Pública ---
    const publicApi = {
        closeAllDropdowns: function() { /* ... */ },
        handleClickOutsideDropdowns: function(event) { /* ... */ },
        toggleDropdown: function(buttonElement, dropdownContentElement) { /* ... */ },
        insertTextAtCursor: function(textarea, text, cursorOffsetInfo = false) { /* ... */ },
        applyHeadingFormatting: function(textarea, level, text = '') {
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
            publicApi.insertTextAtCursor(textarea, textToInsert, { position: cursorPosition });
        },
        applyHrFormatting: function(textarea) {
            let textToInsert = "\n---\n";
            const textBefore = textarea.value.substring(0, textarea.selectionStart);
            if (textBefore.trim() === '') { textToInsert = "---\n\n"; }
            else if (!textBefore.endsWith('\n\n')) { textToInsert = (textBefore.endsWith('\n') ? '\n' : '\n\n') + '---'; }
            else { textToInsert = '---'; }
            const textAfter = textarea.value.substring(textarea.selectionEnd);
            if (textAfter.trim() === '') { textToInsert += '\n'; }
            else if (!textAfter.startsWith('\n\n')) { textToInsert += (textAfter.startsWith('\n') ? '\n' : '\n\n'); }
            publicApi.insertTextAtCursor(textarea, textToInsert, { position: textToInsert.length });
        },
        closeAllModals: function() { /* ... */ },
        createButton: function(text, className, onClick) { /* ... */ },
        setupModalEscape: function(overlay, type, callback) { /* ... */ },
        showModal: function(message, type = 'alert', callback, isSubModal = false) { /* ... */ },
        showTocGuideModal: function(tocTemplates) {
            if (document.getElementById('wz-toc-guide-modal')) return;
            const modal = document.createElement('div');
            modal.className = 'wz-toc-guide-modal';
            modal.id = 'wz-toc-guide-modal';
            modal.innerHTML = `<h3>Guía de Plantillas TOC</h3><label for="wz-toc-template-select">Selecciona un modelo de contenido:</label><select id="wz-toc-template-select">${Object.keys(tocTemplates).map(key => `<option value="${key}">${tocTemplates[key].title}</option>`).join('')}</select><div id="wz-toc-outline-display"></div><div class="wz-modal-buttons"><span id="wz-toc-copy-feedback"></span></div>`;
            const display = modal.querySelector('#wz-toc-outline-display');
            const buttonsDiv = modal.querySelector('.wz-modal-buttons');
            const copyFeedback = modal.querySelector('#wz-toc-copy-feedback');
            const select = modal.querySelector('#wz-toc-template-select');
            const copyBtn = publicApi.createButton('Copiar Esquema', 'wz-confirm', () => {
                const template = tocTemplates[select.value];
                if (!template) return;
                const textToCopy = template.structure.map(formatLineAsHeader).join('\n\n');
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyFeedback.textContent = '¡Esquema copiado!';
                    setTimeout(() => { copyFeedback.textContent = ''; }, 2500);
                });
            });
            const closeBtn = publicApi.createButton('Cerrar', 'wz-cancel', () => modal.remove());
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
                            publicApi.applyHeadingFormatting(textarea, level, headerText);
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
    };
    // El resto de definiciones de funciones de publicApi están omitidas por brevedad pero deben estar aquí.

    loadStyles();
    console.log("Wazeopedia Core UI Library loaded.");
    return publicApi;
})();
