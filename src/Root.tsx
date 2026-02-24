import "./index.css";
import { Composition } from "remotion";
import { MyComposition, mockQuiz } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={600} // 20 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ quiz: mockQuiz }}
      />
    </>
  );
};
