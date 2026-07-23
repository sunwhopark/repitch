// YouTube Data API v3 채널 검증·지표 수집. 서버 전용(YOUTUBE_API_KEY는 클라이언트 미노출).
// 입력: 핸들(@xxx) / URL / 채널ID(UC…) → 채널명·구독자·총조회수 + 최근 10영상 평균 조회수.
const API = "https://www.googleapis.com/youtube/v3";

type Parsed = { channelId?: string; handle?: string };

function parseInput(raw: string): Parsed | null {
  const s = raw.trim();
  if (!s) return null;
  const ch = s.match(/channel\/(UC[\w-]{22})/); // youtube.com/channel/UC…
  if (ch) return { channelId: ch[1] };
  const at = s.match(/(?:youtube\.com)?\/?@([^/?\s]+)/); // youtube.com/@handle or @handle
  if (at) return { handle: "@" + at[1] };
  const custom = s.match(/youtube\.com\/(?:c|user)\/([^/?\s]+)/); // /c/name or /user/name
  if (custom) return { handle: custom[1] };
  if (/^UC[\w-]{22}$/.test(s)) return { channelId: s };
  return { handle: s.startsWith("@") ? s : "@" + s }; // bare text → 핸들 취급
}

async function yt(path: string, params: Record<string, string>, key: string) {
  const url = new URL(`${API}/${path}`);
  Object.entries({ ...params, key }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  return { ok: res.ok, json };
}

export async function POST(request: Request) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return Response.json({ error: "채널 검증이 설정되지 않았어요. (서버 키 없음)" }, { status: 500 });

  let input = "";
  try { input = (await request.json())?.input ?? ""; } catch { /* noop */ }
  const parsed = parseInput(String(input));
  if (!parsed) return Response.json({ error: "채널 핸들이나 URL을 입력해 주세요." }, { status: 400 });

  // 1) 채널 조회 (핸들이면 forHandle, 실패 시 search 폴백)
  const part = "snippet,statistics,contentDetails";
  let ch: Record<string, unknown> | undefined;
  if (parsed.channelId) {
    const { ok, json } = await yt("channels", { part, id: parsed.channelId }, key);
    if (!ok) return Response.json({ error: "YouTube 조회에 실패했어요." }, { status: 502 });
    ch = json.items?.[0];
  } else {
    const { ok, json } = await yt("channels", { part, forHandle: parsed.handle! }, key);
    if (!ok) return Response.json({ error: "YouTube 조회에 실패했어요." }, { status: 502 });
    ch = json.items?.[0];
    if (!ch) {
      // 폴백: 검색으로 채널 찾기
      const s = await yt("search", { part: "snippet", q: parsed.handle!.replace(/^@/, ""), type: "channel", maxResults: "1" }, key);
      const cid = s.json.items?.[0]?.id?.channelId;
      if (cid) {
        const r = await yt("channels", { part, id: cid }, key);
        ch = r.json.items?.[0];
      }
    }
  }
  if (!ch) return Response.json({ error: "채널을 찾을 수 없어요. 입력을 다시 확인해 주세요." }, { status: 404 });

  const snippet = ch.snippet as { title?: string; thumbnails?: { default?: { url?: string }; medium?: { url?: string } } };
  const stats = ch.statistics as { subscriberCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean } | undefined;
  const content = ch.contentDetails as { relatedPlaylists?: { uploads?: string } } | undefined;

  const subscribersHidden = !!stats?.hiddenSubscriberCount;
  const subscribers = subscribersHidden || stats?.subscriberCount == null ? null : Number(stats.subscriberCount);
  const totalViews = stats?.viewCount == null ? null : Number(stats.viewCount);

  // 2) 최근 10영상 평균 조회수 (uploads 재생목록 → videos.list)
  let avgViews: number | null = null;
  let recentCount = 0;
  const uploads = content?.relatedPlaylists?.uploads;
  if (uploads) {
    const pl = await yt("playlistItems", { part: "contentDetails", playlistId: uploads, maxResults: "10" }, key);
    const ids = (pl.json.items ?? []).map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId).filter(Boolean);
    if (ids.length) {
      const v = await yt("videos", { part: "statistics", id: ids.join(",") }, key);
      const views = (v.json.items ?? [])
        .map((i: { statistics?: { viewCount?: string } }) => (i.statistics?.viewCount == null ? null : Number(i.statistics.viewCount)))
        .filter((n: number | null): n is number => n != null);
      if (views.length) {
        avgViews = Math.round(views.reduce((a: number, b: number) => a + b, 0) / views.length);
        recentCount = views.length;
      }
    }
  }

  return Response.json({
    channelId: ch.id,
    title: snippet?.title ?? "",
    thumbnail: snippet?.thumbnails?.medium?.url ?? snippet?.thumbnails?.default?.url ?? null,
    subscribers,
    subscribersHidden,
    totalViews,
    avgViews,
    recentCount,
  });
}
