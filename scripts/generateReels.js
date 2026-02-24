require('dotenv').config();
const mongoose = require('mongoose');
const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { enableTailwind } = require('@remotion/tailwind-v4');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gtdback_db';

const QuizzSchema = new mongoose.Schema({
    department: String,
    complain: String,
    options: [String],
    correctOptionIndex: Number,
    clinicalImages: [String],
    explain: mongoose.Schema.Types.Mixed,
});

const Quizz = mongoose.model('Quizz', QuizzSchema);

// Helper function to download an image
const downloadImage = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error('Failed to download image: ' + response.statusCode));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

async function generateReels() {
    console.log('Connecting to MongoDB at', MONGODB_URI);
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const quizzes = await Quizz.find({}).limit(1).lean();
        if (quizzes.length === 0) {
            console.log('No quizzes found.');
            return;
        }

        const quiz = quizzes[0];
        console.log(`Generating reel for quiz: ${quiz._id}`);

        // Handle Image Downloading
        if (quiz.clinicalImages && quiz.clinicalImages.length > 0) {
            const assetsDir = path.resolve(__dirname, '../public/assets');
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }

            console.log('Downloading clinical images locally to avoid Remotion network timeouts...');
            const localImages = [];
            for (let i = 0; i < quiz.clinicalImages.length; i++) {
                const url = quiz.clinicalImages[i];
                if (url.startsWith('http')) {
                    // Extract filename securely or generate one
                    const filename = `img_${quiz._id}_${i}${path.extname(new URL(url).pathname) || '.jpg'}`;
                    const localPath = path.join(assetsDir, filename);

                    console.log(`Downloading ${url} -> ${localPath}`);
                    await downloadImage(url, localPath);
                    // Pass the relative path for staticFile to pick up
                    localImages.push(`assets/${filename}`);
                } else {
                    localImages.push(url);
                }
            }
            quiz.clinicalImages = localImages;
        }

        const plainQuiz = JSON.parse(JSON.stringify(quiz));

        // Remotion Rendering Logic
        const compositionId = 'MyComp';
        const entry = path.resolve(__dirname, '../src/index.ts');

        console.log('Bundling Remotion project...');
        const bundleLocation = await bundle({
            entryPoint: entry,
            webpackOverride: (config) => enableTailwind(config),
        });

        console.log('Fetching compositions...');
        const compositions = await getCompositions(bundleLocation, {
            inputProps: { quiz: plainQuiz },
        });

        const composition = compositions.find((c) => c.id === compositionId);
        if (!composition) {
            throw new Error(`No composition with the ID ${compositionId} found`);
        }

        const outputLocation = path.resolve(__dirname, `../output/quiz_${plainQuiz._id}.mp4`);
        if (!fs.existsSync(path.resolve(__dirname, '../output'))) {
            fs.mkdirSync(path.resolve(__dirname, '../output'));
        }

        console.log(`Rendering video to ${outputLocation}...`);
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            inputProps: { quiz: plainQuiz },
        });

        console.log('Render complete!');

    } catch (error) {
        console.error('Error generating reels:', error);
    } finally {
        await mongoose.disconnect();
    }
}

generateReels();
