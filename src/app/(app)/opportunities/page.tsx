import { prisma } from "@/lib/db";
import OpportunityBoard from "@/components/opportunity-board";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OpportunitiesPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const opportunities = await prisma.opportunity.findMany({
        include: {
            user: { select: { id: true, name: true } },
            _count: { select: { comments: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    // Serialize dates for client components
    const serializedOpportunities = opportunities.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        deadline: o.deadline ? o.deadline.toISOString() : null,
        type: o.type as any,
        location: o.location as any,
    }));

    return (
        <OpportunityBoard initialOpportunities={serializedOpportunities as any} />
    );
}
