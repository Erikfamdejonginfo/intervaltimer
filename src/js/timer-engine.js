/**
 * TimerEngine — drift-free interval timer using performance.now().
 *
 * Events emitted:
 *   'tick'       — { remaining, total, segmentIndex, segment }
 *   'countdown'  — { secondsLeft: 3|2|1 }
 *   'step-end'   — { segment }
 *   'step-start' — { segment, segmentIndex }
 *   'complete'   — {}
 */
export class TimerEngine extends EventTarget {
    constructor(plan) {
        super();
        this.plan = plan;               // Array of { name, duration, type, ... }
        this.segmentIndex = 0;
        this.running = false;
        this.paused = false;
        this.segmentStartTime = 0;
        this.pauseElapsed = 0;          // Time elapsed before pause
        this.rafId = null;
        this.timeoutId = null;
        this.firedThresholds = new Set();

        // Pre-compute total duration for progress
        this.totalDuration = plan.reduce((sum, seg) => sum + seg.duration, 0);
        this.completedDuration = 0;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.paused = false;
        this.segmentIndex = 0;
        this.completedDuration = 0;
        this.startSegment();
    }

    pause() {
        if (!this.running || this.paused) return;
        this.paused = true;
        this.pauseElapsed = performance.now() - this.segmentStartTime;
        this.cancelTimers();
    }

    resume() {
        if (!this.running || !this.paused) return;
        this.paused = false;
        this.segmentStartTime = performance.now() - this.pauseElapsed;
        this.scheduleTimers();
        this.tick();
    }

    stop() {
        this.running = false;
        this.paused = false;
        this.cancelTimers();
    }

    skipToNext() {
        if (!this.running) return;
        this.completedDuration += this.currentSegment().duration;
        this.segmentIndex++;
        if (this.segmentIndex >= this.plan.length) {
            this.complete();
        } else {
            this.emit('step-end', { segment: this.plan[this.segmentIndex - 1] });
            this.startSegment();
        }
    }

    currentSegment() {
        return this.plan[this.segmentIndex];
    }

    startSegment() {
        this.cancelTimers();
        this.firedThresholds.clear();
        this.segmentStartTime = performance.now();
        this.pauseElapsed = 0;

        const segment = this.currentSegment();
        this.emit('step-start', { segment, segmentIndex: this.segmentIndex });
        this.scheduleTimers();
        this.tick();
    }

    scheduleTimers() {
        // Schedule a timeout for the end of this segment as a fallback
        const segment = this.currentSegment();
        const elapsed = this.paused ? this.pauseElapsed : (performance.now() - this.segmentStartTime);
        const remaining = Math.max(0, segment.duration * 1000 - elapsed);

        this.timeoutId = setTimeout(() => this.onSegmentEnd(), remaining + 50);

        // Start the animation frame loop
        this.rafLoop();
    }

    cancelTimers() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    rafLoop() {
        if (!this.running || this.paused) return;
        this.rafId = requestAnimationFrame(() => {
            this.tick();
            this.rafLoop();
        });
    }

    tick() {
        if (!this.running || this.paused) return;

        const segment = this.currentSegment();
        const elapsed = (performance.now() - this.segmentStartTime) / 1000;
        const remaining = Math.max(0, segment.duration - elapsed);

        // Check countdown thresholds
        for (const threshold of [3, 2, 1]) {
            if (remaining <= threshold && remaining > threshold - 1 && !this.firedThresholds.has(threshold)) {
                this.firedThresholds.add(threshold);
                this.emit('countdown', { secondsLeft: threshold });
            }
        }

        // Check if segment ended
        if (remaining <= 0) {
            this.onSegmentEnd();
            return;
        }

        // Emit tick for display updates
        const overallElapsed = this.completedDuration + elapsed;
        this.emit('tick', {
            remaining,
            total: segment.duration,
            segmentIndex: this.segmentIndex,
            segment,
            overallProgress: this.totalDuration > 0 ? overallElapsed / this.totalDuration : 0
        });
    }

    onSegmentEnd() {
        this.cancelTimers();
        const segment = this.currentSegment();
        this.completedDuration += segment.duration;
        this.emit('step-end', { segment });

        this.segmentIndex++;
        if (this.segmentIndex >= this.plan.length) {
            this.complete();
        } else {
            this.startSegment();
        }
    }

    complete() {
        this.running = false;
        this.cancelTimers();
        this.emit('complete', {});
    }

    emit(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}
