import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const CACHE_DIR = 'filecache/';

export class RequestCache {
    // key: requestHash, value: LastRequestDateMilliseconds
    private requests: Map<string, number>;
    private cacheExpirySeconds: number;

    constructor(cacheExpirySeconds) {
        this.cacheExpirySeconds = parseInt(cacheExpirySeconds, 10);
        this.requests = new Map();

        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR);
        }
    }

    async get(url: string): Promise<string | null> {
        const reqHash = this._filenameFromUrl(url);
        const filePath = path.join(CACHE_DIR, reqHash);
        const lastRequestTime = this.requests.get(reqHash);
        if (lastRequestTime !== undefined) {
            if (this._getNow() > (lastRequestTime + this.cacheExpirySeconds * 1000)) {
                // Cache expired
                return null;
            } else {
                return await readFile(filePath);
            }
        } else {
            // Doesn't exist in cache
            return null;
        }
    }

    async set(url: string, payload: string) {
        const reqHash = this._filenameFromUrl(url);
        const filePath = path.join(CACHE_DIR, reqHash);
        this.requests.set(reqHash, this._getNow());
        await writeFile(filePath, payload);
    }

    private _getNow(): number {
        return + new Date();
    }

    private _filenameFromUrl(url: string): string {
        return crypto.createHash("sha1").update(url).digest("hex");
    }

}

// promisified fs.writeFile
export function writeFile(filename, data): Promise<void> {
    return new Promise<void>((resolve, reject) =>
        fs.writeFile(filename, data, (err) => (err) ? reject(err) : resolve())
    );
}

// promisified fs.readFile
function readFile(filename): Promise<string> {
    return new Promise<string>((resolve, reject) =>
        fs.readFile(filename, (err, data) => (err) ? reject(err) : resolve(data.toString('utf-8')))
    );
}