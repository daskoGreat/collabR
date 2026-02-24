import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import OpportunityDetail from "./opportunity-detail";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true } },
            attachments: true,
            comments: {
                include: {
                    user: { select: { id: true, name: true } },
                    attachments: true
                },
                orderBy: { createdAt: "asc" }
            }
        }
    });

    if (!opportunity) {
        notFound();
    }

    // Serialize data
    const serializedOpportunity = {
        ...opportunity,
        createdAt: opportunity.createdAt.toISOString(),
        updatedAt: opportunity.updatedAt.toISOString(),
        deadline: opportunity.deadline ? opportunity.deadline.toISOString() : null,
        comments: opportunity.comments.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString()
        })),
        type: opportunity.type as any,
        location: opportunity.location as any,
    };

    return (
        <OpportunityDetail
            opportunity={serializedOpportunity as any}
            currentUserId={session.user.id}
            currentUserName={session.user.name ?? undefined}
        />
    );
}
