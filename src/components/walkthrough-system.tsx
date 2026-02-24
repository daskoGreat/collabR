"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { LoadingSpinner } from './ui/loading-spinner';

interface WalkthroughStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface WalkthroughContextType {
    startWalkthrough: (steps: WalkthroughStep[]) => void;
    stopWalkthrough: () => void;
    isActive: boolean;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export function useWalkthrough() {
    const context = useContext(WalkthroughContext);
    if (!context) {
        throw new Error('useWalkthrough must be used within a WalkthroughProvider');
    }
    return context;
}

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
    const [steps, setSteps] = useState<WalkthroughStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const isActive = currentStepIndex >= 0;

    const startWalkthrough = (newSteps: WalkthroughStep[]) => {
        setSteps(newSteps);
        setCurrentStepIndex(0);
    };

    const stopWalkthrough = () => {
        setSteps([]);
        setCurrentStepIndex(-1);
        setHighlightRect(null);
    };

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setIsTransitioning(true);
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            stopWalkthrough();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setIsTransitioning(true);
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    // Update highlight rectangle when step changes
    useEffect(() => {
        if (currentStepIndex >= 0 && steps[currentStepIndex]) {
            const targetId = steps[currentStepIndex].targetId;
            const element = document.getElementById(targetId);

            if (element) {
                // Scroll element into view if needed
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Delay slightly to account for scroll behavior if needed, 
                // but we want snappy response.
                const updateRect = () => {
                    const rect = element.getBoundingClientRect();
                    setHighlightRect(rect);
                    setIsTransitioning(false);
                };

                // Immediate update
                updateRect();

                // Re-check after a short delay for layout shifts
                const timer = setTimeout(updateRect, 300);

                window.addEventListener('resize', updateRect);
                return () => {
                    clearTimeout(timer);
                    window.removeEventListener('resize', updateRect);
                };
            } else {
                console.warn(`Walkthrough target not found: ${targetId}`);
                setIsTransitioning(false);
            }
        }
    }, [currentStepIndex, steps]);

    const overlay = isActive && highlightRect && (
        <div className="walkthrough-overlay fixed inset-0 z-[99999] pointer-events-none">
            {/* The Dimmer Backdrop - using 4 panels to allow clear highlight */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" style={{
                clipPath: `polygon(
                    0% 0%, 0% 100%, 
                    ${highlightRect.left}px 100%, 
                    ${highlightRect.left}px ${highlightRect.top}px, 
                    ${highlightRect.right}px ${highlightRect.top}px, 
                    ${highlightRect.right}px ${highlightRect.bottom}px, 
                    ${highlightRect.left}px ${highlightRect.bottom}px, 
                    ${highlightRect.left}px 100%, 
                    100% 100%, 100% 0%
                )`,
                transition: 'clip-path var(--motion-md) var(--ease-out)'
            }} />

            {/* The Highlight Border/Glow */}
            <div
                className="absolute border-2 border-primary shadow-[0_0_20px_var(--neon-green-glow-strong)] rounded-sm"
                style={{
                    top: highlightRect.top - 4,
                    left: highlightRect.left - 4,
                    width: highlightRect.width + 8,
                    height: highlightRect.height + 8,
                    transition: 'all var(--motion-md) var(--ease-out)',
                    opacity: isTransitioning ? 0.5 : 1
                }}
            />

            {/* The Tooltip/Popover */}
            <div
                className="absolute pointer-events-auto"
                style={{
                    top: highlightRect.bottom + 16,
                    left: Math.max(16, Math.min(window.innerWidth - 336, highlightRect.left + highlightRect.width / 2 - 160)),
                    width: '320px',
                    transition: 'all var(--motion-md) var(--ease-out)',
                    opacity: isTransitioning ? 0 : 1,
                    transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)'
                }}
            >
                <div className="card shadow-2xl border-primary bg-bg-secondary p-5">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="text-primary font-bold lowercase tracking-tight">
                            // {steps[currentStepIndex].title}
                        </h4>
                        <button onClick={stopWalkthrough} className="text-muted hover:text-bright transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    <p className="text-sm text-secondary mb-6 leading-relaxed">
                        {steps[currentStepIndex].content}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <div className="text-[10px] text-muted font-bold tracking-widest uppercase">
                            steg {currentStepIndex + 1} av {steps.length}
                        </div>
                        <div className="flex gap-2">
                            {currentStepIndex > 0 && (
                                <button onClick={prevStep} className="btn btn-ghost btn-sm">
                                    <ChevronLeft size={14} />
                                </button>
                            )}
                            <button onClick={nextStep} className="btn btn-primary btn-sm px-4">
                                {currentStepIndex === steps.length - 1 ? 'klar' : 'nästa'}
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <WalkthroughContext.Provider value={{ startWalkthrough, stopWalkthrough, isActive }}>
            {children}
            {mounted && overlay && createPortal(overlay, document.body)}
        </WalkthroughContext.Provider>
    );
}
