import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

type WebhookPayload = {
  _type: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_REVALIDATE_SECRET) {
      return new Response(
        "Missing environment variable SANITY_REVALIDATE_SECRET",
        { status: 500 },
      );
    }

    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
      true,
    );

    if (!isValidSignature) {
      return new Response(
        JSON.stringify({ message: "Invalid signature", isValidSignature, body }),
        { status: 401 },
      );
    }

    if (!body?._type) {
      return new Response(JSON.stringify({ message: "Bad Request", body }), {
        status: 400,
      });
    }

    // Webhooks need the new content immediately, not stale-while-revalidate,
    // so expire the tag right away rather than using a "max" staleness profile.
    revalidateTag(body._type, { expire: 0 });

    return NextResponse.json({ revalidated: true, tag: body._type });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(message, { status: 500 });
  }
}
