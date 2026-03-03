"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.installSkill = installSkill;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
function fetch(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http;
        client.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
                else {
                    resolve(data);
                }
            });
            res.on("error", reject);
        }).on("error", reject);
    });
}
function post(url, body) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const client = parsed.protocol === "https:" ? https : http;
        const data = JSON.stringify(body);
        const req = client.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
            },
        }, (res) => {
            let responseData = "";
            res.on("data", (chunk) => (responseData += chunk));
            res.on("end", () => resolve(responseData));
            res.on("error", reject);
        });
        req.on("error", reject);
        req.write(data);
        req.end();
    });
}
async function installSkill(slug, apiUrl, apiKey) {
    console.log(`Fetching skill "${slug}"...`);
    const skillData = await fetch(`${apiUrl}/api/skills/${slug}`);
    const skill = JSON.parse(skillData);
    if (skill.error) {
        console.error(`Error: ${skill.error}`);
        process.exit(1);
    }
    // Write files if available
    if (skill.files && skill.files.length > 0) {
        for (const file of skill.files) {
            const filePath = path.join(process.cwd(), file.path, file.filename);
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, file.content, "utf-8");
            console.log(`  Written: ${file.path}/${file.filename}`);
        }
    }
    else {
        console.log(`  No files to download (source: ${skill.sourceType})`);
        if (skill.repoUrl) {
            console.log(`  Repository: ${skill.repoUrl}`);
        }
    }
    // Record install event
    try {
        await post(`${apiUrl}/api/installs`, {
            skillSlug: slug,
            source: "CLI",
            ...(apiKey && { userId: apiKey }),
        });
    }
    catch {
        // Non-fatal: install tracking failure shouldn't block the install
    }
    console.log(`\nInstalled "${skill.name}" (${skill.installCount + 1} total installs)`);
}
