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
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '24px',
            color: '#00ff88',
            textTransform: 'lowercase'
        }}>
      // inbjudan till collab
        </h1>

        <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            hej {name.toLowerCase()},<br /><br />
            din ansökan om medlemskap har godkänts. välkommen till vårt privata workspace.
        </p>

        <div style={{ marginBottom: '32px' }}>
            <a
                href={inviteLink}
                style={{
                    display: 'inline-block',
                    backgroundColor: 'transparent',
                    color: '#00ff88',
                    padding: '12px 24px',
                    border: '1px solid #00ff88',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'lowercase',
                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)'
                }}
            >
                aktivera konto
            </a>
        </div>

        <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
            länken är personlig och kan endast användas en gång.<br />
            om du inte har ansökt om medlemskap kan du bortse från detta mail.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #1a1a1a', margin: '32px 0' }} />

        <p style={{ fontSize: '10px', color: '#444', letterSpacing: '0.05em' }}>
            COLLAB // PRIVATE_WORKSPACE // AUTO_GENERATED_SECURE_INVITE
        </p>
    </div>
);
