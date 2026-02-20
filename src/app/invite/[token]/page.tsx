import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import InviteForm from "./invite-form";

interface Props {
    params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
    const { token } = await params;

    const invite = await prisma.invite.findUnique({
        where: { token },
        include: { creator: { select: { name: true } } },
    });

    if (!invite) return notFound();

    const isExpired = invite.expiresAt && invite.expiresAt < new Date();
    const isUsedUp =
        invite.singleUse
            ? invite.uses >= 1
            : invite.maxUses > 0 && invite.uses >= invite.maxUses;
    const isRevoked = invite.revoked;

    const isInvalid = isExpired || isUsedUp || isRevoked;

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-title">collab</div>

                {isInvalid ? (
                    <div style={{ textAlign: "center" }}>
                        <div className="error-text mb-4">
                            {isRevoked && "this invite has been revoked."}
                            {isExpired && "this invite has expired."}
                            {isUsedUp && "this invite has been fully used."}
                        </div>
                        <p className="text-muted text-sm">
                            ask an admin for a fresh invite link.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="auth-subtitle">
                            <span className="text-cyan">{invite.creator.name}</span> invited
                            you.
                            <br />
                            <span className="text-muted">
                                {"// create your account to join the workspace"}
                            </span>
                        </div>

                        <div className="helper-banner">
                            <strong>ground rules:</strong> this is a safe space. ask anything,
                            help generously, skip the judgment. no question is too basic.
                            we&apos;re all here to learn and build.
                        </div>

                        <InviteForm token={token} />
                    </>
                )}
            </div>
        </div>
    );
}
