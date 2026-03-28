"use server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CATEGORY_VARIANTS: Record<string, { names: string[]; colors: string[] }> = {
  lipstick: {
    names: ["Ruby Red", "Rose Nude", "Coral Bliss", "Berry Kiss", "Mauve Dream", "Classic Red", "Pink Petal", "Dusty Rose"],
    colors: ["#C0392B", "#E8B4B8", "#FF7F50", "#8E44AD", "#D4A5A5", "#E74C3C", "#FFB6C1", "#C9A0A0"],
  },
  foundation: {
    names: ["Ivory 01", "Beige 02", "Sand 03", "Honey 04", "Caramel 05", "Mocha 06", "Espresso 07", "Porcelain 00"],
    colors: ["#FFF8F0", "#F5E6D3", "#E8C9A0", "#D4A574", "#C4854A", "#A0522D", "#6B3A2A", "#FDF3E7"],
  },
  eyeshadow: {
    names: ["Champagne", "Rose Gold", "Smoky Quartz", "Midnight", "Bronze", "Lilac", "Copper", "Pearl"],
    colors: ["#F7E7CE", "#B76E79", "#7B7B7B", "#1A1A2E", "#CD7F32", "#C8A2C8", "#B87333", "#F0EAD6"],
  },
  blush: {
    names: ["Peachy Keen", "Rose Flush", "Berry Bliss", "Golden Hour", "Coral Glow", "Nude Flush"],
    colors: ["#FFCBA4", "#FFB7C5", "#CC5F8F", "#E8B86D", "#FF6B6B", "#E8B4A0"],
  },
  default: {
    names: ["Shade 01", "Shade 02", "Shade 03", "Shade 04", "Shade 05", "Shade 06"],
    colors: ["#E8D5C4", "#C4A882", "#A07850", "#785030", "#503010", "#8B6914"],
  },
};

function detectCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("lip") || t.includes("lipstick") || t.includes("gloss") || t.includes("balm")) return "lipstick";
  if (t.includes("foundation") || t.includes("concealer") || t.includes("bb") || t.includes("cc")) return "foundation";
  if (t.includes("eye") || t.includes("shadow") || t.includes("liner")) return "eyeshadow";
  if (t.includes("blush") || t.includes("bronzer") || t.includes("highlighter")) return "blush";
  return "default";
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { title, imageBase64, mode } = body;

    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured in .env.local" }, { status: 500 });

    const category = detectCategory(title);
    const variantData = CATEGORY_VARIANTS[category];

    // Build messages for Claude
    const messages: any[] = [];
    const userContent: any[] = [];

    if (imageBase64) {
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: imageBase64 },
      });
    }

    const promptMap: Record<string, string> = {
      description: `You are a luxury beauty copywriter for DINA COSMETIC, a high-end beauty brand. 
Write a compelling product description for: "${title}"
${imageBase64 ? "Use the product image to inform your description." : ""}

Return a JSON object with:
{
  "description": "2-3 sentence luxury product description (no markdown, plain text)",
  "shortDescription": "One punchy tagline under 10 words",
  "suggestedPrice": number (realistic USD price for luxury beauty),
  "keyBenefits": ["benefit 1", "benefit 2", "benefit 3"],
  "ingredients": "Key ingredient highlights (2-3 ingredients)",
  "howToUse": "Application instructions in 1-2 sentences"
}

Write in the voice of Charlotte Tilbury or Dior Beauty. Sophisticated, sensual, confident. No generic phrases.
Return ONLY the JSON object, no markdown.`,

      variants: `You are helping create product variants for a luxury beauty brand.
Product: "${title}"
Category detected: ${category}

Return a JSON object with:
{
  "variants": [
    { "name": "Shade Name", "colorCode": "#hexcode", "suggestedPrice": number }
  ]
}

Generate exactly 6 realistic shade/variant names appropriate for this product type.
Use the following as inspiration but create unique names: ${variantData.names.join(", ")}
Make names sound luxurious and evocative (e.g., "Midnight Noir" not "Dark Black").
Return ONLY the JSON object, no markdown.`,
    };

    userContent.push({ type: "text", text: promptMap[mode] || promptMap.description });
    messages.push({ role: "user", content: userContent });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";

    let parsed: any = {};
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { description: text };
    }

    return NextResponse.json({ success: true, result: parsed, category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
