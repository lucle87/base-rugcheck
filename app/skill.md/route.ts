// Phuc vu SKILL.md cho agent tai /skill.md
import { SKILL_MD } from "@/lib/skill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(SKILL_MD, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
