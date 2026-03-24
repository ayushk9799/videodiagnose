import "./index.css";
import { Composition } from "remotion";
import { MyComposition, mockQuiz, TOTAL_DURATION } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ quiz: mockQuiz }}
      />
    </>
  );
};
