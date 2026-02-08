const STORAGE_KEY = 'intervaltimer_schemas';

function readStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { version: 1, schemas: [] };
        const data = JSON.parse(raw);
        return data;
    } catch {
        return { version: 1, schemas: [] };
    }
}

function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadSchemas() {
    return readStore().schemas;
}

export function getSchema(id) {
    const schemas = readStore().schemas;
    return schemas.find(s => s.id === id) || null;
}

export function saveSchema(schema) {
    const store = readStore();
    const index = store.schemas.findIndex(s => s.id === schema.id);
    schema.updatedAt = new Date().toISOString();
    if (index >= 0) {
        store.schemas[index] = schema;
    } else {
        schema.createdAt = schema.updatedAt;
        store.schemas.push(schema);
    }
    writeStore(store);
}

export function deleteSchema(id) {
    const store = readStore();
    store.schemas = store.schemas.filter(s => s.id !== id);
    writeStore(store);
}
