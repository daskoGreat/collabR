import { Resend } from 'resend';
import { InviteEmail } from '@/components/email/invite-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
    email,
    name,
    inviteLink,
}: {
    email: string;
    name: string;
    inviteLink: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Collab <invitations@collab.skoglund.cc>', // Adjust this to a verified domain if needed
            to: [email],
            subject: 'inbjudan',
            react: <InviteEmail name={ name } inviteLink = { inviteLink } />,
        });

    if (error) {
        console.error('Resend API Error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
} catch (error) {
    console.error('Unexpected email delivery error:', error);
    return { success: false, error: 'Internal server error' };
}
}
