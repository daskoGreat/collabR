import React from 'react';

type TypographyVariant = 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'caption';

interface TypographyProps {
    variant?: TypographyVariant;
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
    style?: React.CSSProperties;
}

export const Typography: React.FC<TypographyProps> = ({
    variant = 'body',
    children,
    className = '',
    as,
    style,
}) => {
    const getDefaultElement = (v: TypographyVariant): React.ElementType => {
        switch (v) {
            case 'hero': return 'h1';
            case 'h1': return 'h1';
            case 'h2': return 'h2';
            case 'h3': return 'h3';
            case 'caption': return 'span';
            default: return 'p';
        }
    };

    const Component = as || getDefaultElement(variant);
    const variantClass = `text-${variant}`;

    return (
        <Component className={`${variantClass} ${className}`} style={style}>
            {children}
        </Component>
    );
};
