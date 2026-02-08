import { generateId, formatTime } from './utils.js';
import { saveSchema } from './storage.js';

let currentSchema = null;
let onSaveCallback = null;

export function createEmptySchema() {
    return {
        id: generateId(),
        name: '',
        sets: [createEmptySet()]
    };
}

function createEmptySet() {
    return {
        id: generateId(),
        name: 'Set 1',
        repeats: 1,
        steps: [createEmptyStep('Rennen', 60, 'active'), createEmptyStep('Pauze', 30, 'pause')]
    };
}

function createEmptyStep(name = '', duration = 30, type = 'active') {
    return { id: generateId(), name, duration, type };
}

export function initEditor(schema, onSave) {
    currentSchema = JSON.parse(JSON.stringify(schema));
    onSaveCallback = onSave;

    const titleEl = document.getElementById('editor-title');
    titleEl.textContent = schema.createdAt ? 'Schema Bewerken' : 'Nieuw Schema';

    document.getElementById('schema-name').value = currentSchema.name;
    renderSets();
    updateTotalDisplay();

    document.getElementById('btn-add-set').onclick = () => {
        const newSet = createEmptySet();
        newSet.name = `Set ${currentSchema.sets.length + 1}`;
        currentSchema.sets.push(newSet);
        renderSets();
    };

    document.getElementById('btn-save-schema').onclick = handleSave;
}

function renderSets() {
    const container = document.getElementById('sets-container');
    container.innerHTML = '';

    currentSchema.sets.forEach((set, setIndex) => {
        const setEl = document.createElement('div');
        setEl.className = 'set-block';
        setEl.innerHTML = `
            <div class="set-header">
                <div class="set-name-group">
                    <label class="sr-only" for="set-name-${setIndex}">Setnaam</label>
                    <input type="text" id="set-name-${setIndex}" class="set-name-input" value="${escapeHtml(set.name)}" placeholder="Setnaam" aria-label="Naam set ${setIndex + 1}">
                </div>
                <div class="set-header-controls">
                    <label class="sr-only" for="set-repeats-${setIndex}">Herhalingen</label>
                    <span class="set-repeats-label">Herhalingen:</span>
                    <input type="number" id="set-repeats-${setIndex}" class="set-repeats-input" min="1" max="999" value="${set.repeats}">
                    ${currentSchema.sets.length > 1 ? `<button class="btn-icon btn-delete-set" data-set="${setIndex}" aria-label="Verwijder set ${setIndex + 1}">&times;</button>` : ''}
                </div>
            </div>
            <div class="steps-container" id="steps-${setIndex}"></div>
            <div class="set-duration-info" id="set-duration-${setIndex}"></div>
            <button class="btn btn-secondary btn-block btn-add-step" data-set="${setIndex}" style="margin-top:0.5rem; font-size:0.9rem;">+ Stap Toevoegen</button>
        `;

        container.appendChild(setEl);

        // Set name change
        setEl.querySelector(`#set-name-${setIndex}`).addEventListener('change', (e) => {
            set.name = e.target.value;
        });

        // Repeats change
        setEl.querySelector(`#set-repeats-${setIndex}`).addEventListener('change', (e) => {
            set.repeats = Math.max(1, parseInt(e.target.value, 10) || 1);
            updateTotalDisplay();
        });

        // Delete set
        const delBtn = setEl.querySelector('.btn-delete-set');
        if (delBtn) {
            delBtn.addEventListener('click', () => {
                currentSchema.sets.splice(setIndex, 1);
                renderSets();
            });
        }

        // Add step
        setEl.querySelector('.btn-add-step').addEventListener('click', () => {
            set.steps.push(createEmptyStep());
            renderSets();
        });

        // Render steps
        renderSteps(set, setIndex);
    });

    updateTotalDisplay();
}

function renderSteps(set, setIndex) {
    const container = document.getElementById(`steps-${setIndex}`);

    set.steps.forEach((step, stepIndex) => {
        const minutes = Math.floor(step.duration / 60);
        const seconds = step.duration % 60;

        const row = document.createElement('div');
        row.className = 'step-row';
        row.innerHTML = `
            <input type="text" class="step-name" value="${escapeHtml(step.name)}" placeholder="Stapnaam"
                aria-label="Naam stap ${stepIndex + 1}">
            <input type="number" class="step-duration" min="0" max="59" value="${minutes}" aria-label="Minuten stap ${stepIndex + 1}">
            <span class="duration-separator">:</span>
            <input type="number" class="step-duration" min="0" max="59" value="${seconds}" aria-label="Seconden stap ${stepIndex + 1}">
            <select class="step-type" aria-label="Type stap ${stepIndex + 1}">
                <option value="active" ${step.type === 'active' ? 'selected' : ''}>Actief</option>
                <option value="pause" ${step.type === 'pause' ? 'selected' : ''}>Pauze</option>
            </select>
            ${set.steps.length > 1 ? `<button class="btn-icon btn-delete-step" aria-label="Verwijder stap ${stepIndex + 1}">&times;</button>` : ''}
        `;

        container.appendChild(row);

        // Bind change events
        const nameInput = row.querySelector('.step-name');
        const [minInput, secInput] = row.querySelectorAll('.step-duration');
        const typeSelect = row.querySelector('.step-type');

        nameInput.addEventListener('change', () => { step.name = nameInput.value; });
        minInput.addEventListener('change', () => {
            step.duration = (parseInt(minInput.value, 10) || 0) * 60 + (parseInt(secInput.value, 10) || 0);
            updateTotalDisplay();
        });
        secInput.addEventListener('change', () => {
            step.duration = (parseInt(minInput.value, 10) || 0) * 60 + (parseInt(secInput.value, 10) || 0);
            updateTotalDisplay();
        });
        typeSelect.addEventListener('change', () => { step.type = typeSelect.value; });

        const delBtn = row.querySelector('.btn-delete-step');
        if (delBtn) {
            delBtn.addEventListener('click', () => {
                set.steps.splice(stepIndex, 1);
                renderSets();
            });
        }
    });
}

function handleSave() {
    currentSchema.name = document.getElementById('schema-name').value.trim();

    if (!currentSchema.name) {
        document.getElementById('schema-name').focus();
        return;
    }

    // Validate steps have names and duration > 0
    for (const set of currentSchema.sets) {
        for (const step of set.steps) {
            if (!step.name.trim()) {
                alert('Elke stap moet een naam hebben.');
                return;
            }
            if (step.duration <= 0) {
                alert(`Stap "${step.name}" moet een duur hebben groter dan 0.`);
                return;
            }
        }
    }

    saveSchema(currentSchema);
    if (onSaveCallback) onSaveCallback();
}

function updateTotalDisplay() {
    let totalSeconds = 0;

    currentSchema.sets.forEach((set, setIndex) => {
        const setOnce = set.steps.reduce((sum, step) => sum + step.duration, 0);
        const setTotal = setOnce * set.repeats;
        totalSeconds += setTotal;

        const setDurationEl = document.getElementById(`set-duration-${setIndex}`);
        if (setDurationEl) {
            if (set.repeats > 1) {
                setDurationEl.textContent = `Set duur: ${formatTime(setOnce)} × ${set.repeats} = ${formatTime(setTotal)}`;
            } else {
                setDurationEl.textContent = `Set duur: ${formatTime(setOnce)}`;
            }
        }
    });

    const totalEl = document.getElementById('editor-total');
    totalEl.textContent = `Totale trainingsduur: ${formatTime(totalSeconds)}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
