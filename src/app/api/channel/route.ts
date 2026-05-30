import { NextRequest, NextResponse } from "next/server";

export interface VideoItem {
  id: string;
  title: string;
  viewCount: number;
  publishedAt: string;
  type: "recent" | "popular";
  thumbnailUrl: string;
}

function parseChannelInput(input: string): { type: "id" | "handle" | "url"; value: string } {
  const trimmed = input.trim();
  // Full URL
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    const handleMatch = trimmed.match(/youtube\.com\/@([^/?&\s]+)/);
    if (handleMatch) return { type: "handle", value: handleMatch[1] };
    const channelMatch = trimmed.match(/youtube\.com\/channel\/([^/?&\s]+)/);
    if (channelMatch) return { type: "id", value: channelMatch[1] };
    const customMatch = trimmed.match(/youtube\.com\/c\/([^/?&\s]+)/);
    if (customMatch) return { type: "handle", value: customMatch[1] };
    const userMatch = trimmed.match(/youtube\.com\/user\/([^/?&\s]+)/);
    if (userMatch) return { type: "handle", value: userMatch[1] };
  }
  // @handle
  if (trimmed.startsWith("@")) return { type: "handle", value: trimmed.slice(1) };
  // UC... channel ID
  if (trimmed.startsWith("UC") && trimmed.length > 20) return { type: "id", value: trimmed };
  // Plain handle
  return { type: "handle", value: trimmed };
}

async function resolveChannelId(input: { type: string; value: string }, apiKey: string): Promise<string | null> {
  if (input.type === "id") return input.value;

  // Use forHandle parameter (YouTube Data API v3)
  const handleUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  handleUrl.searchParams.set("part", "id");
  handleUrl.searchParams.set("forHandle", input.value);
  handleUrl.searchParams.set("key", apiKey);

  const res = await fetch(handleUrl.toString());
  const data = await res.json();
  if (data.items?.[0]?.id) return data.items[0].id;

  // Fallback: search
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "channel");
  searchUrl.searchParams.set("q", input.value);
  searchUrl.searchParams.set("maxResults", "1");
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl.toString());
  const searchData = await searchRes.json();
  return searchData.items?.[0]?.snippet?.channelId ?? null;
}

function parseDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") * 3600) + (parseInt(m[2] ?? "0") * 60) + parseInt(m[3] ?? "0");
}

async function fetchVideoDetails(videoIds: string[], apiKey: string): Promise<Map<string, { viewCount: number; title: string; publishedAt: string; thumbnailUrl: string }>> {
  const map = new Map<string, { viewCount: number; title: string; publishedAt: string; thumbnailUrl: string }>();
  if (videoIds.length === 0) return map;

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics,snippet,contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  for (const item of data.items ?? []) {
    // Exclude Shorts (60 seconds or under)
    const duration = parseDurationSeconds(item.contentDetails?.duration ?? "");
    if (duration <= 180) continue;

    const thumbs = item.snippet?.thumbnails;
    const thumbnailUrl = thumbs?.medium?.url ?? thumbs?.default?.url ?? "";
    map.set(item.id, {
      viewCount: parseInt(item.statistics?.viewCount ?? "0", 10),
      title: item.snippet?.title ?? "",
      publishedAt: item.snippet?.publishedAt ?? "",
      thumbnailUrl,
    });
  }
  return map;
}

async function fetchChannelVideos(
  channelId: string,
  apiKey: string,
  order: "date" | "viewCount",
  maxResults: number
): Promise<VideoItem[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < maxResults) {
    const remaining = maxResults - ids.length;
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "id");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("type", "video");
    url.searchParams.set("order", order);
    url.searchParams.set("maxResults", String(Math.min(remaining, 50)));
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    for (const item of data.items ?? []) {
      if (item.id?.videoId) ids.push(item.id.videoId);
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  const details = await fetchVideoDetails(ids, apiKey);
  const type = order === "date" ? "recent" : "popular";

  return ids
    .filter((id) => details.has(id))
    .map((id) => ({
      id,
      type,
      ...(details.get(id)!),
    }));
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-youtube-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key is required" }, { status: 400 });
  }

  const { channelInput } = await request.json();
  if (!channelInput?.trim()) {
    return NextResponse.json({ error: "Channel URL or handle is required" }, { status: 400 });
  }

  const parsed = parseChannelInput(channelInput);
  const channelId = await resolveChannelId(parsed, apiKey);

  if (!channelId) {
    return NextResponse.json({ error: "チャンネルが見つかりませんでした。URLまたはハンドル名を確認してください。" }, { status: 404 });
  }

  // Fetch channel info
  const chUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  chUrl.searchParams.set("part", "snippet,statistics");
  chUrl.searchParams.set("id", channelId);
  chUrl.searchParams.set("key", apiKey);
  const chRes = await fetch(chUrl.toString());
  const chData = await chRes.json();
  const channelInfo = chData.items?.[0];

  const [recentVideos, popularVideos] = await Promise.all([
    fetchChannelVideos(channelId, apiKey, "date", 30),
    fetchChannelVideos(channelId, apiKey, "viewCount", 30),
  ]);

  // Deduplicate: popular takes priority; recent-only videos are appended
  const seenIds = new Set<string>();
  const allVideos: VideoItem[] = [];

  for (const v of popularVideos) {
    seenIds.add(v.id);
    allVideos.push(v);
  }
  for (const v of recentVideos) {
    if (!seenIds.has(v.id)) {
      seenIds.add(v.id);
      allVideos.push(v);
    }
  }

  return NextResponse.json({
    channelId,
    channelName: channelInfo?.snippet?.title ?? "",
    channelThumbnail: channelInfo?.snippet?.thumbnails?.default?.url ?? "",
    subscriberCount: parseInt(channelInfo?.statistics?.subscriberCount ?? "0", 10),
    videos: allVideos,
    recentCount: recentVideos.length,
    popularCount: popularVideos.length,
  });
}
