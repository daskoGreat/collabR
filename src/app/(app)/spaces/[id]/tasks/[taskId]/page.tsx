import { requireSpaceMember } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import TaskDetail from "./task-detail";

interface Props {
    params: Promise<{ id: string; taskId: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
    const { id, taskId } = await params;
    const user = await requireSpaceMember(id);

    const task = await prisma.task.findUnique({
        where: { id: taskId, spaceId: id },
        include: {
            assignee: { select: { id: true, name: true } },
            creator: { select: { name: true } },
            comments: {
                orderBy: { createdAt: "asc" },
                include: { user: { select: { id: true, name: true } } },
            },
        },
    });

    if (!task) return notFound();

    return (
        <>
            <div className="topbar">
                <div className="topbar-title">
                    <span className="text-muted">tasks /</span>{" "}
                    <span className="topbar-title-highlight">{task.title}</span>
                </div>
            </div>
            <TaskDetail
                spaceId={id}
                task={{
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    tags: task.tags,
                    assignee: task.assignee,
                    creator: task.creator,
                    createdAt: task.createdAt.toISOString(),
                    comments: task.comments.map((c) => ({
                        id: c.id,
                        content: c.content,
                        createdAt: c.createdAt.toISOString(),
                        user: c.user,
                    })),
                }}
                currentUserId={user.id}
            />
        </>
    );
}
