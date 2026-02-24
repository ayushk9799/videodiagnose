const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── Configuration ──────────────────────────────────────────────────────
const QUIZZES_PATH = path.resolve(__dirname, '../quizzes.json');
const ASSETS_DIR = path.resolve(__dirname, '../public/assets');
const MANIFEST_PATH = path.join(ASSETS_DIR, 'asset-manifest.json');
const CONCURRENCY = 5; // parallel downloads

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Download a file from a URL to a local destination.
 * Automatically picks http or https based on the URL.
 */
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);

        client
            .get(url, (response) => {
                // Follow redirects (3xx)
                if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                    file.close();
                    fs.unlinkSync(dest);
                    return downloadFile(response.headers.location, dest).then(resolve, reject);
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(dest);
                    return reject(
                        new Error(`HTTP ${response.statusCode} for ${url}`)
                    );
                }

                response.pipe(file);
                file.on('finish', () => file.close(resolve));
            })
            .on('error', (err) => {
                file.close();
                fs.unlink(dest, () => { }); // clean up partial file
                reject(err);
            });
    });
}

/**
 * Run an array of async tasks with limited concurrency.
 */
async function runWithConcurrency(tasks, limit) {
    const results = [];
    let index = 0;

    async function worker() {
        while (index < tasks.length) {
            const i = index++;
            results[i] = await tasks[i]();
        }
    }

    const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
        worker()
    );
    await Promise.all(workers);
    return results;
}

/**
 * Determine the file type category from an extension.
 */
function getAssetType(ext) {
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const videoExts = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    if (imageExts.includes(ext.toLowerCase())) return 'image';
    if (videoExts.includes(ext.toLowerCase())) return 'video';
    return 'other';
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
    // 1. Read quizzes.json
    console.log(`Reading quizzes from ${QUIZZES_PATH} …`);
    const quizzes = JSON.parse(fs.readFileSync(QUIZZES_PATH, 'utf-8'));
    console.log(`Found ${quizzes.length} quizzes.\n`);

    // 2. Ensure assets directory exists
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    // 3. Build download tasks and manifest data
    const manifest = {
        generatedAt: new Date().toISOString(),
        totalQuizzes: quizzes.length,
        totalAssets: 0,
        quizzes: {},
    };

    const downloadTasks = [];
    let assetCount = 0;

    for (const quiz of quizzes) {
        const quizId = quiz._id;
        const caseTitle = quiz.case_title || 'Untitled';
        const department = quiz.department || 'unknown';
        const assets = [];

        if (quiz.clinicalImages && quiz.clinicalImages.length > 0) {
            for (let i = 0; i < quiz.clinicalImages.length; i++) {
                const url = quiz.clinicalImages[i];
                if (!url || !url.startsWith('http')) continue;

                const ext = path.extname(new URL(url).pathname) || '.jpg';
                const filename = `quiz_${quizId}_${i}${ext}`;
                const localFilePath = path.join(ASSETS_DIR, filename);
                const relativePath = `assets/${filename}`;

                assets.push({
                    originalUrl: url,
                    localPath: relativePath,
                    type: getAssetType(ext),
                    extension: ext,
                });

                assetCount++;
                const taskIndex = assetCount; // capture for the closure

                downloadTasks.push(() => {
                    // Skip if file already exists and is non-empty
                    if (fs.existsSync(localFilePath)) {
                        const stats = fs.statSync(localFilePath);
                        if (stats.size > 0) {
                            console.log(
                                `  [${taskIndex}/${downloadTasks.length}] ✓ Already exists, skipping: ${filename}`
                            );
                            return Promise.resolve();
                        }
                    }

                    console.log(
                        `  [${taskIndex}/${downloadTasks.length}] ↓ Downloading: ${filename}`
                    );
                    return downloadFile(url, localFilePath).then(
                        () =>
                            console.log(
                                `  [${taskIndex}/${downloadTasks.length}] ✓ Done: ${filename}`
                            ),
                        (err) =>
                            console.error(
                                `  [${taskIndex}/${downloadTasks.length}] ✗ FAILED: ${filename} — ${err.message}`
                            )
                    );
                });
            }
        }

        manifest.quizzes[quizId] = {
            caseTitle,
            department,
            assets,
        };
    }

    manifest.totalAssets = assetCount;

    // 4. Download all assets with concurrency
    console.log(
        `\nDownloading ${assetCount} assets (concurrency: ${CONCURRENCY}) …\n`
    );
    await runWithConcurrency(downloadTasks, CONCURRENCY);

    // 5. Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`\n✅ Asset manifest written to ${MANIFEST_PATH}`);
    console.log(
        `   ${manifest.totalQuizzes} quizzes, ${manifest.totalAssets} assets total.`
    );
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
