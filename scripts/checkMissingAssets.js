#!/usr/bin/env node

/**
 * Checks which quizzes from quizzes.json are missing from asset-manifest.json
 * (i.e. their assets have not been downloaded yet).
 */

const fs = require('fs');
const path = require('path');

const quizzesPath = path.join(__dirname, '..', 'quizzes.json');
const manifestPath = path.join(__dirname, '..', 'public', 'assets', 'asset-manifest.json');

const quizzes = JSON.parse(fs.readFileSync(quizzesPath, 'utf-8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

const manifestQuizIds = new Set(Object.keys(manifest.quizzes || {}));

const missing = [];
const noImages = [];

for (const quiz of quizzes) {
    const id = quiz._id;
    const title = quiz.case_title || 'Untitled';
    const images = quiz.clinicalImages || [];

    if (images.length === 0) {
        noImages.push({ id, title });
        continue;
    }

    if (!manifestQuizIds.has(id)) {
        missing.push({ id, title, urls: images });
    }
}

console.log('=== MISSING ASSETS REPORT ===\n');
console.log(`Total quizzes in quizzes.json: ${quizzes.length}`);
console.log(`Total quizzes in asset-manifest: ${manifestQuizIds.size}`);
console.log(`Quizzes with NO clinicalImages: ${noImages.length}`);
console.log(`Quizzes with assets NOT downloaded: ${missing.length}\n`);

if (missing.length > 0) {
    console.log('--- Quizzes with assets NOT yet downloaded ---\n');
    for (const m of missing) {
        console.log(`  ID: ${m.id}`);
        console.log(`  Title: ${m.title}`);
        console.log(`  URLs: ${m.urls.join(', ')}`);
        console.log('');
    }
}

if (noImages.length > 0) {
    console.log('--- Quizzes with NO clinicalImages field ---\n');
    for (const q of noImages) {
        console.log(`  ID: ${q.id}  |  Title: ${q.title}`);
    }
    console.log('');
}

if (missing.length === 0 && noImages.length === 0) {
    console.log('✅ All quizzes have their assets downloaded!');
}
