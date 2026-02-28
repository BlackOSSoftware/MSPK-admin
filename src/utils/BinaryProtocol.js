export const MSG_TYPE = {
    TICK: 0,
    HEARTBEAT: 1,
    BATCH: 2,
    MAPPING: 3
};

const HEADER_SIZE = 8;
const TICK_BODY_SIZE = 16; // Price(4)+Vol(4)+Bid(4)+Ask(4) = 16. User said 14 but 4*4=16. I will use 16 for alignment. 
// User specific input: "Price: 4 bytes (float32), Volume: 4 bytes (float32), Bid: 4 bytes (float32), Ask: 4 bytes (float32)"
// 4+4+4+4 = 16 bytes. 
// User text said "Tick Body (14 bytes)" but detailed 16 bytes of content. I will use 16 bytes.

export class SymbolRegistry {
    constructor() {
        this.strToId = new Map();
        this.idToStr = new Map();
        this.nextId = 1;
    }

    register(symbol) {
        if (this.strToId.has(symbol)) return this.strToId.get(symbol);
        const id = this.nextId++;
        this.strToId.set(symbol, id);
        this.idToStr.set(id, symbol);
        return id;
    }

    getStr(id) {
        return this.idToStr.get(id);
    }

    getId(symbol) {
        return this.strToId.get(symbol);
    }
}

// Singleton for consistency if imported in same runtime
export const SharedRegistry = new SymbolRegistry();

export class BinaryProtocol {
    constructor(registry = SharedRegistry) {
        this.registry = registry;
        this.version = 1;
    }

    // --- ENCODERS ---

    encodeTick(symbol, price, volume, bid, ask, timestamp = null) {
        const symbolId = this.registry.getId(symbol);
        if (!symbolId) throw new Error(\`Unknown symbol: \${symbol}\`);

        const buffer = new ArrayBuffer(HEADER_SIZE + TICK_BODY_SIZE);
        const view = new DataView(buffer);
        const ts = timestamp || Math.floor(Date.now() / 1000);

        // Header
        view.setUint8(0, this.version);
        view.setUint8(1, MSG_TYPE.TICK);
        view.setUint16(2, symbolId);
        view.setUint32(4, ts);

        // Body
        view.setFloat32(8, price);
        view.setFloat32(12, volume);
        view.setFloat32(16, bid || 0);
        view.setFloat32(20, ask || 0);

        return buffer;
    }

    encodeBatch(ticks) {
        // ticks = [{symbol, price, volume, bid, ask, time?}]
        const count = ticks.length;
        // Header(8) + Count(2) + N * (SymbolID(2) + Body(16)?) 
        // User Spec for Batch: "Count: 2 bytes, Array of Ticks"
        // Wait, Ticks usually imply SymbolID is needed for each if batch mixes symbols.
        // If batch is SINGLE symbol, Header SymbolID covers it.
        // Assuming Batch mixes symbols:
        // Structure: Header(Global?) -> maybe Type=Batch. SymbolID=0.
        // Body: Count(2) + [ {SymbolID(2), Price(4), Vol(4), Bid(4), Ask(4)} ... ]
        // Item Size = 2 + 16 = 18 bytes.
        
        const ITEM_SIZE = 2 + TICK_BODY_SIZE; 
        const buffer = new ArrayBuffer(HEADER_SIZE + 2 + (count * ITEM_SIZE));
        const view = new DataView(buffer);
        const now = Math.floor(Date.now() / 1000);

        // Header
        view.setUint8(0, this.version);
        view.setUint8(1, MSG_TYPE.BATCH);
        view.setUint16(2, 0); // Ignore for batch
        view.setUint32(4, now);

        // Count
        view.setUint16(8, count);

        let offset = 10;
        for (const t of ticks) {
            const sid = this.registry.getId(t.symbol);
            view.setUint16(offset, sid || 0);
            view.setFloat32(offset + 2, t.price);
            view.setFloat32(offset + 6, t.volume);
            view.setFloat32(offset + 10, t.bid || 0);
            view.setFloat32(offset + 14, t.ask || 0);
            offset += ITEM_SIZE;
        }

        return buffer;
    }

    encodeMapping(symbol) {
        // Send a mapping update: TYPE=MAPPING
        // Body: SymbolID(2), SymbolStringLen(1), SymbolString(N)
        const sid = this.registry.register(symbol);
        const strBytes = new TextEncoder().encode(symbol);
        const len = strBytes.length;
        
        const buffer = new ArrayBuffer(HEADER_SIZE + 3 + len);
        const view = new DataView(buffer);

        view.setUint8(0, this.version);
        view.setUint8(1, MSG_TYPE.MAPPING);
        view.setUint16(2, sid); // Redundant but consistent
        view.setUint32(4, Math.floor(Date.now() / 1000));
        
        view.setUint16(8, sid); // ID in body
        view.setUint8(10, len);
        
        const byteView = new Uint8Array(buffer);
        byteView.set(strBytes, 11);

        return buffer;
    }

    // --- DECODER ---

    decode(buffer) {
        const view = new DataView(buffer);
        
        if (buffer.byteLength < HEADER_SIZE) return null;

        const version = view.getUint8(0);
        const type = view.getUint8(1);
        const headerSid = view.getUint16(2);
        const timestamp = view.getUint32(4);

        if (type === MSG_TYPE.TICK) {
            const sym = this.registry.getStr(headerSid);
            return {
                type: 'tick',
                symbol: sym || 'UNKNOWN',
                ts: timestamp,
                price: view.getFloat32(8),
                volume: view.getFloat32(12),
                bid: view.getFloat32(16),
                ask: view.getFloat32(20)
            };
        }
        else if (type === MSG_TYPE.BATCH) {
            const count = view.getUint16(8);
            const ticks = [];
            let offset = 10;
            const ITEM_SIZE = 18;
            
            for (let i = 0; i < count; i++) {
                const sid = view.getUint16(offset);
                ticks.push({
                    symbol: this.registry.getStr(sid) || 'UNKNOWN',
                    price: view.getFloat32(offset + 2),
                    volume: view.getFloat32(offset + 6),
                    bid: view.getFloat32(offset + 10),
                    ask: view.getFloat32(offset + 14)
                });
                offset += ITEM_SIZE;
            }
            return { type: 'batch', ticks };
        }
        else if (type === MSG_TYPE.MAPPING) {
            const sid = view.getUint16(8);
            const len = view.getUint8(10);
            const strBytes = new Uint8Array(buffer, 11, len);
            const symbol = new TextDecoder().decode(strBytes);
            
            // Update Local Registry
            this.registry.strToId.set(symbol, sid);
            this.registry.idToStr.set(sid, symbol);
            
            return { type: 'mapping', symbol, id: sid };
        }

        return null;
    }
}
