import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
    hoverable?: boolean;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    as: Component = 'div',
    hoverable = true,
    style = {},
}) => {
    const hoverClass = hoverable ? 'card-hover' : '';
    return (
        <Component className={`card ${hoverClass} ${className}`} style={style}>
            {children}
        </Component>
    );
};
