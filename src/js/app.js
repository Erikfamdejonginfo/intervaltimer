import { loadSchemas, deleteSchema, getSchema } from './storage.js';
import { initEditor, createEmptySchema } from './schema-editor.js';
import { startTimer, cleanupTimer } from './timer-view.js';
import { formatTime } from './utils.js';

// View management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(viewId);
    view.classList.add('active');

    // Focus management for accessibility
    const heading = view.querySelector('h2');
    if (heading) heading.focus();
}

// Render home view schema list
function renderHome() {
    const schemas = loadSchemas();
    const listEl = document.getElementById('schema-list');

    if (schemas.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <p>Nog geen trainingsschema's.</p>
                <p>Maak je eerste schema aan!</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = '';
    schemas.forEach(schema => {
        const totalSteps = schema.sets.reduce((sum, set) => sum + set.steps.length * set.repeats, 0);
        const totalDuration = schema.sets.reduce((sum, set) => {
            const setDuration = set.steps.reduce((s, step) => s + step.duration, 0);
            return sum + setDuration * set.repeats;
        }, 0);

        const card = document.createElement('div');
        card.className = 'schema-card';
        card.innerHTML = `
            <div class="schema-card-info">
                <h3>${escapeHtml(schema.name)}</h3>
                <p>${schema.sets.length} set(s) &middot; ${totalSteps} stappen &middot; ${formatTime(totalDuration)}</p>
            </div>
            <div class="schema-card-actions">
                <button class="btn btn-success btn-start" data-id="${schema.id}" aria-label="Start ${escapeHtml(schema.name)}">Start</button>
                <button class="btn-icon btn-edit" data-id="${schema.id}" aria-label="Bewerk ${escapeHtml(schema.name)}">&#9998;</button>
                <button class="btn-icon btn-delete" data-id="${schema.id}" aria-label="Verwijder ${escapeHtml(schema.name)}">&times;</button>
            </div>
        `;

        listEl.appendChild(card);
    });

}

function handleSchemaListClick(e) {
    const startBtn = e.target.closest('.btn-start');
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (startBtn) {
        const schema = getSchema(startBtn.dataset.id);
        if (schema) {
            showView('view-timer');
            startTimer(schema, () => {
                cleanupTimer();
                showView('view-home');
                renderHome();
            });
        }
    } else if (editBtn) {
        const schema = getSchema(editBtn.dataset.id);
        if (schema) openEditor(schema);
    } else if (deleteBtn) {
        const name = deleteBtn.closest('.schema-card').querySelector('h3').textContent;
        if (confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) {
            deleteSchema(deleteBtn.dataset.id);
            renderHome();
        }
    }
}

function openEditor(schema) {
    showView('view-editor');
    initEditor(schema, () => {
        showView('view-home');
        renderHome();
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Initialize
function init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.warn('Service Worker registratie mislukt:', err);
        });
    }

    // Navigation buttons
    document.getElementById('btn-new-schema').addEventListener('click', () => {
        openEditor(createEmptySchema());
    });

    document.getElementById('btn-editor-back').addEventListener('click', () => {
        showView('view-home');
        renderHome();
    });

    document.getElementById('btn-cancel-editor').addEventListener('click', () => {
        showView('view-home');
        renderHome();
    });

    document.getElementById('btn-back-home').addEventListener('click', () => {
        cleanupTimer();
        showView('view-home');
        renderHome();
    });

    // Event delegation on schema list (bind once)
    document.getElementById('schema-list').addEventListener('click', handleSchemaListClick);

    // Render initial view
    renderHome();
}

document.addEventListener('DOMContentLoaded', init);
