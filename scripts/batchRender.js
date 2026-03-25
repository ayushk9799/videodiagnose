#!/usr/bin/env node
require('dotenv').config();
const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia, getVideoMetadata } = require('@remotion/renderer');
const { enableTailwind } = require('@remotion/tailwind-v4');
const path = require('path');
const fs = require('fs');

// ── Paths ──────────────────────────────────────────────────────────────
const QUIZZES_PATH = path.resolve(__dirname, '../quizzes.json');
const MANIFEST_PATH = path.resolve(__dirname, '../public/assets/asset-manifest.json');
const OUTPUT_DIR = path.resolve(__dirname, '../output');
const ENTRY_POINT = path.resolve(__dirname, '../src/index.ts');
const COMPOSITION_ID = 'MyComp';

// ── CLI Arg Parsing ────────────────────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
        limit: null,      // number of quizzes to render
        offset: 0,        // skip first N quizzes
        concurrency: 1,   // parallel renders (be careful with RAM)
        id: null,         // render a specific quiz by _id
        skipExisting: true, // skip if output file already exists
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--limit':
                parsed.limit = parseInt(args[++i], 10);
                break;
            case '--offset':
                parsed.offset = parseInt(args[++i], 10);
                break;
            case '--concurrency':
                parsed.concurrency = parseInt(args[++i], 10);
                break;
            case '--id':
                parsed.id = args[++i];
                break;
            case '--force':
                parsed.skipExisting = false;
                break;
            case '--help':
                printHelp();
                process.exit(0);
        }
    }
    return parsed;
}

function printHelp() {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║              Quiz Reels — Batch Renderer                ║
╚══════════════════════════════════════════════════════════╝

Usage:
  node scripts/batchRender.js [options]

Options:
  --limit N        Render only N quizzes (default: all)
  --offset N       Skip the first N quizzes (default: 0)
  --concurrency N  Render N videos in parallel (default: 1)
  --id <quiz_id>   Render only a specific quiz by its _id
  --force          Re-render even if output file exists
  --help           Show this help message

Examples:
  node scripts/batchRender.js --limit 5
  node scripts/batchRender.js --limit 10 --offset 10
  node scripts/batchRender.js --concurrency 2
  node scripts/batchRender.js --id 6982fa92499ed493f38d7a33
  node scripts/batchRender.js --limit 3 --force
`);
}

// ── Asset Resolution ───────────────────────────────────────────────────
/**
 * Resolves a quiz's clinicalImages URLs to local asset paths
 * using the asset-manifest.json lookup.
 */
function resolveLocalAssets(quiz, manifest) {
    const quizId = quiz._id;
    const manifestEntry = manifest.quizzes[quizId];

    if (!manifestEntry || !manifestEntry.assets || manifestEntry.assets.length === 0) {
        // No local assets found — keep original URLs as fallback
        return quiz;
    }

    // Build a map: originalUrl -> localPath
    const urlToLocal = {};
    for (const asset of manifestEntry.assets) {
        urlToLocal[asset.originalUrl] = asset.localPath;
    }

    // Replace clinicalImages with local paths
    const resolvedImages = (quiz.clinicalImages || []).map((url) => {
        if (urlToLocal[url]) {
            return urlToLocal[url];
        }
        // If no local mapping, keep original URL
        return url;
    });

    return {
        ...quiz,
        clinicalImages: resolvedImages,
    };
}

// ── Concurrency Runner ────────────────────────────────────────────────
/**
 * Runs tasks with a specified concurrency limit.
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

    const workers = Array.from(
        { length: Math.min(limit, tasks.length) },
        () => worker()
    );
    await Promise.all(workers);
    return results;
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
    const config = parseArgs();

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              Quiz Reels — Batch Renderer                ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // 1. Load quizzes.json
    console.log(`📂 Loading quizzes from ${QUIZZES_PATH}…`);
    if (!fs.existsSync(QUIZZES_PATH)) {
        console.error('❌ quizzes.json not found! Run downloadQuizzes.js first.');
        process.exit(1);
    }
    const allQuizzes = JSON.parse(fs.readFileSync(QUIZZES_PATH, 'utf-8'));
    console.log(`   Found ${allQuizzes.length} total quizzes.\n`);

    // 2. Load asset manifest
    console.log(`📂 Loading asset manifest from ${MANIFEST_PATH}…`);
    let manifest = { quizzes: {} };
    if (fs.existsSync(MANIFEST_PATH)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
        console.log(`   Found assets for ${Object.keys(manifest.quizzes).length} quizzes.\n`);
    } else {
        console.warn('⚠️  asset-manifest.json not found — will use remote URLs as fallback.\n');
    }

    // 3. Filter quizzes based on CLI args
    let quizzes;
    if (config.id) {
        const found = allQuizzes.find((q) => q._id === config.id);
        if (!found) {
            console.error(`❌ No quiz found with _id: ${config.id}`);
            process.exit(1);
        }
        quizzes = [found];
        console.log(`🎯 Rendering single quiz: ${config.id} — "${found.case_title}"\n`);
    } else {
        quizzes = allQuizzes.slice(config.offset);
        if (config.limit) {
            quizzes = quizzes.slice(0, config.limit);
        }
        console.log(`🎯 Rendering ${quizzes.length} quizzes (offset: ${config.offset}, limit: ${config.limit || 'all'})\n`);
    }

    // 4. Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 5. Filter out already-rendered quizzes if --force is not set
    if (config.skipExisting) {
        const before = quizzes.length;
        quizzes = quizzes.filter((q, idx) => {
            const paddedIdx = String(idx + 1 + config.offset).padStart(4, '0');
            const outputPath = path.join(OUTPUT_DIR, `quizz_${paddedIdx}.mp4`);
            return !fs.existsSync(outputPath);
        });
        const skipped = before - quizzes.length;
        if (skipped > 0) {
            console.log(`⏭️  Skipping ${skipped} already-rendered quizzes (use --force to re-render).\n`);
        }
    }

    if (quizzes.length === 0) {
        console.log('✅ Nothing to render — all quizzes are already done!');
        return;
    }

    // 6. Bundle Remotion project ONCE
    console.log('📦 Bundling Remotion project (this happens only once)…');
    const bundleStart = Date.now();
    const bundleLocation = await bundle({
        entryPoint: ENTRY_POINT,
        webpackOverride: (currentConfig) => enableTailwind(currentConfig),
    });
    console.log(`   Bundle complete in ${((Date.now() - bundleStart) / 1000).toFixed(1)}s\n`);

    // 7. Fetch compositions once
    console.log('🔍 Fetching compositions…');
    const sampleQuiz = resolveLocalAssets(quizzes[0], manifest);
    const compositions = await getCompositions(bundleLocation, {
        inputProps: { quiz: JSON.parse(JSON.stringify(sampleQuiz)) },
    });
    const composition = compositions.find((c) => c.id === COMPOSITION_ID);
    if (!composition) {
        throw new Error(`No composition with ID "${COMPOSITION_ID}" found.`);
    }
    console.log(`   Using composition: ${COMPOSITION_ID} (${composition.width}x${composition.height} @ ${composition.fps}fps)\n`);

    // 8. Build render tasks
    const totalToRender = quizzes.length;
    let completed = 0;
    let failed = 0;
    const startTime = Date.now();

    const renderTasks = quizzes.map((quiz, idx) => {
        return async () => {
            const quizId = quiz._id;
            const caseTitle = quiz.case_title || 'Untitled';
            
            const absoluteIdx = idx + 1 + config.offset;
            const paddedIdx = String(absoluteIdx).padStart(4, '0');
            const outputPath = path.join(OUTPUT_DIR, `quizz_${paddedIdx}.mp4`);

            // Resolve local assets
            const resolvedQuiz = resolveLocalAssets(quiz, manifest);
            const plainQuiz = JSON.parse(JSON.stringify(resolvedQuiz));

            // Fetch video duration if it's a video
            if (plainQuiz.clinicalImages && plainQuiz.clinicalImages.length > 0) {
                const src = plainQuiz.clinicalImages[0];
                const isVideo = /\.(mp4|webm|mov)$/i.test(src);
                if (isVideo) {
                    try {
                        const localPath = src.startsWith('http') ? src : path.resolve(__dirname, '../public', src);
                        const metadata = await getVideoMetadata(localPath);
                        plainQuiz.videoDurationInFrames = Math.max(1, Math.floor(metadata.durationInSeconds * composition.fps));
                    } catch (err) {
                        console.warn(`   ⚠️  Could not fetch metadata for ${src}: ${err.message}`);
                    }
                }
            }

            console.log(`\n🎬 [${idx + 1}/${totalToRender}] Rendering: "${caseTitle}" (${quizId}) -> quizz_${paddedIdx}.mp4`);

            try {
                await renderMedia({
                    composition,
                    serveUrl: bundleLocation,
                    codec: 'h264',
                    outputLocation: outputPath,
                    inputProps: { quiz: plainQuiz, audioIndex: idx },
                });

                completed++;
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                const avgPerQuiz = (elapsed / completed).toFixed(1);
                const remaining = ((totalToRender - completed - failed) * avgPerQuiz).toFixed(0);
                console.log(`   ✅ Done → ${outputPath}`);
                console.log(`   📊 Progress: ${completed}/${totalToRender} done | ${failed} failed | ~${remaining}s remaining`);
            } catch (err) {
                failed++;
                console.error(`   ❌ FAILED: ${caseTitle} — ${err.message}`);
            }
        };
    });

    // 9. Execute renders with concurrency
    console.log(`\n🚀 Starting batch render: ${totalToRender} quizzes, concurrency: ${config.concurrency}\n`);
    console.log('━'.repeat(60));

    await runWithConcurrency(renderTasks, config.concurrency);

    // 10. Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '━'.repeat(60));
    console.log(`\n🏁 Batch render complete!`);
    console.log(`   ✅ Rendered: ${completed}`);
    console.log(`   ❌ Failed:   ${failed}`);
    console.log(`   ⏱️  Total time: ${totalTime}s`);
    console.log(`   📁 Output dir: ${OUTPUT_DIR}\n`);
}

main().catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
