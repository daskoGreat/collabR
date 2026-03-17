"use client";

import { useState } from "react";
import { Box } from "@/components/layout/Box";
import { Stack } from "@/components/layout/Stack";
import { Typography } from "@/components/ui/typography";
import { AvatarPreview } from "./AvatarPreview";

interface AvatarConfig {
    head: string;
    eyes: string;
    brows: string;
    mouth: string;
    hair: string;
    mood: string;
    background: string;
    backgroundColor: string;
    accentColor: string;
}

interface AvatarBuilderProps {
    initialConfig?: Partial<AvatarConfig>;
    onSave: (config: AvatarConfig) => void;
}

const CATEGORIES = [
    { id: "hair", label: "Hair", options: ["none", "short", "long", "curly"] },
    { id: "mood", label: "Expression", options: ["neutral", "happy", "surprised", "blink"] },
    { id: "brows", label: "Brows", options: ["default", "surprised", "angry"] },
    { id: "background", label: "Backdrop", options: ["circle", "none"] },
];

const COLORS = ["#ffffff", "#FFEB3B", "#4CAF50", "#2196F3", "#9C27B0", "#E91E63", "#FF5722"];
const ACCENTS = ["#000000", "#1a1a1a", "#ffffff", "#333333"];

export function AvatarBuilder({ initialConfig, onSave }: AvatarBuilderProps) {
    const [activeCategory, setActiveCategory] = useState("hair");
    const [config, setConfig] = useState<AvatarConfig>({
        head: "default",
        eyes: "default",
        brows: "default",
        mouth: "default",
        hair: "short",
        mood: "neutral",
        background: "circle",
        backgroundColor: "#ffffff",
        accentColor: "#000000",
        ...initialConfig
    });

    const updateConfig = (key: keyof AvatarConfig, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const currentOptions = CATEGORIES.find(c => c.id === activeCategory)?.options || [];

    return (
        <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '4rem', width: '100%', minHeight: '600px' }}>

            {/* Left Column: Preview */}
            <Stack direction="vertical" gap={48} align="center">
                <Box style={{
                    width: '320px',
                    height: '320px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '40px',
                    padding: '2rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <AvatarPreview {...config} />
                </Box>

                <Stack direction="vertical" gap={24} style={{ width: '100%' }}>
                    <Typography style={{ fontSize: '1.25rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                        Colors
                    </Typography>
                    <Stack direction="horizontal" gap={12} wrap="wrap">
                        {COLORS.map(color => (
                            <Box
                                key={color}
                                onClick={() => updateConfig('backgroundColor', color)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: color,
                                    cursor: 'pointer',
                                    border: config.backgroundColor === color ? '3px solid #ffffff' : 'none'
                                }}
                            />
                        ))}
                    </Stack>
                    <Stack direction="horizontal" gap={12} wrap="wrap" style={{ marginTop: '1rem' }}>
                        {ACCENTS.map(color => (
                            <Box
                                key={color}
                                onClick={() => updateConfig('accentColor', color)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: color,
                                    cursor: 'pointer',
                                    border: config.accentColor === color ? '3px solid #666666' : '1px solid rgba(255,255,255,0.2)'
                                }}
                            />
                        ))}
                    </Stack>
                </Stack>

                <button
                    onClick={() => onSave(config)}
                    style={{
                        width: '100%',
                        background: '#ffffff',
                        color: '#000000',
                        padding: '1.5rem',
                        borderRadius: '9999px',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginTop: '2rem',
                        transition: 'all 0.2s'
                    }}
                    className="hover:scale-105 active:scale-95"
                >
                    Save Avatar
                </button>
            </Stack>

            {/* Right Column: Options */}
            <Stack direction="vertical" gap={48}>
                {/* Category Selector */}
                <Box style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                        <Box
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '9999px',
                                background: activeCategory === cat.id ? '#ffffff' : 'rgba(255,255,255,0.05)',
                                color: activeCategory === cat.id ? '#000000' : '#ffffff',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat.label}
                        </Box>
                    ))}
                </Box>

                {/* Option Grid */}
                <Box style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '1.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '2rem',
                    borderRadius: '32px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {currentOptions.map(opt => (
                        <Box
                            key={opt}
                            onClick={() => updateConfig(activeCategory as any, opt)}
                            style={{
                                padding: '1.5rem',
                                borderRadius: '24px',
                                background: config[activeCategory as keyof AvatarConfig] === opt ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: `1px solid ${config[activeCategory as keyof AvatarConfig] === opt ? '#ffffff' : 'rgba(255,255,255,0.1)'}`,
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                            className="hover:bg-white/5"
                        >
                            <Typography style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                {opt}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Typography style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
                    Choose how you want to present yourself. You can always change this later in your profile settings.
                </Typography>
            </Stack>
        </Box>
    );
}
