import { TimerEngine } from './timer-engine.js';
import { initAudio, playCountdown, playStepEnd, playStartSignal, playVictorySound } from './audio.js';
import { requestWakeLock, releaseWakeLock } from './wake-lock.js';
import { formatTime } from './utils.js';

let engine = null;
let onStopCallback = null;
let setOverviewData = [];

// DOM element references
const els = {};

function cacheElements() {
    els.container = document.getElementById('timer-container');
    els.display = document.getElementById('timer-display');
    els.stepName = document.getElementById('timer-step-name');
    els.info = document.getElementById('timer-info');
    els.setName = document.getElementById('timer-set-name');
    els.progressBar = document.getElementById('progress-bar');
    els.btnPause = document.getElementById('btn-pause');
    els.btnSkip = document.getElementById('btn-skip');
    els.btnStop = document.getElementById('btn-stop');
    els.complete = document.getElementById('timer-complete');
    els.completeSummary = document.getElementById('complete-summary');
    els.totalTime = document.getElementById('timer-total');
    els.horseSprite = document.getElementById('horse-sprite');
    els.setOverview = document.getElementById('set-overview');
}

/**
 * Flatten a schema into a sequential execution plan.
 */
function flattenSchema(schema) {
    const plan = [];
    for (let setIdx = 0; setIdx < schema.sets.length; setIdx++) {
        const set = schema.sets[setIdx];
        for (let round = 1; round <= set.repeats; round++) {
            for (let i = 0; i < set.steps.length; i++) {
                const step = set.steps[i];
                plan.push({
                    name: step.name,
                    duration: step.duration,
                    type: step.type,
                    setName: set.name,
                    setIndex: setIdx,
                    round,
                    totalRounds: set.repeats,
                    stepIndex: i + 1,
                    totalSteps: set.steps.length
                });
            }
        }
    }
    return plan;
}

/**
 * Build set overview data from schema for the upcoming sets list.
 */
function buildSetOverview(schema) {
    return schema.sets.map((set, index) => {
        const stepDuration = set.steps.reduce((sum, s) => sum + s.duration, 0);
        const totalDuration = stepDuration * set.repeats;
        return { index, name: set.name, totalDuration };
    });
}

/**
 * Render the set overview list, hiding completed sets and highlighting current.
 */
function renderSetOverview(currentSetIndex) {
    if (!els.setOverview) return;

    els.setOverview.innerHTML = setOverviewData
        .filter(s => s.index >= currentSetIndex)
        .map(s => {
            const isCurrent = s.index === currentSetIndex;
            const cls = isCurrent ? 'set-overview-item current' : 'set-overview-item';
            return `<div class="${cls}"><span class="set-overview-name">${s.name}</span><span class="set-overview-time">${formatTime(s.totalDuration)}</span></div>`;
        })
        .join('');
}

export function startTimer(schema, onStop) {
    cacheElements();
    onStopCallback = onStop;

    // Initialize audio on user gesture
    initAudio();

    const plan = flattenSchema(schema);
    engine = new TimerEngine(plan);

    // Build set overview
    setOverviewData = buildSetOverview(schema);
    renderSetOverview(0);

    // Show timer, hide complete screen
    els.container.style.display = '';
    els.complete.classList.remove('active');

    // Wire up events
    engine.addEventListener('tick', (e) => onTick(e.detail));
    engine.addEventListener('countdown', (e) => onCountdown(e.detail));
    engine.addEventListener('step-start', (e) => onStepStart(e.detail));
    engine.addEventListener('step-end', (e) => onStepEnd(e.detail));
    engine.addEventListener('complete', () => onComplete(schema.name, plan));

    // Wire up controls
    els.btnPause.onclick = togglePause;
    els.btnSkip.onclick = () => engine.skipToNext();
    els.btnStop.onclick = handleStop;

    // Acquire wake lock
    requestWakeLock();

    // Show initial countdown 3-2-1 before starting
    runStartCountdown(plan[0]).then(() => {
        engine.start();
    });
}

/**
 * 3-2-1 countdown before the training begins.
 * Shows the first step info while counting down.
 */
function runStartCountdown(firstSegment) {
    return new Promise(resolve => {
        // Show first step info during countdown
        els.stepName.textContent = 'Klaar?';
        els.info.textContent = `Volgende: ${firstSegment.name}`;
        els.setName.textContent = firstSegment.setName;
        els.container.className = 'timer-container';

        let count = 10;
        els.display.textContent = String(count);
        if (count <= 3) {
            els.display.classList.add('countdown-warning');
            playCountdown(count);
        }

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                els.display.textContent = String(count);
                if (count <= 3) {
                    els.display.classList.add('countdown-warning');
                    playCountdown(count);
                }
            } else {
                clearInterval(interval);
                els.display.classList.remove('countdown-warning');
                // Play long start signal and start timer immediately together
                playStartSignal();
                resolve();
            }
        }, 1000);
    });
}

let lastDisplayedSecond = -1;

function onTick({ remaining, segment, overallProgress }) {
    const currentSecond = Math.ceil(remaining);

    // Only update DOM when second changes
    if (currentSecond !== lastDisplayedSecond) {
        lastDisplayedSecond = currentSecond;
        els.display.textContent = formatTime(currentSecond);

        // Countdown warning color
        if (remaining <= 3) {
            els.display.classList.add('countdown-warning');
        } else {
            els.display.classList.remove('countdown-warning');
        }

        // Total remaining time
        const totalRemaining = engine.totalDuration - (engine.completedDuration + (segment.duration - remaining));
        els.totalTime.textContent = `Totaal resterend: ${formatTime(Math.ceil(totalRemaining))}`;
    }

    // Update progress bar smoothly
    const percent = Math.min(100, overallProgress * 100);
    els.progressBar.style.width = `${percent}%`;
    els.progressBar.parentElement.setAttribute('aria-valuenow', Math.round(percent));
}

function onCountdown({ secondsLeft }) {
    playCountdown(secondsLeft);
}

function onStepStart({ segment, segmentIndex }) {
    lastDisplayedSecond = -1;

    els.stepName.textContent = segment.name;
    els.display.textContent = formatTime(segment.duration);
    els.info.textContent = `Ronde ${segment.round}/${segment.totalRounds} — Stap ${segment.stepIndex}/${segment.totalSteps}`;
    els.setName.textContent = segment.setName;

    // Color coding
    els.container.className = 'timer-container';
    els.container.classList.add(segment.type === 'pause' ? 'type-pause' : 'type-active');

    // Randomly pick brown or black horse for active steps
    if (segment.type === 'active' && els.horseSprite) {
        if (Math.random() < 0.5) {
            els.horseSprite.classList.add('negro');
        } else {
            els.horseSprite.classList.remove('negro');
        }
    }

    els.display.classList.remove('countdown-warning');

    // Total remaining time
    const totalRemaining = engine.totalDuration - engine.completedDuration;
    els.totalTime.textContent = `Totaal resterend: ${formatTime(Math.ceil(totalRemaining))}`;

    // Update set overview
    renderSetOverview(segment.setIndex);
}

function onStepEnd({ segment }) {
    // Look at the NEXT step to decide which sound to play
    // segmentIndex still points to current step at this point
    const nextIndex = engine.segmentIndex + 1;
    const nextSegment = engine.plan[nextIndex];

    if (nextSegment && nextSegment.type === 'active') {
        // Pause ended → active starts: long start signal
        playStartSignal();
    } else {
        // Active ended → pause starts (or end): three short pulses
        playStepEnd();
    }
}

function onComplete(schemaName, plan) {
    playVictorySound();
    releaseWakeLock();

    els.container.style.display = 'none';
    els.complete.classList.add('active');

    const totalTime = plan.reduce((sum, s) => sum + s.duration, 0);
    els.completeSummary.textContent = `${schemaName} — ${formatTime(totalTime)} totaal`;

    els.progressBar.style.width = '100%';
}

function togglePause() {
    if (!engine) return;

    if (engine.paused) {
        engine.resume();
        els.btnPause.textContent = 'Pauze';
        els.btnPause.className = 'btn btn-primary';
    } else {
        engine.pause();
        els.btnPause.textContent = 'Hervat';
        els.btnPause.className = 'btn btn-success';
    }
}

function handleStop() {
    if (!engine) return;

    if (confirm('Weet je zeker dat je de training wilt stoppen?')) {
        engine.stop();
        releaseWakeLock();
        if (onStopCallback) onStopCallback();
    }
}

export function cleanupTimer() {
    if (engine) {
        engine.stop();
        engine = null;
    }
    releaseWakeLock();
}
