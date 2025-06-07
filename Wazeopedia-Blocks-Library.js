// ==UserScript==
// @name         Wazeopedia Blocks Library
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Biblioteca de lógica para bloques de contenido de Wazeopedia (Título, Bio, FAQ, etc.).
// @author       Annthizze
// @require      https://update.greasyfork.org/scripts/538610/1602967/Wazeopedia%20Core%20UI%20Library.js
// @license      MIT
// ==/UserScript==

'use strict';

const WazeopediaBlocks = (function() {
    if (typeof WazeopediaUI === 'undefined') {
        console.error("WazeopediaBlocks: WazeopediaUI no está cargada. Asegúrate de que Core UI Library se cargue primero.");
        return;
    }

    // --- CONSTANTES DE BLOQUES ---
    const TITLE_BLOCK_TOC_MARKER = "<div data-theme-toc=\"true\"> </div>";
    const TITLE_BLOCK_WZBOX_START = "[wzBox]";
    const TITLE_BLOCK_WZBOX_END = "[/wzBox]";
    const TITLE_BLOCK_IMAGE = "[center][wzh=0]![waze64x64|64x64](upload://jRTDuEOGZWkysIHHifIg9ce3nh0.png)[/wzh][/center]";
    const TITLE_STATUS_OPTIONS = {
        aprobado: { label: "Aprobado", text: "> :shield: [color=green]***Artículo aprobado y verificado***[/color]\nEl contenido de este artículo ha sido revisado y aprobado por los ![image|25x25, 100%](upload://vhFGhej3zdZALIqhbHknwTJ1JZk.png) **Champs** de la comunidad. La información aquí presentada es considerada oficial y fiable como guía de referencia." },
        pendiente: { label: "Pendiente de Aprobación", text: "> :hourglass_done: [color=blue]***Artículo pendiente de aprobación***[/color]\nEste artículo ha sido completado y está **pendiente de revisión y aprobación final** por parte de los ![image|25x25, 100%](upload://vhFGhej3zdZALIqhbHknwTJ1JZk.png) <b>Champs</b> de la comunidad. Mientras este mensaje esté visible, el contenido **no debe utilizarse como criterio definitivo**." },
        desarrollo: { label: "En Desarrollo", text: "> :construction: [color=orange]***Artículo en desarrollo***[/color]\nEste artículo está siendo creado o actualizado. La información podría estar incompleta o contener errores. Agradecemos tu paciencia. Si eres ![image|25x25](upload://wsHHONE4FYyBvMShtoQYLmFEJy8.png) **editor wiki**, puedes consultar el [→foro←]({{FORUM_URL}}) para colaborar en su desarrollo.", requiresUrl: true },
        incompleto: { label: "Incompleto", text: "> :puzzle_piece: [color=#FFC300]***Artículo incompleto***[/color]\nA este artículo le falta información relevante o secciones importantes. Si eres ![image|25x25](upload://wsHHONE4FYyBvMShtoQYLmFEJy8.png) <b>editor wiki</b>, por favor, dirígete al [→foro←](https://www.waze.com/discuss/c/editors/spain-usuarios-y-editores/wazeopedia-es/4779) para conocer los detalles y colaborar en su mejora." },
        deficiente: { label: "Deficiente", text: "> :chart_decreasing: [color=orangered]***Información deficiente en el artículo***[/color]\nEl contenido actual de este artículo ha sido señalado como deficiente. Puede contener imprecisiones, estar desactualizado, o carecer de la claridad o fuentes necesarias. Si eres ![image|25x25](upload://wsHHONE4FYyBvMShtoQYLmFEJy8.png) <b>editor wiki</b>, por favor, revisa el [→foro←](https://www.waze.com/discuss/c/editors/spain-usuarios-y-editores/wazeopedia-es/4779) para discutir y aplicar las mejoras necesarias." },
        borrar: { label: "Borrar", text: "> :wastebasket: [color=red]***Artículo pendiente de borrar***[/color]\nEste artículo ha sido marcado para su eliminación por los ![image|25x25, 100%](upload://vhFGhej3zdZALIqhbHknwTJ1JZk.png) **Administradores** de la Wazeopedia Española, generalmente por obsolescencia, contenido incorrecto, duplicidad o incumplimiento de directrices. Para más detalles o alegaciones, consulta el [→foro←](https://www.waze.com/discuss/c/editors/spain-usuarios-y-editores/wazeopedia-es/4779)" }
    };
    const INTRO_BLOCK_HEADER_FULL = "[center][wzh=0]![Info64x64|64x64](upload://1cG8aFsGrCONmfJ4R1Bzb5PP9Ia.png)[/wzh][/center]\n\n# [wzh=1]Introducción[/wzh]";
    const INTRO_NOTE_PREFIX = "> :bookmark: ";
    const INTRO_BLOCK_END_MARKER = "\n\n---";
    const BIO_BLOCK_IMAGE_AND_HEADER = "[center][wzh=0]![image|128x128, 50%](upload://UTuWTJ1XEX6BVzoj1FIhLjAb6i.png)[/wzh][/center]\n\n# [wzh=2]Biografía y Enlaces[/wzh]";
    const MAX_BIO_ENTRIES = 15;
    const FORUM_BLOCK_IDENTIFIER = "# [wzh=1]Foro de discusión:[/wzh]";
    const FORUM_BLOCK_IMAGE = "[center]![image|128x128, 50%](upload://2cmYNNfUCAykbh8vW92usPC9Sf3.png)[/center]";
    const FAQ_BLOCK_HEADER = "# [wzh=1]Preguntas Frecuentes[/wzh]";
    const FAQ_BLOCK_REGEX = /(?:^|\n)---\s*\n+# \[wzh=1\]Preguntas Frecuentes\[\/wzh\]\s*\n+([\s\S]*?)\n+---\s*(?:\n|$)/;


    // --- FUNCIONES PRIVADAS DE LA BIBLIOTECA (Helpers) ---

    // Helper para espaciado de bloques
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
            default: return { textToInsert: newBlockText.trim(), cursorPosition: newBlockText.trim().length };
        }
        return { textToInsert: before + middle + after, cursorPosition: (before + middle).length };
    }

    // Helpers de Bloque Título
    function parseExistingTitleBlock(editorText) {
        if (!editorText.startsWith(TITLE_BLOCK_TOC_MARKER)) return null;
        const wzBoxStartIndex = editorText.indexOf(TITLE_BLOCK_WZBOX_START);
        if (wzBoxStartIndex === -1) return null;
        const wzBoxEndIndex = editorText.indexOf(TITLE_BLOCK_WZBOX_END, wzBoxStartIndex);
        if (wzBoxEndIndex === -1) return null;
        const content = editorText.substring(wzBoxStartIndex + TITLE_BLOCK_WZBOX_START.length, wzBoxEndIndex);
        const titleMatch = content.match(/\[center\]\[wzh=1\](.*?)\[\/wzh\]\[\/center\]/);
        const title = titleMatch ? titleMatch[1].trim() : "";
        let statusKey = "aprobado", forumUrl = "";
        for (const key in TITLE_STATUS_OPTIONS) {
            if (content.includes(TITLE_STATUS_OPTIONS[key].text.split('***')[1])) {
                statusKey = key;
                if (TITLE_STATUS_OPTIONS[key].requiresUrl) {
                    const urlMatch = content.match(/\[→foro←\]\(([^)]+)\)/);
                    forumUrl = urlMatch ? urlMatch[1] : "";
                }
                break;
            }
        }
        return { title, statusKey, forumUrl, startIndex: 0, endIndex: wzBoxEndIndex + TITLE_BLOCK_WZBOX_END.length };
    }
    
    // Helpers de Bloque Introducción
    function parseExistingIntroductionBlock(editorText) {
        const fullHeaderSearchIndex = editorText.indexOf(INTRO_BLOCK_HEADER_FULL);
        if (fullHeaderSearchIndex === -1) return null;
        const contentStartAfterFullHeader = fullHeaderSearchIndex + INTRO_BLOCK_HEADER_FULL.length;
        if (!editorText.substring(contentStartAfterFullHeader).startsWith("\n\n")) return null;
        const actualMainTextStartIndex = contentStartAfterFullHeader + 2;
        let searchFrom = actualMainTextStartIndex;
        let endOfBlockIndex = -1;
        while (searchFrom < editorText.length) {
            const tempEndOfBlockIndex = editorText.indexOf(INTRO_BLOCK_END_MARKER, searchFrom);
            if (tempEndOfBlockIndex === -1) break;
            const potentialBlockContent = editorText.substring(actualMainTextStartIndex, tempEndOfBlockIndex);
            if (potentialBlockContent.indexOf(INTRO_BLOCK_HEADER_FULL) === -1) {
                endOfBlockIndex = tempEndOfBlockIndex;
                break;
            }
            searchFrom = editorText.indexOf(INTRO_BLOCK_HEADER_FULL, searchFrom) + INTRO_BLOCK_HEADER_FULL.length;
        }
        if (endOfBlockIndex === -1) return null;
        const blockContentBetween = editorText.substring(actualMainTextStartIndex, endOfBlockIndex);
        let mainText = blockContentBetween, noteText = "", additionalText = "", hasNote = false, hasAdditional = false;
        const noteBlockPattern = "\n\n" + INTRO_NOTE_PREFIX;
        const noteStartIndex = blockContentBetween.indexOf(noteBlockPattern);
        if (noteStartIndex !== -1) {
            hasNote = true;
            mainText = blockContentBetween.substring(0, noteStartIndex).trim();
            const afterNotePrefix = blockContentBetween.substring(noteStartIndex + noteBlockPattern.length);
            const additionalTextSeparator = "\n\n";
            const additionalTextIndex = afterNotePrefix.indexOf(additionalTextSeparator);
            if (additionalTextIndex !== -1) {
                noteText = afterNotePrefix.substring(0, additionalTextIndex).trim();
                additionalText = afterNotePrefix.substring(additionalTextIndex + additionalTextSeparator.length).trim();
                if (additionalText) hasAdditional = true;
            } else {
                noteText = afterNotePrefix.trim();
            }
        } else {
            mainText = blockContentBetween.trim();
        }
        return { mainText, noteText, additionalText, hasNote, hasAdditional, startIndex: fullHeaderSearchIndex, endIndex: endOfBlockIndex + INTRO_BLOCK_END_MARKER.length };
    }
    
    // Helpers de Bloque Biografía
    function getBioEntryPrefix(dateText) {
        dateText = (dateText || "").trim();
        if (/^\d{1,2} de [a-zA-ZáéíóúÁÉÍÓÚñÑ]+ de \d{4}$/i.test(dateText)) return "* El ";
        if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+ de \d{4}$/i.test(dateText)) return "* En ";
        if (/^\d{4}$/.test(dateText)) return "* En el año ";
        return "* El ";
    }
    function parseExistingBiographyBlock(editorText) {
        const blockStartIndex = editorText.indexOf(BIO_BLOCK_IMAGE_AND_HEADER);
        if (blockStartIndex === -1) return null;
        const contentStartIndex = blockStartIndex + BIO_BLOCK_IMAGE_AND_HEADER.length;
        const nextBlockRegex = /(?:\n\n---|# \[wzh=[12]\]|Foro de discusión:)/;
        const nextBlockMatch = editorText.substring(contentStartIndex).match(nextBlockRegex);
        const endIndex = nextBlockMatch ? contentStartIndex + nextBlockMatch.index : editorText.length;
        const blockContent = editorText.substring(contentStartIndex, endIndex).trim();
        const entries = [];
        if (blockContent) {
            blockContent.split('\n').forEach(line => {
                if (!line.startsWith('* ')) return;
                const core = line.substring(2).trim();
                const linkMatch = core.match(/^(?:El |En el año |En )?\[([^\]]+)\]\(([^)]+)\)\s*(.*)/);
                if (linkMatch) {
                    entries.push({ dateText: linkMatch[1], url: linkMatch[2], description: linkMatch[3].replace(/\.$/, '') });
                } else {
                    entries.push({ dateText: '', url: '', description: core.replace(/\.$/, '') });
                }
            });
        }
        return { entries, startIndex: blockStartIndex, endIndex };
    }
    function updateBioEntryPreview(dateInput, urlInput, descInput, previewElement) {
        const dateText = dateInput.value.trim(); const url = urlInput.value.trim(); const description = descInput.value.trim();
        const prefix = getBioEntryPrefix(dateText);
        let descWithPeriod = description; if (descWithPeriod && !/[.!?]$/.test(descWithPeriod)) descWithPeriod += '.';
        previewElement.innerHTML = `* ${prefix.substring(2)}${url ? `[<a href="#" onclick="return false;">${dateText || 'Fecha'}</a>]` : dateText}${description ? ' ' + descWithPeriod : '.'}`;
    }
    function createBioEntryElement(entry = { dateText: '', url: '', description: '' }, index, container) {
        const details = document.createElement('details'); details.className = 'wz-bio-entry'; details.name = 'bio-accordion';
        const summary = document.createElement('summary'); summary.appendChild(document.createTextNode(entry.dateText || `Entrada ${index + 1}`));
        const contentDiv = document.createElement('div'); contentDiv.className = 'wz-bio-entry-content';
        contentDiv.innerHTML = `<label>Fecha (texto):</label><input type="text" class="wz-bio-date" placeholder="Ej: 25 de agosto de 2024" value="${entry.dateText}"><label>URL (opcional):</label><input type="text" class="wz-bio-url" placeholder="https://ejemplo.com" value="${entry.url}"><label>Descripción:</label><textarea class="wz-bio-desc">${entry.description}</textarea><div class="wz-bio-preview-label">Previsualización:</div><div class="wz-bio-entry-preview"></div>`;
        const removeBtn = WazeopediaUI.createButton('Eliminar', 'wz-bio-remove-btn', () => { details.remove(); updateBioSummaries(container); });
        summary.appendChild(removeBtn);
        details.append(summary, contentDiv);
        const dateInput = contentDiv.querySelector('.wz-bio-date'), urlInput = contentDiv.querySelector('.wz-bio-url'), descInput = contentDiv.querySelector('.wz-bio-desc'), preview = contentDiv.querySelector('.wz-bio-entry-preview');
        const updateFn = () => {
            updateBioEntryPreview(dateInput, urlInput, descInput, preview);
            summary.firstChild.textContent = dateInput.value.trim() || `Entrada ${Array.from(container.children).indexOf(details) + 1}`;
        };
        [dateInput, urlInput, descInput].forEach(el => el.addEventListener('input', updateFn));
        updateFn();
        return details;
    }
    function updateBioSummaries(container) {
        container.querySelectorAll('details.wz-bio-entry').forEach((details, idx) => {
            const dateInput = details.querySelector('.wz-bio-date');
            details.querySelector('summary').firstChild.textContent = dateInput.value.trim() || `Entrada ${idx + 1}`;
        });
    }

    // Helpers de Bloque Foro
    const FORUM_BLOCK_REGEX_STR = `(?:^|\\n)---` + `\\s*${FORUM_BLOCK_IMAGE.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}` + `\\s*${FORUM_BLOCK_IDENTIFIER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}` + `[\\s\\S]*?` + `href="https://www\\.waze\\.com/discuss/new-topic\\?category=spain-usuarios-y-editores/wazeopedia-es/4779[^"]*">→aquí←</a>`;
    function getForumBlockRegex() { return new RegExp(FORUM_BLOCK_REGEX_STR, 'm'); }
    function generateBodyContentAndTitleParams(cleanedPostTitleForDisplay) {
        const isEditing = window.location.href.includes('/t/');
        let linkUrl = isEditing ? window.location.href : `https://www.waze.com/discuss/t/${cleanedPostTitleForDisplay.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        const markdownEscapedPostTitle = cleanedPostTitleForDisplay.replace(/([\[\]\(\)])/g, '\\$1');
        return { bodyContentText: `[${markdownEscapedPostTitle}](${linkUrl})`, urlEncodedTitleForNewTopic: encodeURIComponent(cleanedPostTitleForDisplay) };
    }
    function generateFullForumBlock(_, bodyContentTextForTemplate, urlEncodedNewTopicTitle) {
        const bodyParamUnencoded = `Hola editores,\n\nHe leído la información en la Wazeopedia y me gustaría hacer una sugerencia o proponer un cambio relacionado con la información contenida en la pagina de ${bodyContentTextForTemplate}. A continuación detallaré mi idea, error o modificación:\n\n< Pon aquí tu sugerencia, error o cambio >`;
        return `---
${FORUM_BLOCK_IMAGE}
${FORUM_BLOCK_IDENTIFIER}
Si observas cualquier tipo de error en la información aquí contenida, así como si deseas mejorarla o incluso solicitar algún tipo de cambio en los criterios para su uso, puedes informar en el foro correspondiente <a rel="nofollow" class="external text" href="https://www.waze.com/discuss/new-topic?category=spain-usuarios-y-editores/wazeopedia-es/4779&title=WAZO%20-%20${urlEncodedNewTopicTitle}&body=${encodeURIComponent(bodyParamUnencoded)}">→aquí←</a>`;
    }
    function showForumUpdateConfirmModal(textarea, existingBlockInfo, newParams, currentParams) {
        WazeopediaUI.closeAllModals();
        const overlay = document.createElement('div'); overlay.className = 'wz-modal-overlay';
        const modalContent = document.createElement('div'); modalContent.className = 'wz-modal-content';
        let htmlContent = `<h3>Estado del Bloque de Discusión</h3><div class="wz-modal-scrollable-content">`;
        let needsUpdate = false;
        if (!existingBlockInfo) {
            htmlContent += `<p>El bloque 'Foro de discusión' no existe en el editor.</p>`;
        } else {
            const bodyContentMatches = currentParams.bodyContent === newParams.bodyContentText;
            htmlContent += `<div class="wz-forum-update-modal-item"><p><span class="status-icon ${bodyContentMatches ? 'wz-status-ok">✔️' : 'wz-status-mismatch">❌'}</span><span class="label">Contenido del enlace (cuerpo):</span></p>${!bodyContentMatches ? `<p><span class="label">Actual:</span> <span class="value">${currentParams.bodyContent || 'No encontrado'}</span></p>` : ''}<p><span class="label">Esperado:</span> <span class="value">${newParams.bodyContentText}</span></p></div>`;
            if (!bodyContentMatches) needsUpdate = true;
            const newTopicTitleMatches = currentParams.urlEncodedTitle === newParams.urlEncodedTitleForNewTopic;
            htmlContent += `<div class="wz-forum-update-modal-item"><p><span class="status-icon ${newTopicTitleMatches ? 'wz-status-ok">✔️' : 'wz-status-mismatch">❌'}</span><span class="label">Título para "Nuevo Tema":</span></p>${!newTopicTitleMatches ? `<p><span class="label">Actual:</span> <span class="value">${decodeURIComponent(currentParams.urlEncodedTitle || 'No encontrado')}</span></p>` : ''}<p><span class="label">Esperado:</span> <span class="value">${decodeURIComponent(newParams.urlEncodedTitleForNewTopic)}</span></p></div>`;
            if (!newTopicTitleMatches) needsUpdate = true;
            if (!needsUpdate) htmlContent += `<p style="text-align:center; color:green; margin-top:15px;">El bloque ya está actualizado.</p>`;
        }
        htmlContent += `</div>`;
        modalContent.innerHTML = htmlContent;
        const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'wz-modal-buttons';
        if (!existingBlockInfo) {
            buttonsDiv.appendChild(WazeopediaUI.createButton('Insertar Bloque', 'wz-confirm', () => {
                const fullBlock = generateFullForumBlock(newParams.cleanedPostTitleForDisplay, newParams.bodyContentText, newParams.urlEncodedTitleForNewTopic);
                const { textToInsert: finalContent, cursorPosition } = ensureProperSpacing(textarea.value, fullBlock, 'end');
                textarea.value = finalContent;
                textarea.selectionStart = textarea.selectionEnd = cursorPosition;
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                WazeopediaUI.closeAllModals();
            }));
        } else if (needsUpdate) {
            buttonsDiv.appendChild(WazeopediaUI.createButton('Actualizar Bloque', 'wz-confirm', () => {
                const updatedFullBlock = generateFullForumBlock(newParams.cleanedPostTitleForDisplay, newParams.bodyContentText, newParams.urlEncodedTitleForNewTopic);
                textarea.value = textarea.value.substring(0, existingBlockInfo.startIndex) + updatedFullBlock + textarea.value.substring(existingBlockInfo.endIndex);
                textarea.selectionStart = textarea.selectionEnd = existingBlockInfo.startIndex + updatedFullBlock.length; textarea.focus();
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); WazeopediaUI.closeAllModals();
            }));
        } else {
            buttonsDiv.appendChild(WazeopediaUI.createButton('Aceptar', 'wz-confirm', WazeopediaUI.closeAllModals));
        }
        buttonsDiv.appendChild(WazeopediaUI.createButton('Cancelar', 'wz-cancel', WazeopediaUI.closeAllModals));
        modalContent.appendChild(buttonsDiv); overlay.appendChild(modalContent); document.body.appendChild(overlay);
        WazeopediaUI.setupModalEscape(overlay, 'form', WazeopediaUI.closeAllModals);
    }
    
    // Helpers de Bloque FAQs
    function parseExistingFaqBlock(editorText) {
        const match = editorText.match(FAQ_BLOCK_REGEX);
        if (!match) return null;
        const content = match[1];
        const entries = [];
        const questionRegex = /\*\*🔹 (.*?)\*\*\s*\n(.*?)(?=\n\n\*\*🔹|$(?![\r\n]))/gs;
        let qaMatch;
        while ((qaMatch = questionRegex.exec(content)) !== null) {
            entries.push({ question: qaMatch[1].trim(), answer: qaMatch[2].trim() });
        }
        return {
            entries,
            startIndex: match.index === 0 ? 0 : match.index + 1,
            endIndex: match.index === 0 ? match[0].length : match.index + match[0].length,
        };
    }
    function updateFaqEntryPreview(questionInput, answerInput, previewElement) {
        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();
        previewElement.innerHTML = `<strong>🔹 ${question || 'Pregunta'}</strong><br>${answer || 'Respuesta...'}`;
    }
    function createFaqEntryElement(entry = { question: '', answer: '' }, index, container) {
        const details = document.createElement('details'); details.className = 'wz-faq-entry'; details.name = 'faq-accordion';
        const summary = document.createElement('summary'); summary.textContent = entry.question || `FAQ #${index + 1}`;
        const contentDiv = document.createElement('div'); contentDiv.className = 'wz-faq-entry-content';
        contentDiv.innerHTML = `<label>Pregunta:</label><input type="text" class="wz-faq-question" placeholder="Escribe la pregunta..." value="${entry.question.replace(/"/g, '"')}"><label>Respuesta:</label><textarea class="wz-faq-answer" placeholder="Escribe la respuesta...">${entry.answer}</textarea><div class="wz-faq-preview-label">Previsualización:</div><div class="wz-faq-entry-preview"></div>`;
        const removeBtn = WazeopediaUI.createButton('Eliminar', 'wz-faq-remove-btn', () => {
            details.remove();
            container.querySelectorAll('.wz-faq-entry summary').forEach((s, i) => {
                const qInput = s.nextElementSibling.querySelector('.wz-faq-question');
                if (!s.textContent.startsWith('FAQ #')) return;
                if (!qInput.value.trim()) s.textContent = `FAQ #${i + 1}`;
            });
        });
        summary.appendChild(removeBtn);
        details.append(summary, contentDiv);
        const questionInput = contentDiv.querySelector('.wz-faq-question');
        const answerInput = contentDiv.querySelector('.wz-faq-answer');
        const previewElement = contentDiv.querySelector('.wz-faq-entry-preview');
        const updateFn = () => {
            updateFaqEntryPreview(questionInput, answerInput, previewElement);
            summary.firstChild.textContent = questionInput.value.trim() || `FAQ #${Array.from(container.children).indexOf(details) + 1}`;
        };
        [questionInput, answerInput].forEach(el => el.addEventListener('input', updateFn));
        updateFn();
        return details;
    }
    
    
    // --- API PÚBLICA DE LA BIBLIOTECA ---
    return {
        showTitleConfigModal: function(textarea) {
            WazeopediaUI.closeAllModals();
            const existingData = parseExistingTitleBlock(textarea.value);
            const initial = existingData || { title: "", statusKey: "aprobado", forumUrl: "" };
            const overlay = document.createElement('div'); overlay.className = 'wz-modal-overlay';
            const modalContent = document.createElement('div'); modalContent.className = 'wz-modal-content';
            modalContent.innerHTML = `<h3>Configurar Título y Estado</h3><div class="wz-modal-scrollable-content"><div class="wz-title-modal-error" style="display:none;"></div><label for="wz-title-main">Título Artículo:</label><input type="text" id="wz-title-main" value="${initial.title}"><label for="wz-title-status-select">Estado Artículo:</label><select id="wz-title-status-select">${Object.keys(TITLE_STATUS_OPTIONS).map(k => `<option value="${k}" ${initial.statusKey === k ? 'selected' : ''}>${TITLE_STATUS_OPTIONS[k].label}</option>`).join('')}</select><div id="wz-title-forum-url-section" style="display: ${TITLE_STATUS_OPTIONS[initial.statusKey]?.requiresUrl ? 'block' : 'none'};"><label for="wz-title-forum-url">URL Foro:</label><input type="text" id="wz-title-forum-url" placeholder="https://..." value="${initial.forumUrl}"></div></div>`;
            const errorDiv = modalContent.querySelector('.wz-title-modal-error'), titleInput = modalContent.querySelector('#wz-title-main'), statusSelect = modalContent.querySelector('#wz-title-status-select'), forumUrlSection = modalContent.querySelector('#wz-title-forum-url-section'), forumUrlInput = modalContent.querySelector('#wz-title-forum-url');
            statusSelect.onchange = () => forumUrlSection.style.display = TITLE_STATUS_OPTIONS[statusSelect.value]?.requiresUrl ? 'block' : 'none';
            const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'wz-modal-buttons';
            const saveBtn = WazeopediaUI.createButton(existingData ? 'Actualizar Bloque' : 'Insertar Bloque', 'wz-confirm', () => {
                const title = titleInput.value.trim(), statusKey = statusSelect.value, forumUrl = forumUrlInput.value.trim();
                if (!title) { errorDiv.textContent = "Título no puede estar vacío."; errorDiv.style.display = 'block'; return; }
                if (TITLE_STATUS_OPTIONS[statusKey]?.requiresUrl && !forumUrl) { errorDiv.textContent = 'URL de foro requerida.'; errorDiv.style.display = 'block'; return; }
                const statusText = TITLE_STATUS_OPTIONS[statusKey].text.replace("{{FORUM_URL}}", forumUrl);
                const newBlock = `${TITLE_BLOCK_TOC_MARKER}\n\n${TITLE_BLOCK_WZBOX_START}\n${TITLE_BLOCK_IMAGE}\n[center][wzh=1]${title}[/wzh][/center]\n\n${statusText}\n${TITLE_BLOCK_WZBOX_END}`;
                if (existingData) {
                    textarea.value = newBlock + textarea.value.substring(existingData.endIndex);
                } else {
                    const { textToInsert, cursorPosition } = ensureProperSpacing(textarea.value, newBlock, 'start');
                    textarea.value = textToInsert;
                    textarea.selectionStart = textarea.selectionEnd = cursorPosition;
                }
                WazeopediaUI.closeAllModals();
            });
            buttonsDiv.append(WazeopediaUI.createButton('Cancelar', 'wz-cancel', WazeopediaUI.closeAllModals), saveBtn);
            modalContent.querySelector('.wz-modal-scrollable-content').after(buttonsDiv);
            overlay.appendChild(modalContent); document.body.appendChild(overlay);
            WazeopediaUI.setupModalEscape(overlay, 'form', WazeopediaUI.closeAllModals);
            setTimeout(() => titleInput.focus(), 100);
        },
        
        showIntroductionConfigModal: function(textarea) {
            WazeopediaUI.closeAllModals();
            const existingBlockData = parseExistingIntroductionBlock(textarea.value);
            const initialData = existingBlockData || { mainText: "", noteText: "", additionalText: "", hasNote: false, hasAdditional: false };
            const overlay = document.createElement('div'); overlay.className = 'wz-modal-overlay';
            const content = document.createElement('div'); content.className = 'wz-modal-content';
            content.innerHTML = `<h3>Configurar Bloque de Introducción</h3><div class="wz-modal-scrollable-content"><label for="wz-intro-main">Texto Principal:</label><textarea id="wz-intro-main"></textarea><div class="wz-checkbox-group"><input type="checkbox" id="wz-intro-add-note-check"><label for="wz-intro-add-note-check">Añadir nota</label></div><div id="wz-intro-note-section" class="wz-hidden-section"><label for="wz-intro-note">Texto de Nota (${INTRO_NOTE_PREFIX.trim()} se añadirá):</label><textarea id="wz-intro-note" placeholder="Ej: Edición limitada..."></textarea></div><div class="wz-checkbox-group"><input type="checkbox" id="wz-intro-add-additional-check"><label for="wz-intro-add-additional-check">Añadir texto adicional</label></div><div id="wz-intro-additional-section" class="wz-hidden-section"><label for="wz-intro-additional">Texto Adicional:</label><textarea id="wz-intro-additional"></textarea></div></div>`;
            const mainTextEl = content.querySelector('#wz-intro-main'), addNoteCheckEl = content.querySelector('#wz-intro-add-note-check'), noteSectionEl = content.querySelector('#wz-intro-note-section'), noteTextEl = content.querySelector('#wz-intro-note'), addAdditionalCheckEl = content.querySelector('#wz-intro-add-additional-check'), additionalSectionEl = content.querySelector('#wz-intro-additional-section'), additionalTextEl = content.querySelector('#wz-intro-additional');
            mainTextEl.value = initialData.mainText; noteTextEl.value = initialData.noteText; additionalTextEl.value = initialData.additionalText;
            addNoteCheckEl.checked = initialData.hasNote; if (initialData.hasNote) noteSectionEl.style.display = 'block'; addNoteCheckEl.onchange = () => noteSectionEl.style.display = addNoteCheckEl.checked ? 'block' : 'none';
            addAdditionalCheckEl.checked = initialData.hasAdditional; if (initialData.hasAdditional) additionalSectionEl.style.display = 'block'; addAdditionalCheckEl.onchange = () => additionalSectionEl.style.display = addAdditionalCheckEl.checked ? 'block' : 'none';
            const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'wz-modal-buttons';
            const saveBtn = WazeopediaUI.createButton(existingBlockData ? 'Actualizar Bloque' : 'Insertar Bloque', 'wz-confirm', () => {
                let blockParts = [INTRO_BLOCK_HEADER_FULL, "\n\n" + mainTextEl.value.trim()];
                if (addNoteCheckEl.checked) blockParts.push("\n\n" + INTRO_NOTE_PREFIX + noteTextEl.value.trim());
                if (addAdditionalCheckEl.checked) blockParts.push("\n\n" + additionalTextEl.value.trim());
                blockParts.push(INTRO_BLOCK_END_MARKER);
                const finalBlock = blockParts.join('');
                if (existingBlockData) {
                    const textBefore = textarea.value.substring(0, existingBlockData.startIndex);
                    const textAfter = textarea.value.substring(existingBlockData.endIndex);
                    textarea.value = textBefore + finalBlock + textAfter;
                } else {
                    const titleBlockData = parseExistingTitleBlock(textarea.value);
                    const { textToInsert, cursorPosition } = ensureProperSpacing(textarea.value, finalBlock, titleBlockData ? 'afterRelative' : 'start', titleBlockData);
                    textarea.value = textToInsert;
                    textarea.selectionStart = textarea.selectionEnd = cursorPosition;
                }
                textarea.focus();
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                WazeopediaUI.closeAllModals();
            });
            buttonsDiv.appendChild(WazeopediaUI.createButton('Cancelar', 'wz-cancel', WazeopediaUI.closeAllModals)); buttonsDiv.appendChild(saveBtn);
            content.querySelector('.wz-modal-scrollable-content').after(buttonsDiv);
            overlay.appendChild(content); document.body.appendChild(overlay);
            WazeopediaUI.setupModalEscape(overlay, 'form', WazeopediaUI.closeAllModals);
            setTimeout(() => mainTextEl.focus(), 100);
        },

        showBiographyConfigModal: function(textarea) {
            WazeopediaUI.closeAllModals();
            const existingBlock = parseExistingBiographyBlock(textarea.value);
            let entries = existingBlock ? existingBlock.entries : [{ dateText: '', url: '', description: '' }];
            const overlay = document.createElement('div'); overlay.className = 'wz-modal-overlay';
            const modalContent = document.createElement('div'); modalContent.className = 'wz-modal-content';
            modalContent.innerHTML = `<h3>Configurar Biografía y Enlaces</h3><div class="wz-bio-modal-error" style="display:none;"></div><div class="wz-modal-scrollable-content"><div id="wz-bio-entry-list"></div></div>`;
            const errorDiv = modalContent.querySelector('.wz-bio-modal-error'), entryList = modalContent.querySelector('#wz-bio-entry-list');
            entries.forEach((entry, i) => entryList.appendChild(createBioEntryElement(entry, i, entryList)));
            const addBtn = WazeopediaUI.createButton('Añadir Entrada', 'wz-bio-add-entry-btn wz-confirm', () => {
                if (entryList.children.length < MAX_BIO_ENTRIES) {
                    const newEl = createBioEntryElement(undefined, entryList.children.length, entryList);
                    entryList.appendChild(newEl);
                    newEl.open = true;
                    newEl.scrollIntoView({ behavior: 'smooth' });
                } else { errorDiv.textContent = `Máximo ${MAX_BIO_ENTRIES} entradas.`; errorDiv.style.display = 'block'; }
            });
            modalContent.querySelector('.wz-modal-scrollable-content').appendChild(addBtn);
            const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'wz-modal-buttons';
            const saveButton = WazeopediaUI.createButton(existingBlock ? 'Actualizar Bloque' : 'Insertar Bloque', 'wz-confirm', () => {
                let bioContent = BIO_BLOCK_IMAGE_AND_HEADER;
                const currentEntries = Array.from(entryList.querySelectorAll('.wz-bio-entry')).map(el => ({ dateText: el.querySelector('.wz-bio-date').value.trim(), url: el.querySelector('.wz-bio-url').value.trim(), description: el.querySelector('.wz-bio-desc').value.trim() }));
                if (currentEntries.every(e => !e.dateText && !e.url && !e.description)) {
                     if (existingBlock) {
                        WazeopediaUI.showModal("¿Eliminar bloque de biografía vacío?", "confirm", confirmed => {
                            if (confirmed) { textarea.value = textarea.value.substring(0, existingBlock.startIndex) + textarea.value.substring(existingBlock.endIndex); WazeopediaUI.closeAllModals(); }
                        }, true);
                    }
                    return;
                }
                currentEntries.forEach(entry => {
                    if (!entry.dateText && !entry.description) return;
                    const prefix = getBioEntryPrefix(entry.dateText);
                    const link = entry.url ? `[${entry.dateText}](${entry.url})` : entry.dateText;
                    let desc = entry.description; if (desc && !/[.!?]$/.test(desc)) desc += '.';
                    bioContent += `\n${prefix}${link}${desc ? ' ' + desc : '.'}`;
                });
                if (existingBlock) {
                    textarea.value = textarea.value.substring(0, existingBlock.startIndex) + bioContent + textarea.value.substring(existingBlock.endIndex);
                } else {
                    const { textToInsert, cursorPosition } = ensureProperSpacing(textarea.value, bioContent, 'end');
                    textarea.value = textToInsert;
                    textarea.selectionStart = textarea.selectionEnd = cursorPosition;
                }
                WazeopediaUI.closeAllModals();
            });
            buttonsDiv.append(WazeopediaUI.createButton('Cancelar', 'wz-cancel', WazeopediaUI.closeAllModals), saveButton);
            modalContent.appendChild(buttonsDiv);
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);
            WazeopediaUI.setupModalEscape(overlay, 'form', WazeopediaUI.closeAllModals);
        },

        applyForumDiscussionFormatting: function(textarea) {
            const titleInputElement = document.getElementById('reply-title');
            if (!titleInputElement) { WazeopediaUI.showModal("Error: Campo de título #reply-title no encontrado.", 'alert'); return; }
            let postTitle = titleInputElement.value.trim();
            if (!postTitle) { WazeopediaUI.showModal("Error: El título del post no puede estar vacío.", 'alert'); return; }
            const cleanedPostTitleForDisplay = postTitle.replace(/:[a-zA-Z0-9\_+-]+:/g, '').trim();
            if (!cleanedPostTitleForDisplay) { WazeopediaUI.showModal("Error: Título (sin emojis) no puede estar vacío.", 'alert'); return; }
            const newGeneratedParams = { ...generateBodyContentAndTitleParams(cleanedPostTitleForDisplay), cleanedPostTitleForDisplay };
            const forumBlockRegex = getForumBlockRegex();
            const existingBlockMatch = textarea.value.match(forumBlockRegex);
            if (!existingBlockMatch) {
                const fullBlock = generateFullForumBlock(newGeneratedParams.cleanedPostTitleForDisplay, newGeneratedParams.bodyContentText, newGeneratedParams.urlEncodedTitleForNewTopic);
                const { textToInsert: finalContent, cursorPosition } = ensureProperSpacing(textarea.value, fullBlock, 'end', null);
                textarea.value = finalContent;
                textarea.selectionStart = textarea.selectionEnd = cursorPosition;
                textarea.focus();
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            } else {
                const existingBlockText = existingBlockMatch[0];
                const existingBlockInfo = { text: existingBlockText, startIndex: existingBlockMatch.index, endIndex: existingBlockMatch.index + existingBlockText.length };
                const bodyMatch = existingBlockText.match(/pagina de (\[.*?\]\(.*?\))/);
                const newTopicMatch = existingBlockText.match(/title=WAZO%20-%20([^&"]+)/);
                const currentParams = { bodyContent: (bodyMatch && bodyMatch[1]) || '', urlEncodedTitle: (newTopicMatch && newTopicMatch[1]) || '' };
                if (currentParams.bodyContent === newGeneratedParams.bodyContentText && currentParams.urlEncodedTitle === newGeneratedParams.urlEncodedTitleForNewTopic) {
                    WazeopediaUI.showModal("El bloque 'Foro de discusión' ya está actualizado.", 'alert');
                } else {
                    showForumUpdateConfirmModal(textarea, existingBlockInfo, newGeneratedParams, currentParams);
                }
            }
        },
        
        showFaqConfigModal: function(textarea) {
            WazeopediaUI.closeAllModals();
            const existingBlock = parseExistingFaqBlock(textarea.value);
            const entries = existingBlock ? existingBlock.entries : [{ question: '', answer: '' }];
            const overlay = document.createElement('div');
            overlay.className = 'wz-modal-overlay';
            const modalContent = document.createElement('div');
            modalContent.className = 'wz-modal-content';
            modalContent.innerHTML = `<h3>Configurar Preguntas Frecuentes (FAQs)</h3><div class="wz-faq-modal-error" style="display:none;"></div><div class="wz-modal-scrollable-content"><div id="wz-faq-entry-list"></div></div>`;
            const errorDiv = modalContent.querySelector('.wz-faq-modal-error');
            const entryListContainer = modalContent.querySelector('#wz-faq-entry-list');
            entries.forEach((entry, index) => entryListContainer.appendChild(createFaqEntryElement(entry, index, entryListContainer)));
            const addBtn = WazeopediaUI.createButton('Añadir FAQ', 'wz-faq-add-entry-btn wz-confirm', () => {
                const newFaq = createFaqEntryElement(undefined, entryListContainer.children.length, entryListContainer);
                entryListContainer.appendChild(newFaq);
                newFaq.open = true;
                newFaq.querySelector('.wz-faq-question').focus();
            });
            modalContent.querySelector('.wz-modal-scrollable-content').appendChild(addBtn);
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'wz-modal-buttons';
            const saveButton = WazeopediaUI.createButton(existingBlock ? 'Actualizar Bloque' : 'Insertar Bloque', 'wz-confirm', () => {
                const faqEntries = Array.from(entryListContainer.querySelectorAll('.wz-faq-entry')).map(details => ({
                    question: details.querySelector('.wz-faq-question').value.trim(),
                    answer: details.querySelector('.wz-faq-answer').value.trim()
                })).filter(e => e.question && e.answer);

                if (faqEntries.length === 0) {
                    if (existingBlock) {
                        WazeopediaUI.showModal("No hay FAQs. ¿Eliminar bloque existente?", "confirm", confirmed => {
                            if (confirmed) {
                                textarea.value = textarea.value.substring(0, existingBlock.startIndex) + textarea.value.substring(existingBlock.endIndex);
                                WazeopediaUI.closeAllModals();
                            }
                        }, true);
                    } else {
                        errorDiv.textContent = "No hay entradas para guardar.";
                        errorDiv.style.display = 'block';
                    }
                    return;
                }

                let faqContent = faqEntries.map(e => `**🔹 ${e.question}**\n\n${e.answer}`).join('\n\n');
                let finalBlock = `---\n\n${FAQ_BLOCK_HEADER}\n\n${faqContent}\n\n---`;

                if (existingBlock) {
                    textarea.value = textarea.value.substring(0, existingBlock.startIndex) + finalBlock + textarea.value.substring(existingBlock.endIndex);
                } else {
                    const { textToInsert, cursorPosition } = ensureProperSpacing(textarea.value, finalBlock, 'end');
                    textarea.value = textToInsert;
                    textarea.selectionStart = textarea.selectionEnd = cursorPosition;
                }
                textarea.focus();
                WazeopediaUI.closeAllModals();
            });
            buttonsDiv.append(WazeopediaUI.createButton('Cancelar', 'wz-cancel', WazeopediaUI.closeAllModals), saveButton);
            modalContent.appendChild(buttonsDiv);
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);
            WazeopediaUI.setupModalEscape(overlay, 'form', WazeopediaUI.closeAllModals);
        },
    };
})();
