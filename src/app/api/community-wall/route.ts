import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const KINDS = new Set(["bericht", "idee", "tip"]);

type WallRow = {
  id: string;
  kind: string;
  author_name: string;
  company: string | null;
  body: string;
  created_at: string;
};

function toPost(row: WallRow) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.author_name,
    company: row.company ?? undefined,
    text: row.body,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_wall_posts")
    .select("id, kind, author_name, company, body, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    posts: (data ?? []).map((row) => toPost(row as WallRow)),
  });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const body = payload as {
    kind?: string;
    name?: string;
    company?: string;
    text?: string;
  };

  const kind = body.kind?.trim();
  const text = body.text?.trim();
  const name = body.name?.trim() || "Anoniem";
  const company = body.company?.trim() || null;

  if (!kind || !KINDS.has(kind)) {
    return NextResponse.json({ error: "Kies een geldig type." }, { status: 400 });
  }
  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "Bericht is verplicht (max. 2000 tekens)." },
      { status: 400 },
    );
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "Naam is te lang." }, { status: 400 });
  }
  if (company && company.length > 120) {
    return NextResponse.json({ error: "Bedrijfsnaam is te lang." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_wall_posts")
    .insert({
      kind,
      author_name: name,
      company,
      body: text,
      status: "published",
    })
    .select("id, kind, author_name, company, body, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Plaatsen mislukt." },
      { status: 500 },
    );
  }

  return NextResponse.json({ post: toPost(data as WallRow) }, { status: 201 });
}
