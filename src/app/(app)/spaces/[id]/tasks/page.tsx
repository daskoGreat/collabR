import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import TasksList from "./tasks-list";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function TasksPage({ params }: Props) {
    const { id } = await params;
    const user = await requireSpaceMember(id);

    const space = await prisma.space.findUnique({
        where: { id },
        select: { name: true },
    });

    const tasks = await prisma.task.findMany({
        where: { spaceId: id },
        orderBy: { createdAt: "desc" },
        include: {
            assignee: { select: { id: true, name: true } },
            creator: { select: { name: true } },
            _count: { select: { comments: true } },
        },
    });

    const members = await prisma.spaceMember.findMany({
        where: { spaceId: id },
        include: { user: { select: { id: true, name: true } } },
    });

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="text-muted">{space?.name.toLowerCase()} /</span>{" "}
                    <span className="topbar-title-highlight">⊡</span> tasks
                </div>
            </div>
            <TasksList
                spaceId={id}
                tasks={tasks.map((t: typeof tasks[number]) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    tags: t.tags,
                    assignee: t.assignee,
                    creator: t.creator,
                    commentCount: t._count.comments,
                    createdAt: t.createdAt.toISOString(),
                }))}
                members={members.map((m: typeof members[number]) => m.user)}
                currentUserId={user.id}
            />
        </>
    );
}
