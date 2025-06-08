// ==UserScript==
// @name         Wazeopedia Blocks Library
// @namespace    http://tampermonkey.net/
// @version      7.0.0
// @description  Biblioteca de lógica para bloques de contenido de Wazeopedia (Título, Bio, FAQ, etc.).
// @author       Annthizze
// @require      https://update.greasyfork.org/scripts/538610/Wazeopedia%20Core%20UI%20Library.js
// @require      https://update.greasyfork.org/scripts/538744/Wazeopedia%20Content%20Library.js
// @license      MIT
// ==/UserScript==

'use strict';
(function() {
    if (window.WazeopediaBlocks) return;

    if (typeof window.WazeopediaUI === 'undefined' || typeof window.WazeopediaContent === 'undefined') {
        return; // Esperar a que el inicializador principal se encargue
    }

    const WazeopediaBlocks = (function() {
        const UI = window.WazeopediaUI;
        const Content = window.WazeopediaContent;
        const TITLE_STATUS_OPTIONS = Content.TITLE_BLOCK.STATUS_OPTIONS;
        const FORUM_BLOCK_REGEX_STR = `(?:^|\\n)---` + `\\s*${Content.FORUM_BLOCK.IMAGE.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}` + `\\s*${Content.FORUM_BLOCK.IDENTIFIER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}` + `[\\s\\S]*?` + `href="https://www\\.waze\\.com/discuss/new-topic\\?category=spain-usuarios-y-editores/wazeopedia-es/4779[^"]*">→aquí←</a>`;
        const FAQ_BLOCK_REGEX = /(?:^|\n)---\s*\n+# \[wzh=1\]Preguntas Frecuentes\[\/wzh\]\s*\n+([\s\S]*?)\n+---\s*(?:\n|$)/;
        const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'].join('|');
        const dateRegexDayMonthYear = new RegExp(`^((3[01]|[12][0-9]|0?[1-9]) de (${MONTHS_ES}) de (\\d{4}))`, 'i');
        const dateRegexMonthYear = new RegExp(`^((?:${MONTHS_ES}) de (\\d{4}))`, 'i');
        const dateRegexYear = /^(\d{4})/;
        function isValidBioDate(dateText) { const text = dateText.trim(); return dateRegexDayMonthYear.test(text) || dateRegexMonthYear.test(text) || /^\d{4}$/.test(text); }
        function getBioEntryPrefix(dateText) { const text = (dateText || "").trim().toLowerCase(); if (dateRegexDayMonthYear.test(text)) return "El "; if (dateRegexMonthYear.test(text)) return "En "; if (/^\d{4}$/.test(text)) return "En el año "; return ""; }
        function parseExistingBiographyBlock(editorText) { const blockStartIndex = editorText.indexOf(Content.BIO_BLOCK.HEADER); if (blockStartIndex === -1) return null; const contentStartIndex = blockStartIndex + Content.BIO_BLOCK.HEADER.length; const nextBlockRegex = /(?:\n\n---|# \[wzh=[12]\]|Foro de discusión:)/; const nextBlockMatch = editorText.substring(contentStartIndex).match(nextBlockRegex); const endIndex = nextBlockMatch ? contentStartIndex + nextBlockMatch.index : editorText.length; const blockContent = editorText.substring(contentStartIndex, endIndex).trim(); const entries = []; if (blockContent) { blockContent.split('\n').forEach(line => { if (!line.startsWith('* ')) return; let core = line.substring(2).trim(); const prefixMatch = core.match(/^(?:El |En el año |En )/); if (prefixMatch) { core = core.substring(prefixMatch[0].length); } const linkMatch = core.match(/^\[([^\]]+)\]\(([^)]+)\)\s*(.*)/); if (linkMatch) { entries.push({ dateText: linkMatch[1], url: linkMatch[2], description: linkMatch[3].replace(/\.$/, '') }); } else { let dateText = ''; let description = ''; const dmyMatch = core.match(dateRegexDayMonthYear); const myMatch = core.match(dateRegexMonthYear); const yMatch = core.match(dateRegexYear); let foundMatch = null; if (dmyMatch && core.startsWith(dmyMatch[0])) { foundMatch = dmyMatch[0]; } else if (myMatch && core.startsWith(myMatch[0])) { foundMatch = myMatch[0]; } else if (yMatch && core.startsWith(yMatch[0])) { foundMatch = yMatch[0]; } if (foundMatch) { dateText = foundMatch; description = core.substring(foundMatch.length).trim(); } else { dateText = core; description = ''; } entries.push({ dateText, url: '', description: description.replace(/\.$/, '') }); } }); } return { entries, startIndex: blockStartIndex, endIndex }; }
        function createBioEntryElement(entry = { dateText: '', url: '', description: '' }, index, container) { const details = document.createElement('details'); details.className = 'wz-bio-entry'; details.name = 'bio-accordion'; const summary = document.createElement('summary'); summary.appendChild(document.createTextNode(entry.dateText || `Entrada ${index + 1}`)); const contentDiv = document.createElement('div'); contentDiv.className = 'wz-bio-entry-content'; contentDiv.innerHTML = `<label>Fecha (texto):</label><input type="text" class="wz-bio-date" placeholder="DD de MES de AAAA | MES de AAAA | AAAA" value="${entry.dateText}"><label>URL (opcional):</label><input type="text" class="wz-bio-url" placeholder="https://ejemplo.com" value="${entry.url}"><label>Descripción:</label><textarea class="wz-bio-desc">${entry.description}</textarea><div class="wz-bio-preview-label">Previsualización:</div><div class="wz-bio-entry-preview"></div>`; const removeBtn = UI.createButton('Eliminar', 'wz-bio-remove-btn', () => { details.remove(); updateBioSummaries(container); }); summary.appendChild(removeBtn); details.append(summary, contentDiv); const dateInput = contentDiv.querySelector('.wz-bio-date'), urlInput = contentDiv.querySelector('.wz-bio-url'), descInput = contentDiv.querySelector('.wz-bio-desc'), preview = contentDiv.querySelector('.wz-bio-entry-preview'); const updateFn = () => { const dateText = dateInput.value.trim(); const url = urlInput.value.trim(); const description = descInput.value.trim(); const prefix = getBioEntryPrefix(dateText); let descWithPeriod = description; if (descWithPeriod && !/[.!?]$/.test(descWithPeriod)) descWithPeriod += '.'; const dateHtml = url ? `<a href="#" onclick="return false;">${dateText || 'Fecha'}</a>` : (dateText || 'Fecha'); preview.innerHTML = `<ul><li>${prefix}${dateHtml}${description ? ' ' + descWithPeriod : ''}</li></ul>`; summary.firstChild.textContent = dateText || `Entrada ${Array.from(container.children).indexOf(details) + 1}`; }; [dateInput, urlInput, descInput].forEach(el => el.addEventListener('input', updateFn)); updateFn(); return details; }
        function updateBioSummaries(container) { container.querySelectorAll('details.wz-bio-entry').forEach((details, idx) => { const dateInput = details.querySelector('.wz-bio-date'); details.querySelector('summary').firstChild.textContent = dateInput.value.trim() || `Entrada ${idx + 1}`; }); }
        function createFaqEntryElement(entry = { question: '', answer: '' }, index, container) { const details = document.createElement('details'); details.className = 'wz-faq-entry'; details.name = 'faq-accordion'; const summary = document.createElement('summary'); summary.textContent = entry.question || `FAQ #${index + 1}`; const contentDiv = document.createElement('div'); contentDiv.className = 'wz-faq-entry-content'; contentDiv.innerHTML = `<label>Pregunta:</label><input type="text" class="wz-faq-question" placeholder="Escribe la pregunta..." value="${entry.question.replace(/"/g, '"')}"><label>Respuesta:</label><textarea class="wz-faq-answer" placeholder="Escribe la respuesta...">${entry.answer}</textarea><div class="wz-faq-preview-label">Previsualización:</div><div class="wz-faq-entry-preview"></div>`; const removeBtn = UI.createButton('Eliminar', 'wz-faq-remove-btn', () => { details.remove(); container.querySelectorAll('.wz-faq-entry summary').forEach((s, i) => { const qInput = s.nextElementSibling.querySelector('.wz-faq-question'); if (!s.textContent.startsWith('FAQ #')) return; if (!qInput.value.trim()) s.textContent = `FAQ #${i + 1}`; }); }); summary.appendChild(removeBtn); details.append(summary, contentDiv); const questionInput = contentDiv.querySelector('.wz-faq-question'); const answerInput = contentDiv.querySelector('.wz-faq-answer'); const previewElement = contentDiv.querySelector('.wz-faq-entry-preview'); UI.createFormattingToolbar(answerInput, ['bold', 'italic', 'link', 'quote', 'emoji']); const updateFn = () => { const question = questionInput.value.trim(); const answer = answerInput.value.trim(); previewElement.innerHTML = `<strong>🔹 ${question || 'Pregunta'}</strong><br>${answer || 'Respuesta...'}`; summary.firstChild.textContent = questionInput.value.trim() || `FAQ #${Array.from(container.children).indexOf(details) + 1}`; }; [questionInput, answerInput].forEach(el => el.addEventListener('input', updateFn)); updateFn(); return details; }
        // ... (resto del código sin cambios)
    })();
    
    window.WazeopediaBlocks = WazeopediaBlocks;
    console.log('Wazeopedia Blocks Library 7.0.0 loaded.');
    if (typeof window.wazeopediaToolInitializer === 'function') {
        window.wazeopediaToolInitializer();
    }
})();
