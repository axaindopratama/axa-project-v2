import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProjectEditForm from "./ProjectEditForm";

async function getProject(id: string) {
  const db = getDb();
  const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return project[0] || null;
}

export default async function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  
  if (!project) {
    notFound();
  }
  
  return <ProjectEditForm project={project} />;
}