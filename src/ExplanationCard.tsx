import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';

export const ExplanationCard: React.FC<{ explain: any }> = ({ explain }) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();

    // Slide up entrance
    const slideUp = spring({
        frame,
        fps,
        config: { damping: 20 },
    });

    const translateY = interpolate(slideUp, [0, 1], [800, 0]);
    const opacity = interpolate(slideUp, [0, 1], [0, 1]);

    if (!explain) return null;

    return (
        <AbsoluteFill style={{
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 60,
            paddingBottom: 40,
            paddingLeft: 60,
            paddingRight: 60,
            fontFamily: 'Inter, system-ui, sans-serif',
            justifyContent: 'center',
            backgroundColor: '#FFF7FA',
        }}>
            {/* Promotional Banner */}
            <div style={{
                textAlign: 'center',
                marginBottom: 28,
                padding: '24px 20px',
                background: 'linear-gradient(135deg, #FF4D8C 0%, #FF6B9D 100%)',
                borderRadius: 20,
                boxShadow: '0 8px 20px rgba(255,77,140,0.25)',
                transform: `translateY(${translateY}px)`,
                opacity,
            }}>
                <div style={{
                    fontSize: 42,
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.3,
                    letterSpacing: '0.01em',
                }}>
                    Play the game on the{' '}
                    <span style={{
                        color: '#FFF176',
                        textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}>
                        Diagnose It
                    </span>{' '}
                    App
                </div>
                <div style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: '#FFF9C4',
                    marginTop: 8,
                    letterSpacing: '0.05em',
                }}>
                    1000+ Cases
                </div>
            </div>

            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: 40,
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                boxShadow: '0 12px 24px rgba(255,77,140,0.12)',
                border: '2px solid #FFEAF2',
                transform: `translateY(${translateY}px)`,
                opacity,
            }}>
                {typeof explain === 'object' && explain !== null ? (
                    <>
                        {/* Correct Answer Section */}
                        <div style={{
                            backgroundColor: '#FFF0F5',
                            padding: 24,
                            borderRadius: 16,
                            marginBottom: 24,
                            border: '1px solid #FFD6E5',
                        }}>
                            {explain.correct_answer && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: 24,
                                }}>
                                    <div style={{
                                        backgroundColor: '#4CAF50',
                                        borderRadius: '50%',
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 16,
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span style={{
                                        color: '#1a1a1a',
                                        fontSize: 36,
                                        fontWeight: 700,
                                        flex: 1,
                                    }}>
                                        {explain.correct_answer.choice}
                                    </span>
                                </div>
                            )}

                            {explain.key_features && (
                                <>
                                    <h2 style={{
                                        color: '#FF4D8C',
                                        fontSize: 28, // Changed from 22 to 28
                                        fontWeight: 900,
                                        marginBottom: 16,
                                        marginTop: 0,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase' as const,
                                    }}>Key Features</h2>
                                    {explain.key_features.points?.map((point: any, pIdx: number) => (
                                        <div key={pIdx} style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            marginBottom: 16,
                                        }}>
                                            <div style={{ marginTop: 6, marginRight: 12, opacity: 0.6 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF4D8C">
                                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: 30, lineHeight: 1.4, color: '#333' }}>
                                                <span style={{ fontWeight: 700 }}>{point.label}: </span>
                                                <span style={{ fontWeight: 500, color: '#555' }}>{point.description}</span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Incorrect Options Section */}
                        {explain.incorrect_options?.length > 0 && (
                            <div style={{
                                backgroundColor: '#FFEBEE',
                                padding: 24,
                                borderRadius: 16,
                                border: '1px solid #FFCDD2',
                            }}>
                                <h2 style={{
                                    color: '#D32F2F',
                                    fontSize: 28,
                                    fontWeight: 900,
                                    marginBottom: 16,
                                    marginTop: 0,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase' as const,
                                }}>Why other options are wrong</h2>
                                {explain.incorrect_options.map((option: any, iOptIdx: number) => (
                                    <div key={iOptIdx} style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        marginBottom: 16,
                                    }}>
                                        <div style={{ marginTop: 6, marginRight: 12 }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                            </svg>
                                        </div>
                                        <div style={{ fontSize: 28, lineHeight: 1.4, color: '#333' }}>
                                            <span style={{ fontWeight: 700, color: '#D32F2F' }}>{option.choice}: </span>
                                            <span style={{ fontWeight: 500, color: '#555' }}>{option.explanation}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        backgroundColor: '#F3F4F6',
                        padding: 24,
                        borderRadius: 16,
                        border: '1px solid #E5E7EB',
                    }}>
                        <h2 style={{
                            color: '#374151',
                            fontSize: 28,
                            fontWeight: 900,
                            marginBottom: 16,
                            marginTop: 0,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase' as const,
                        }}>Explanation</h2>
                        <p style={{
                            fontSize: 30,
                            lineHeight: 1.4,
                            color: '#4B5563',
                            fontWeight: 500,
                            margin: 0,
                        }}>
                            {typeof explain === 'string' ? explain : 'No explanation available.'}
                        </p>
                    </div>
                )}
            </div>
        </AbsoluteFill>
    );
};
