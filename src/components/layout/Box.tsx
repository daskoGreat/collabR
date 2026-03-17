import React from 'react';

type Spacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none' | number;

interface BoxProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
    padding?: Spacing | { top?: Spacing; right?: Spacing; bottom?: Spacing; left?: Spacing; x?: Spacing; y?: Spacing };
    margin?: Spacing | { top?: Spacing; right?: Spacing; bottom?: Spacing; left?: Spacing; x?: Spacing; y?: Spacing };
    className?: string;
    as?: React.ElementType;
}

export const Box: React.FC<BoxProps> = ({
    children,
    padding,
    margin,
    className = '',
    as: Component = 'div',
    style: initialStyle = {},
    ...props
}) => {
    const getSpacingValue = (v: Spacing) => {
        return typeof v === 'number' ? `${v}px` : `var(--space-${v})`;
    };

    const style: React.CSSProperties = { ...initialStyle };

    if (padding) {
        if (typeof padding === 'string' || typeof padding === 'number') {
            style.padding = getSpacingValue(padding);
        } else {
            if (padding.top) style.paddingTop = getSpacingValue(padding.top);
            if (padding.right) style.paddingRight = getSpacingValue(padding.right);
            if (padding.bottom) style.paddingBottom = getSpacingValue(padding.bottom);
            if (padding.left) style.paddingLeft = getSpacingValue(padding.left);
            if (padding.x) {
                style.paddingLeft = getSpacingValue(padding.x);
                style.paddingRight = getSpacingValue(padding.x);
            }
            if (padding.y) {
                style.paddingTop = getSpacingValue(padding.y);
                style.paddingBottom = getSpacingValue(padding.y);
            }
        }
    }

    if (margin) {
        if (typeof margin === 'string' || typeof margin === 'number') {
            style.margin = getSpacingValue(margin);
        } else {
            if (margin.top) style.marginTop = getSpacingValue(margin.top);
            if (margin.right) style.marginRight = getSpacingValue(margin.right);
            if (margin.bottom) style.marginBottom = getSpacingValue(margin.bottom);
            if (margin.left) style.marginLeft = getSpacingValue(margin.left);
            if (margin.x) {
                style.marginLeft = getSpacingValue(margin.x);
                style.marginRight = getSpacingValue(margin.x);
            }
            if (margin.y) {
                style.marginTop = getSpacingValue(margin.y);
                style.marginBottom = getSpacingValue(margin.y);
            }
        }
    }

    return (
        <Component className={className} style={style} {...props}>
            {children}
        </Component>
    );
};
