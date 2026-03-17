import React from 'react';

type Spacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';

interface GridProps {
    children: React.ReactNode;
    className?: string;
    gap?: Spacing;
    columns?: number;
    style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({ children, className = '', gap = 'md', columns = 12, style: initialStyle = {} }) => {
    const gapClass = gap && gap !== 'none' ? `gap-${gap}` : '';
    const style: React.CSSProperties = {
        ...initialStyle,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    };

    if (gap && gap !== 'none') {
        style.gap = `var(--space-${gap})`;
    }

    return (
        <div className={`grid-layout ${gapClass} ${className}`} style={style}>
            {children}
        </div>
    );
};

interface GridItemProps {
    children: React.ReactNode;
    span?: number | { base: number; md?: number; lg?: number };
    className?: string;
    style?: React.CSSProperties;
}

export const GridItem: React.FC<GridItemProps> = ({ children, span = 12, className = '', style: initialStyle = {} }) => {
    const getSpanStyles = (s: number | { base: number; md?: number; lg?: number }) => {
        if (typeof s === 'number') return { gridColumn: `span ${s} / span ${s}` };
        return { gridColumn: `span ${s.base} / span ${s.base}` };
    };

    const style = { ...initialStyle, ...getSpanStyles(span) };

    return (
        <div className={className} style={style}>
            {children}
        </div>
    );
};
