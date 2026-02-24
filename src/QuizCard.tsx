import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, useVideoConfig, useCurrentFrame, staticFile, interpolate, spring } from 'remotion';

// Phase 1: 0-5s (frames 0-150) — Static question + countdown
// Phase 2: 5-9s (frames 150-270) — Reveal correct answer in green
// Phase 3: 9s+ (frame 270+) — Question exits, explanation slides in

export const REVEAL_FRAME = 30 * 5;      // 5 seconds
export const QUESTION_EXIT_FRAME = 30 * 7; // 7 seconds

const isVideoFile = (src: string) => /\.(mp4|webm|mov)$/i.test(src);

export const QuizCard: React.FC<{ quiz: any }> = ({ quiz }) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();

    // Exit animation
    const exitProgress = spring({
        frame: frame - QUESTION_EXIT_FRAME,
        fps,
        config: { damping: 200 },
    });
    const questionOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
    const questionTranslateY = interpolate(exitProgress, [0, 1], [0, -80]);

    const isRevealed = frame >= REVEAL_FRAME;
    const secondsLeft = Math.max(1, Math.ceil((REVEAL_FRAME - frame) / fps));
    const showCountdown = frame < REVEAL_FRAME;
    const countdownProgress = Math.min(1, frame / REVEAL_FRAME);

    const revealSpring = spring({
        frame: frame - REVEAL_FRAME,
        fps,
        config: { damping: 20, stiffness: 120 },
    });
    const revealAmount = isRevealed ? revealSpring : 0;

    const optionLabels = ['A', 'B', 'C', 'D'];
    const hasImage = quiz.clinicalImages && quiz.clinicalImages.length > 0 && quiz.clinicalImages[0];
    const clinicalSrc = hasImage
        ? (quiz.clinicalImages[0].startsWith('http') ? quiz.clinicalImages[0] : staticFile(quiz.clinicalImages[0]))
        : '';
    const isVideo = hasImage && isVideoFile(quiz.clinicalImages[0]);

    return (
        <AbsoluteFill style={{
            backgroundColor: '#FFF7FA',
            display: 'flex',
            flexDirection: 'column',
            padding: '160px 60px 40px',
            fontFamily: 'Inter, system-ui, sans-serif',
            opacity: questionOpacity,
            transform: `translateY(${questionTranslateY}px)`,
        }}>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: 32,
                boxShadow: '0 12px 24px rgba(255,77,140,0.12)',
                border: '2px solid #FFEAF2',
                overflow: 'hidden',
            }}>
                {/* Department tag */}
                {quiz.department && (
                    <div style={{ marginBottom: 6 }}>
                        <span style={{
                            color: '#E91E63',
                            fontWeight: 700,
                            fontSize: 26,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase' as const,
                        }}>{quiz.department}</span>
                    </div>
                )}

                {/* Question / Complaint */}
                <h1 style={{
                    fontSize: 46,
                    color: '#1c1c1e',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    marginBottom: hasImage ? 16 : 24,
                    marginTop: 0,
                }}>{quiz.complain}</h1>

                {/* Clinical Image or Video */}
                {hasImage && (
                    <div style={{ marginTop: 24, marginBottom: 16, width: '100%', flex: '0 0 auto' }}>
                        <div style={{
                            width: '100%',
                            height: 500,
                            borderRadius: 20,
                            overflow: 'hidden',
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
                    </div>
                )}

                {/* Spacer positions options just below center */}
                <div style={{ flex: 0.1 }} />

                {/* Countdown Timer — right above options */}
                {showCountdown && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                    }}>
                        <div style={{ position: 'relative', width: 64, height: 64 }}>
                            <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: 'absolute', top: 0, left: 0 }}>
                                <circle cx="32" cy="32" r="27" fill="none" stroke="#FFEAF2" strokeWidth="5" />
                                <circle
                                    cx="32" cy="32" r="27"
                                    fill="none"
                                    stroke="#E91E63"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 27}`}
                                    strokeDashoffset={`${2 * Math.PI * 27 * (1 - countdownProgress)}`}
                                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <span style={{
                                    fontSize: 26,
                                    fontWeight: 800,
                                    color: '#E91E63',
                                }}>{secondsLeft}</span>
                            </div>
                        </div>
                        <span style={{
                            marginLeft: 12,
                            fontSize: 20,
                            fontWeight: 600,
                            color: '#aaa',
                        }}>Answer in {secondsLeft}s</span>
                    </div>
                )}

                {/* App promotion banner + "Correct Answer!" badge — shown after reveal */}
                {isRevealed && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                        gap: 12,
                        opacity: revealAmount,
                        transform: `scale(${interpolate(revealAmount, [0, 1], [0.8, 1])})`,
                    }}>
                        {/* App Promotion Banner */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: 12,
                            padding: '24px 32px',
                            background: 'linear-gradient(135deg, #FF4D8C 0%, #FF6B9D 100%)',
                            borderRadius: 20,
                            boxShadow: '0 8px 20px rgba(255,77,140,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}>
                            <div style={{
                                fontSize: 42,
                                fontWeight: 800,
                                color: '#ffffff',
                                lineHeight: 1.25,
                                letterSpacing: '0.01em',
                            }}>
                                Play 1000+ Quizzes on the{' '}
                                <span style={{
                                    color: '#FFF176',
                                    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}>
                                    Diagnose It
                                </span>{' '}
                                App
                            </div>
                            <div style={{
                                fontSize: 32,
                                fontWeight: 800,
                                color: '#FFF9C4',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase' as const,
                            }}>
                                ⬇ Download Now
                            </div>
                        </div>

                        {/* Correct Answer Badge */}
                        <div style={{
                            backgroundColor: '#4CAF50',
                            borderRadius: 14,
                            padding: '10px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>
                                Correct Answer
                            </span>
                        </div>
                    </div>
                )}

                {/* Options */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    width: '100%',
                }}>
                    {quiz.options?.map((option: string, optIdx: number) => {
                        const isCorrect = optIdx === quiz.correctOptionIndex;

                        let bgColor = '#ffffff';
                        let borderColor = '#e5e5ea';
                        let textColor = '#1c1c1e';
                        let labelBgColor = '#f2f2f7';
                        let labelTextColor = '#8e8e93';
                        let optOpacity = 1;

                        if (isRevealed) {
                            if (isCorrect) {
                                bgColor = lerpColor('#ffffff', '#E8F5E9', revealAmount);
                                borderColor = lerpColor('#e5e5ea', '#4CAF50', revealAmount);
                                textColor = lerpColor('#1c1c1e', '#2E7D32', revealAmount);
                                labelBgColor = lerpColor('#f2f2f7', '#4CAF50', revealAmount);
                                labelTextColor = lerpColor('#8e8e93', '#ffffff', revealAmount);
                            } else {
                                optOpacity = interpolate(revealAmount, [0, 1], [1, 0.4]);
                            }
                        }

                        return (
                            <div
                                key={optIdx}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: '18px 24px',
                                    borderRadius: 20,
                                    border: `2px solid ${borderColor}`,
                                    backgroundColor: bgColor,
                                    color: textColor,
                                    opacity: optOpacity,
                                    transform: isCorrect && isRevealed
                                        ? `scale(${interpolate(revealAmount, [0, 1], [1, 1.02])})`
                                        : 'scale(1)',
                                }}
                            >
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 16,
                                    backgroundColor: labelBgColor,
                                    flexShrink: 0,
                                }}>
                                    <span style={{
                                        fontSize: 24,
                                        fontWeight: 700,
                                        color: labelTextColor,
                                    }}>{optionLabels[optIdx]}</span>
                                </div>
                                <span style={{
                                    fontSize: 34,
                                    fontWeight: 600,
                                    flex: 1,
                                    lineHeight: 1.3,
                                }}>{option}</span>

                                {isCorrect && isRevealed && (
                                    <div style={{
                                        backgroundColor: '#4CAF50',
                                        borderRadius: '50%',
                                        width: 36,
                                        height: 36,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: revealAmount,
                                        transform: `scale(${revealAmount})`,
                                        flexShrink: 0,
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};

// Simple hex color interpolation helper
function lerpColor(a: string, b: string, t: number): string {
    const parse = (hex: string) => {
        hex = hex.replace('#', '');
        return [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];
    };
    const ca = parse(a), cb = parse(b);
    const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
    const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
    const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
    return `rgb(${r},${g},${bl})`;
}
