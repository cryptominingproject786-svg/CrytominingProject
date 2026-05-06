export async function measureAsync(label, fn, thresholdMs = 200) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;

    if (duration >= thresholdMs) {
        console.warn(`[Perf] ${label} slow: ${duration}ms (threshold ${thresholdMs}ms)`);
    } else {
        console.debug && console.debug(`[Perf] ${label}: ${duration}ms`);
    }

    return { result, duration };
}

export async function measureBlock(label, fn) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    console.debug && console.debug(`[Perf] ${label}: ${duration}ms`);
    return { result, duration };
}
