import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const pluginId = 'obsidian-krx-close-price-plugin';
const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'output', pluginId);
const releaseFiles = ['main.js', 'manifest.json', 'styles.css'];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const fileName of releaseFiles) {
	await cp(path.join(rootDir, fileName), path.join(outputDir, fileName));
}

console.log(`Copied release files to output/${pluginId}`);
