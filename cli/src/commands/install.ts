import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(data);
        }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

function post(url: string, body: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;
    const data = JSON.stringify(body);

    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => resolve(responseData));
        res.on("error", reject);
      }
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export async function installSkill(
  slug: string,
  apiUrl: string,
  apiKey?: string
): Promise<void> {
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
  } else {
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
  } catch {
    // Non-fatal: install tracking failure shouldn't block the install
  }

  console.log(
    `\nInstalled "${skill.name}" (${skill.installCount + 1} total installs)`
  );
}
