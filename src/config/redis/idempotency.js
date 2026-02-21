const { getCache, setCache } = require('./cache');

async function saveIdempotentResult(idempotencyKey, result, ttlSeconds = 86400) {
    const key = `idempotency:${idempotencyKey}`;
    return await setCache(key, result, ttlSeconds);
}

async function getIdempotentResult(idempotencyKey) {
    const key = `idempotency:${idempotencyKey}`;
    return await getCache(key);
}

module.exports = { saveIdempotentResult, getIdempotentResult };
