// ==UserScript==
// @name         Wazeopedia Core UI Library
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Biblioteca de funciones de UI y utilidades para scripts de Wazeopedia.
// @author       Annthizze & Gemini
// @match        https://www.waze.com/discuss/*
// @license      MIT
// ==/UserScript==

var WazeopediaUI = (function() {
    'use strict';

    // --- Funciones de Modal General ---
    function showModal(message, type = 'alert', callback, isSubModal = false) {
        if (!isSubModal) closeAllModals();
        const overlay = document.createElement('div');
        overlay.className = 'wz-modal-overlay';
        if (isSubModal) overlay.style.zIndex = 2000 + document.querySelectorAll('.wz-modal-overlay').length;
        const content = document.createElement('div'); content.className = 'wz-modal-content';
        const messageP = document.createElement('p'); messageP.style.textAlign = 'center'; messageP.textContent = message; content.appendChild(messageP);
        const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'wz-modal-buttons'; buttonsDiv.style.textAlign = 'center';
        if (type === 'confirm') {
            buttonsDiv.appendChild(createButton('Sí', 'wz-confirm', () => { closeAllModals(); if (callback) callback(true); }));
            buttonsDiv.appendChild(createButton('No', 'wz-cancel', () => { closeAllModals(); if (callback) callback(false); }));
        } else {
            buttonsDiv.appendChild(createButton('Aceptar', 'wz-confirm', () => { overlay.remove(); if (callback) callback(true); }));
        }
        content.appendChild(buttonsDiv); overlay.appendChild(content); document.body.appendChild(overlay);
        setupModalEscape(overlay, type, callback);
    }

    function createButton(text, className, onClick) {
        const button = document.createElement('button');
        button.textContent = text; button.className = className; button.onclick = onClick;
        return button;
    }

    function setupModalEscape(overlay, type, callback) {
        const escapeHandler = e => {
            if (e.key === 'Escape') {
                const allOverlays = document.querySelectorAll('.wz-modal-overlay, .wz-toc-guide-modal-overlay');
                let maxZ = 0; allOverlays.forEach(ov => maxZ = Math.max(maxZ, parseInt(getComputedStyle(ov).zIndex) || 0));
                const overlayZ = parseInt(getComputedStyle(overlay).zIndex) || 0;
                if (overlayZ < maxZ) return;
                closeAllModals();
                if (type === 'confirm' && callback) callback(false); else if (type === 'form' && callback) callback(false); else if (callback) callback(true);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        overlay.tabIndex = -1; overlay.focus(); document.addEventListener('keydown', escapeHandler, { once: true });
    }

    function closeAllModals() {
        document.querySelectorAll('.wz-modal-overlay, .wz-toc-guide-modal').forEach(modal => modal.remove());
        const tocOverlay = document.getElementById('wz-toc-guide-overlay');
        if (tocOverlay) tocOverlay.remove();
    }

    // --- Funciones de Utilidad ---
    function insertTextAtCursor(textarea, text, cursorOffsetInfo = false) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textBefore = textarea.value.substring(0, start);
        const textAfter = textarea.value.substring(end);
        textarea.value = textBefore + text + textAfter;
        if (cursorOffsetInfo && typeof cursorOffsetInfo.position === 'number') {
            const finalPos = start + cursorOffsetInfo.position;
            textarea.selectionStart = textarea.selectionEnd = finalPos;
        } else if (cursorOffsetInfo === false) {
            textarea.selectionStart = start;
            textarea.selectionEnd = start + text.length;
        } else {
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
        }
        textarea.focus();
        textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
    
    function ensureProperSpacing(currentText, newBlockText, position, relativeBlockData) {
        let before = "", after = "", middle = newBlockText;
        const twoNewlines = "\n\n";
        switch (position) {
            case 'start':
                before = ""; after = currentText;
                if (after.trim().length > 0 && !middle.endsWith(twoNewlines) && !after.startsWith("\n")) { middle += (middle.endsWith("\n") ? "\n" : twoNewlines); }
                else if (after.trim().length > 0 && middle.endsWith("\n") && !middle.endsWith(twoNewlines) && !after.startsWith("\n")){ middle += "\n"; }
                break;
            case 'end':
                before = currentText; after = "";
                if (before.trim().length > 0 && !middle.startsWith(twoNewlines) && !before.endsWith("\n")) { middle = (before.endsWith("\n") ? "\n" : twoNewlines) + middle; }
                else if (before.trim().length > 0 && !middle.startsWith(twoNewlines) && before.endsWith("\n") && !before.endsWith(twoNewlines) ){ middle = "\n" + middle; }
                break;
            case 'afterRelative':
                if (!relativeBlockData) return ensureProperSpacing(currentText, newBlockText, 'start');
                before = currentText.substring(0, relativeBlockData.endIndex);
                after = currentText.substring(relativeBlockData.endIndex);
                if (!before.endsWith(twoNewlines) && !before.endsWith("\n")) middle = twoNewlines + middle;
                else if (before.endsWith("\n") && !before.endsWith(twoNewlines) && !middle.startsWith("\n")) middle = "\n" + middle;
                if (after.trim().length > 0 && !middle.endsWith(twoNewlines) && !after.startsWith("\n")) { middle += (middle.endsWith("\n") ? "\n" : twoNewlines); }
                else if (after.trim().length > 0 && middle.endsWith("\n") && !middle.endsWith(twoNewlines) && !after.startsWith("\n")){ middle += "\n"; }
                break;
            case 'beforeRelative':
                 if (!relativeBlockData) return ensureProperSpacing(currentText, newBlockText, 'end');
                 before = currentText.substring(0, relativeBlockData.startIndex);
                 after = currentText.substring(relativeBlockData.startIndex);
                 if (before.trim().length > 0 && !middle.startsWith(twoNewlines) && !before.endsWith("\n")) { middle = (before.endsWith("\n") ? "\n" : twoNewlines) + middle; }
                 else if (before.trim().length > 0 && !middle.startsWith(twoNewlines) && before.endsWith("\n") && !before.endsWith(twoNewlines) ){ middle = "\n" + middle; }
                 if (!middle.endsWith(twoNewlines) && !after.startsWith("\n")) { middle += (middle.endsWith("\n") ? "\n" : twoNewlines); }
                 else if (middle.endsWith("\n") && !middle.endsWith(twoNewlines) && !after.startsWith("\n")){ middle += "\n"; }
                 break;
            default: return { textToInsert: newBlockText.trim(), cursorPosition: newBlockText.trim().length };
        }
        return { textToInsert: before + middle + after, cursorPosition: (before + middle).length };
    }

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
        insertTextAtCursor(textarea, textToInsert, { position: cursorPosition });
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
        insertTextAtCursor(textarea, textToInsert, { position: textToInsert.length });
    }

    // --- Lógica de Desplegables y Botones ---
    function closeAllDropdowns() {
        document.querySelectorAll('.wz-dropdown-content.wz-show').forEach(dd => dd.classList.remove('wz-show'));
        document.removeEventListener('click', handleClickOutsideDropdowns);
    }
    function handleClickOutsideDropdowns(event) {
        if (!event.target.closest('.wz-dropdown')) closeAllDropdowns();
    }
    function toggleDropdown(buttonElement, dropdownContentElement) {
        const isCurrentlyShown = dropdownContentElement.classList.contains('wz-show');
        closeAllDropdowns();
        if (!isCurrentlyShown) {
            dropdownContentElement.classList.add('wz-show');
            setTimeout(() => document.addEventListener('click', handleClickOutsideDropdowns), 0);
        }
    }
    function addCustomButtons(buttonConfigs) {
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
                const btn = createButton(config.text, 'wz-custom-button btn wz-dropdown-toggle', e => { e.stopPropagation(); toggleDropdown(btn, content); });
                btn.id = config.id; btn.title = config.title;
                const content = document.createElement('div'); content.className = 'wz-dropdown-content';
                config.dropdownItems.forEach(item => {
                    if (item.isSeparator) {
                        const separator = document.createElement('hr');
                        separator.style.margin = '4px 8px';
                        separator.style.borderColor = '#ddd';
                        content.appendChild(separator);
                        return;
                    }
                    const ddBtn = createButton(item.text, '', e => {
                        e.stopPropagation();
                        if (typeof item.action === 'function') { item.action(textarea); }
                        closeAllDropdowns();
                    });
                    ddBtn.title = item.title || `Insertar ${item.text}`;
                    content.appendChild(ddBtn);
                });
                wrapper.append(btn, content);
                buttonBarContainer.appendChild(wrapper);
            } else {
                const btn = createButton(config.text, 'wz-custom-button btn', e => {
                    e.preventDefault(); e.stopPropagation();
                    if (typeof config.action === 'function') { config.action(textarea); }
                });
                btn.id = config.id; btn.title = config.title;
                buttonBarContainer.appendChild(btn);
            }
        });
    }

    // --- INICIALIZACIÓN Y GESTIÓN DEL TEMA ---
    function applyTheme() {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('wz-dark-mode', isDark);
    }

    function init(buttonConfigs) {
        const editorObserver = new MutationObserver(() => {
            if (document.querySelector('div.d-editor-button-bar, div.discourse-markdown-toolbar, .editor-toolbar') && !document.getElementById('wz-btn-toc')) {
                addCustomButtons(buttonConfigs);
                applyTheme();
            }
        });
        editorObserver.observe(document.body, { childList: true, subtree: true });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
        addCustomButtons(buttonConfigs);
        applyTheme();
    }

    // API Pública de la biblioteca
    return {
        showModal,
        createButton,
        setupModalEscape,
        closeAllModals,
        insertTextAtCursor,
        applyHeadingFormatting,
        applyHrFormatting,
        ensureProperSpacing,
        init
    };
})();
