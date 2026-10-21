/**
 * Parses 400 responses from POST /posts into a per-channel error structure
 * so the UI can route the user to the specific provider whose settings are
 * invalid, mirroring how the web composer surfaces validation errors inline.
 *
 * Error shapes we handle:
 *   1. NestJS ValidationPipe default:
 *        { statusCode: 400, message: string[], error: "Bad Request" }
 *      with dot-paths like "posts.0.settings.privacy_level must be one of..."
 *   2. BadRequestException from mapTypeToPost / createPost:
 *        { statusCode: 400, message: "Integration with id X not found", error: ... }
 *   3. Raw text body (Stripe-style or plain throws).
 */

export type ChannelError = {
  /** Index into the `posts` array we POSTed. Null = error not scoped to a channel. */
  channelIndex: number | null;
  /** Raw validator messages for this channel. */
  messages: string[];
  /** Detected section: which part of the post failed (so we know where to send the user). */
  section: "settings" | "value" | "integration" | "root";
};

export type ParsedPostError = {
  channelErrors: ChannelError[];
  /** Fallback text when we couldn't attribute the error to any channel. */
  generalMessage: string | null;
};

const POST_PATH_RE = /^posts\.(\d+)\.(\w+)/;

const classifySection = (tail: string): ChannelError["section"] => {
  if (tail === "settings" || tail.startsWith("settings")) return "settings";
  if (tail === "integration" || tail.startsWith("integration")) return "integration";
  if (tail === "value" || tail.startsWith("value")) return "value";
  return "root";
};

export const parsePostError = (
  status: number,
  bodyText: string,
): ParsedPostError => {
  const fallback: ParsedPostError = {
    channelErrors: [],
    generalMessage: bodyText || `Request failed (${status})`,
  };

  if (!bodyText) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return { channelErrors: [], generalMessage: bodyText };
  }

  if (!parsed || typeof parsed !== "object") return fallback;
  const body = parsed as { message?: unknown };

  // Case 2/3: single-string message — can't attribute.
  if (typeof body.message === "string") {
    return { channelErrors: [], generalMessage: body.message };
  }

  if (!Array.isArray(body.message)) return fallback;

  const grouped = new Map<number, ChannelError>();
  const generic: string[] = [];

  for (const raw of body.message) {
    if (typeof raw !== "string") continue;
    const match = raw.match(POST_PATH_RE);
    if (!match) {
      generic.push(raw);
      continue;
    }
    const channelIndex = Number(match[1]);
    const tail = raw.slice(match[0].length).replace(/^\.?/, "");
    const section = classifySection(tail);
    const existing = grouped.get(channelIndex);
    if (existing) {
      existing.messages.push(raw);
      // Promote to more specific section if we had `root` before.
      if (existing.section === "root" && section !== "root") {
        existing.section = section;
      }
    } else {
      grouped.set(channelIndex, {
        channelIndex,
        messages: [raw],
        section,
      });
    }
  }

  return {
    channelErrors: Array.from(grouped.values()).sort(
      (a, b) => (a.channelIndex ?? 0) - (b.channelIndex ?? 0),
    ),
    generalMessage: generic.length > 0 ? generic.join("\n") : null,
  };
};
