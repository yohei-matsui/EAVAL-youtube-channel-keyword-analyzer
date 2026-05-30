import { NextRequest, NextResponse } from "next/server";
import { Comment } from "@/types";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-youtube-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key is required" }, { status: 400 });
  }

  const { videoUrl, maxComments = 200 } = await request.json();
  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  // Fetch video details
  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
  );
  const videoData = await videoRes.json();

  if (videoData.error) {
    return NextResponse.json({ error: videoData.error.message }, { status: 400 });
  }

  const videoItem = videoData.items?.[0];
  if (!videoItem) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const videoTitle: string = videoItem.snippet.title;
  const videoThumbnail: string = videoItem.snippet.thumbnails?.medium?.url ?? "";

  // Fetch comments (paginated, up to maxComments)
  const comments: Comment[] = [];
  let pageToken: string | undefined;

  while (comments.length < maxComments) {
    const remaining = maxComments - comments.length;
    const pageSize = Math.min(remaining, 100);

    const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("videoId", videoId);
    url.searchParams.set("maxResults", String(pageSize));
    url.searchParams.set("order", "relevance");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    for (const item of data.items ?? []) {
      const snippet = item.snippet.topLevelComment.snippet;
      comments.push({
        id: item.id,
        author: snippet.authorDisplayName,
        text: snippet.textDisplay,
        likeCount: snippet.likeCount,
        publishedAt: snippet.publishedAt,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return NextResponse.json({
    videoTitle,
    videoThumbnail,
    totalComments: comments.length,
    comments,
  });
}
