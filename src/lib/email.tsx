import { Resend } from 'resend';
import { InviteEmail } from '@/components/email/invite-email';

export async function sendInviteEmail({
    email,
    name,
    inviteLink,
}: {
    email: string;
    name: string;
    inviteLink: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not defined in environment variables');
        return { success: false, error: 'Email configuration missing' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Collab <onboarding@resend.dev>', // Use onboarding@resend.dev until domain is verified
            to: [email],
            subject: 'inbjudan',
            react: <InviteEmail name={name} inviteLink={inviteLink} />,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Unexpected email delivery error:', error);
        return {
            success: false,
            error: error?.message || (typeof error === 'string' ? error : 'Internal server error')
        };
    }
}
