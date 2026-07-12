import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

function authOk(request: Request, env: any): boolean {
  const pw = request.headers.get("x-admin-password");
  return !!pw && pw === (env.ADMIN_PASSWORD || "");
}

// Lista alla behandlingsområden.
export async function GET(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  const { results } = await env.DB.prepare(
    "SELECT id, category, name, ml, sort, disabled FROM treatment_areas ORDER BY category, sort, id"
  ).all();
  const areas = (results ?? []).map((r: any) => ({
    id: r.id,
    category: r.category,
    name: r.name,
    ml: r.ml,
    disabled: !!r.disabled,
  }));
  return NextResponse.json({ ok: true, areas });
}

// Skapa nytt eller uppdatera. Body: { id?, category, name, ml?, disabled? }
export async function POST(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  try {
    const { id, category, name, ml, disabled } = await request.json();
    const cat = category === "fillers" || category === "toxin" ? category : null;
    const nm = typeof name === "string" ? name.trim() : "";
    if (!cat || !nm) {
      return NextResponse.json({ ok: false, error: "Kategori och namn krävs." }, { status: 400 });
    }
    const mlVal =
      cat === "fillers"
        ? Math.max(0, Math.round(Number(ml) || 0))
        : null;
    const dis = disabled ? 1 : 0;

    if (id) {
      await env.DB.prepare(
        "UPDATE treatment_areas SET category = ?, name = ?, ml = ?, disabled = ? WHERE id = ?"
      )
        .bind(cat, nm, mlVal, dis, id)
        .run();
      return NextResponse.json({ ok: true, id });
    }

    const maxRow: any = await env.DB.prepare(
      "SELECT COALESCE(MAX(sort), -1) AS m FROM treatment_areas WHERE category = ?"
    )
      .bind(cat)
      .first();
    const sort = (maxRow?.m ?? -1) + 1;
    const ins = await env.DB.prepare(
      "INSERT INTO treatment_areas (category, name, ml, sort, disabled) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(cat, nm, mlVal, sort, dis)
      .run();
    return NextResponse.json({ ok: true, id: ins.meta?.last_row_id });
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig förfrågan." }, { status: 400 });
  }
}

// Ta bort. ?id=123
export async function DELETE(request: Request) {
  const env = getCloudflareContext().env as any;
  if (!authOk(request, env)) {
    return NextResponse.json({ ok: false, error: "Fel lösenord." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id saknas." }, { status: 400 });
  }
  await env.DB.prepare("DELETE FROM treatment_areas WHERE id = ?").bind(Number(id)).run();
  return NextResponse.json({ ok: true });
}
