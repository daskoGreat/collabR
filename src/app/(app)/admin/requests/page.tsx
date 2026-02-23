import { requireRole } from "@/lib/auth-guard";
import { getPendingRequests } from "@/lib/actions/join-requests";
import RequestsAdmin from "./requests-admin";

export default async function AdminRequestsPage() {
    await requireRole("ADMIN", "MODERATOR");

    const result = await getPendingRequests();

    // In server components, passing Date objects to Client Components 
    // requires them to be serialized. Prisma returns Dates.
    const serializedRequests = result.requests?.map(req => ({
        ...req,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
    })) || [];

    return (
        <div className="content-area pt-8">
            <RequestsAdmin initialRequests={serializedRequests} />
        </div>
    );
}
