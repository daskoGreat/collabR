import * as React from "react";

interface InviteEmailProps {
    name: string;
    inviteLink: string;
}

export const InviteEmail: React.FC<Readonly<InviteEmailProps>> = ({
    name,
    inviteLink,
}) => (
    <div style={{
        fontFamily: 'SF Mono, Menlo, monospace',
        backgroundColor: '#0a0a0a',
        color: '#e2e2e2',
        padding: '40px',
        maxWidth: '600px',
        margin: '0 auto',
        borderRadius: '8px',
        border: '1px solid #1a1a1a'
    }}>
        <h1 style={{
            fontSize: '20px',
            fontWeight: '800',
            marginBottom: '24px',
            color: '#e2e2e2',
            letterSpacing: '-0.02em'
        }}>
            The Support Network
        </h1>

        <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#a1a1a1' }}>
            Hello {name},<br /><br />
            Your application for membership has been approved. Welcome to the network—a place where we help each other move forward.
        </p>

        <div style={{ marginBottom: '32px' }}>
            <a
                href={inviteLink}
                style={{
                    display: 'inline-block',
                    backgroundColor: '#e2e2e2',
                    color: '#0a0a0a',
                    padding: '14px 28px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold',
                }}
            >
                Activate Account
            </a>
        </div>

        <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
            This link is personal and can only be used once.<br />
            If you did not apply for membership, please ignore this email.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #1a1a1a', margin: '32px 0' }} />

        <p style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em', fontWeight: 'bold' }}>
            THE SUPPORT NETWORK // PRIVATE_ACCESS // SECURE_INVITE
        </p>
    </div>
);
