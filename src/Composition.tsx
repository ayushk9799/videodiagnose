import { AbsoluteFill, Sequence, getInputProps } from "remotion";
import { QuizCard, QUESTION_EXIT_FRAME } from "./QuizCard";
import { ExplanationCard } from "./ExplanationCard";

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

export const MyComposition = () => {
  const envProps = getInputProps() as { quiz?: any };
  const activeQuiz = envProps?.quiz || mockQuiz;

  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF7FA' }}>
      {/* Quiz card: visible from frame 0, exits at QUESTION_EXIT_FRAME (9s) */}
      <Sequence from={0} durationInFrames={QUESTION_EXIT_FRAME + 60}>
        <QuizCard quiz={activeQuiz} />
      </Sequence>

      {/* Explanation card: starts at 9 seconds, after the quiz exits */}
      <Sequence from={QUESTION_EXIT_FRAME}>
        <ExplanationCard explain={activeQuiz.explain} />
      </Sequence>
    </AbsoluteFill>
  );
};
