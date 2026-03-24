import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const isVideoFile = (src: string) => /\.(mp4|webm|mov)$/i.test(src);

export const QuizCard: React.FC<{ quiz: any }> = ({ quiz }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const optionLabels = ['A', 'B', 'C', 'D'];
    
    const hasImage = quiz.clinicalImages && quiz.clinicalImages.length > 0 && quiz.clinicalImages[0];
    const clinicalSrc = hasImage
        ? (quiz.clinicalImages[0].startsWith('http') ? quiz.clinicalImages[0] : staticFile(quiz.clinicalImages[0]))
        : '';
    const isVideo = hasImage && isVideoFile(quiz.clinicalImages[0]);

    // Header animation (0-20)
    const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const headerTranslateY = interpolate(frame, [0, 20], [-50, 0], { extrapolateRight: 'clamp' });

    // Question animation (10-30)
    const questionOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
    const questionTranslateY = interpolate(frame, [10, 30], [30, 0], { extrapolateRight: 'clamp' });

    // Image animation (starts at frame 5) using spring
    const imageScale = spring({
        frame: frame - 5,
        fps,
        config: { damping: 12, stiffness: 100 },
    });
    const imageOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '100px 60px',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#FFFFFF',
        }}>
            {/* Department Tag: Sole header at the top */}
            {quiz.department && (
                <div style={{
                    fontSize: 48,
                    fontWeight: 900,
                    fontStyle: 'italic',
                    color: '#FF4081',
                    textAlign: 'center',
                    marginBottom: 30,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    width: '100%',
                    opacity: headerOpacity,
                    transform: `translateY(${headerTranslateY}px)`,
                }}>
                    {quiz.department}
                </div>
            )}

            {/* Question */}
            <div style={{
                fontSize: 48,
                fontWeight: 600,
                textAlign: 'center',
                lineHeight: 1.4,
                marginBottom: 40,
                maxWidth: '90%',
                color: '#FFFFFF',
                opacity: questionOpacity,
                transform: `translateY(${questionTranslateY}px)`,
            }}>
                {quiz.complain}
            </div>

            {/* Clinical Image or Video */}
            {hasImage && (
                <div style={{
                    width: '85%',
                    maxWidth: 800,
                    marginBottom: 50,
                    borderRadius: 30,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(255,255,255,0.05)',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    opacity: imageOpacity,
                    transform: `scale(${imageScale})`,
                }}>
                    {isVideo ? (
                        <OffthreadVideo
                            src={clinicalSrc}
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <Img
                            src={clinicalSrc}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </div>
            )}

            {/* Options List: Centered as a group, but left-aligned within that group */}
            <div style={{
                display: 'inline-flex',
                flexDirection: 'column',
                gap: 20,
                alignItems: 'flex-start',
            }}>
                {quiz.options?.map((option: string, optIdx: number) => {
                    const staggerDelay = 40 + (optIdx * 8);
                    const optOpacity = interpolate(frame, [staggerDelay, staggerDelay + 15], [0, 1], { extrapolateRight: 'clamp' });
                    const optTranslateX = interpolate(frame, [staggerDelay, staggerDelay + 15], [-20, 0], { extrapolateRight: 'clamp' });
                    
                    return (
                        <div
                            key={optIdx}
                            style={{
                                fontSize: 50,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 16,
                                color: '#EEEEEE',
                                opacity: optOpacity,
                                transform: `translateX(${optTranslateX}px)`,
                            }}
                        >
                            <span style={{ minWidth: '60px', color: '#FF4081' }}>{optionLabels[optIdx]})</span>
                            <span>{option}</span>
                        </div>
                    );
                })}
            </div>

            {/* Comment your answer CTA */}
            <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#FF4081',
                textAlign: 'center',
                marginTop: 30,
                opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' }),
                transform: `translateY(${interpolate(frame, [80, 100], [15, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
                💬 Comment your answer!
            </div>

            {/* Branding/Watermark */}
            <div style={{
                position: 'absolute',
                bottom: 60,
                fontSize: 26,
                color: '#222222',
                fontWeight: 600,
                letterSpacing: 2,
                opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: 'clamp' }),
            }}>
                @diagnose_it
            </div>
        </AbsoluteFill>
    );
};
