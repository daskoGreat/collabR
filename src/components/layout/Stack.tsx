import React from 'react';

type Spacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none' | number;
type Alignment = 'start' | 'center' | 'end' | 'stretch';
type Justify = 'start' | 'center' | 'end' | 'between';

interface StackProps {
    children: React.ReactNode;
    direction?: 'vertical' | 'horizontal';
    gap?: Spacing;
    align?: Alignment;
    justify?: Justify;
    wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
    className?: string;
    as?: React.ElementType;
    style?: React.CSSProperties;
}

export const Stack: React.FC<StackProps> = ({
    children,
    direction = 'vertical',
    gap,
    align,
    justify,
    wrap,
    className = '',
    as: Component = 'div',
    style: initialStyle = {},
}) => {
    const directionClass = direction === 'vertical' ? 'stack-v' : 'stack-h';
    const alignClass = align ? `align-${align}` : '';
    const justifyClass = justify ? `justify-${justify}` : '';

    const style: React.CSSProperties = { ...initialStyle };
    if (wrap) style.flexWrap = wrap;
    if (gap && gap !== 'none') {
        style.gap = typeof gap === 'number' ? `${gap}px` : `var(--space-${gap})`;
    }

    return (
        <Component
            className={`${directionClass} ${alignClass} ${justifyClass} ${className}`}
            style={style}
        >
            {children}
        </Component>
    );
};
