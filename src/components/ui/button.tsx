import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}) => {
    const variantClass = `btn-${variant}`;
    let sizeClass = '';
    if (size === 'lg') sizeClass = 'btn-lg';
    else if (size === 'sm') sizeClass = 'btn-sm';

    return (
        <button
            className={`btn ${variantClass} ${sizeClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
