import { AbsoluteFill, Audio, Sequence, OffthreadVideo, getInputProps, staticFile } from "remotion";
import { QuizCard } from "./QuizCard";

const QUIZ_DURATION = 240;   // 8 seconds at 30fps
const PROMO_DURATION = 180;  // 6 seconds at 30fps

export const mockQuiz = {
  _id: "mock_123",
  department: "Cardiology",
  complain: "A 55-year-old male presents with crushing chest pain radiating to his left arm, accompanied by diaphoresis and shortness of breath.",
  clinicalImages: [],
  options: [
    "Gastroesophageal Reflux Disease",
    "Acute Myocardial Infarction",
    "Costochondritis",
    "Pulmonary Embolism"
  ],
  correctOptionIndex: 1,
  explain: {
    correct_answer: { choice: "Acute Myocardial Infarction" },
    key_features: {
      points: [
        { label: "Presentation", description: "Crushing chest pain radiating to left arm is a classic sign of myocardial ischemia." },
        { label: "Associated Symptoms", description: "Diaphoresis and dyspnea strongly support a cardiac etiology over GI or musculoskeletal." }
      ]
    },
    incorrect_options: [
      { choice: "Gastroesophageal Reflux Disease", explanation: "Typically presents as a burning sensation related to meals, not crushing pain." },
      { choice: "Costochondritis", explanation: "Pain would be reproducible on chest wall palpation." },
      { choice: "Pulmonary Embolism", explanation: "Often presents with sudden dyspnea and pleuritic pain, but less commonly with crushing retrosternal pain radiating to the arm without other risk factors." }
    ]
  }
};

export const TOTAL_DURATION = QUIZ_DURATION + PROMO_DURATION;

export const MyComposition = () => {
  const envProps = getInputProps() as { quiz?: any, audioIndex?: number };
  const activeQuiz = envProps?.quiz || mockQuiz;
  const audioIndex = envProps?.audioIndex || 0;
  const audioFile = audioIndex % 2 === 0 ? "audio/audio1.mp4" : "audio/audio2.mp4";

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Background audio plays for entire video (alternating) */}
      <Audio src={staticFile(audioFile)} />

      {/* Quiz card segment */}
      <Sequence from={0} durationInFrames={QUIZ_DURATION}>
        <AbsoluteFill>
          <QuizCard quiz={activeQuiz} />
        </AbsoluteFill>
      </Sequence>

      {/* End promo video segment */}
      <Sequence from={QUIZ_DURATION} durationInFrames={PROMO_DURATION}>
        <AbsoluteFill>
          <OffthreadVideo
            src={staticFile("audio/end-promo.mp4")}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
