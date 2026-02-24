require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gtdback_db';

const QuizzSchema = new mongoose.Schema({
    case_title: String,
    department: String,
    complain: String,
    options: [String],
    correctOptionIndex: Number,
    clinicalImages: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizzCategory' },
    explain: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const Quizz = mongoose.model('Quizz', QuizzSchema);

async function downloadAll() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const quizzes = await Quizz.find({}).lean();
    console.log(`Found ${quizzes.length} quizzes.`);

    const outputPath = path.resolve(__dirname, '../quizzes.json');
    fs.writeFileSync(outputPath, JSON.stringify(quizzes, null, 2));
    console.log(`Saved to ${outputPath}`);

    await mongoose.disconnect();
}

downloadAll().catch((err) => {
    console.error(err);
    process.exit(1);
});
