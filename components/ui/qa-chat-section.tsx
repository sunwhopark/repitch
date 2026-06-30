"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  ArrowUp,
  MousePointer2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Swappable assets (placeholders for now) ───────────────────────────
// TODO: replace with the testimonial Instagram profile image
const USER_AVATAR_SRC = "";
// TODO: replace with the repitch logo
const AI_AVATAR_SRC = "";
const EXPLORE_IMAGE_SRC = "/탐색탭이미지.png";

// ── Typing speeds ─────────────────────────────────────────────────────
const USER_CHAR_MS = 18;
const AI_CHAR_MS = 11;

export type Msg = {
  role: "user" | "assistant";
  text: string;
  typing?: boolean; // show "···" indicator instead of text
  image?: string;
  footnote?: string;
  actions?: boolean;
  showExtras?: boolean; // reveal image/footnote/actions after text is typed
};

const SCRIPT: Msg[] = [
  {
    role: "user",
    text: "매칭이 되지 않으면요?\n저는 마이크로 인플루언서인데, 메가 브랜드가 좋아요",
  },
  { role: "user", text: "하고 싶은 브랜드가 없어요" },
  { role: "user", text: "협업 가능성이 높은 브랜드와 광고하고 싶어요" },
  {
    role: "assistant",
    text: "\"탐색\" 탭에서, 추가적으로 나에게 맞는 캠페인을 골라서 체험할 수 있습니다.",
    image: EXPLORE_IMAGE_SRC,
    actions: true,
  },
  { role: "user", text: "돈을 내고 써야 하는 거 아니에요?" },
  {
    role: "assistant",
    text: "저희는 크리에이터의 지속가능한 협업을 지향합니다. 매칭될 시에만 5%의 수수료를 받습니다.",
    footnote: "(MCN, 타 오픈 플랫폼의 수수료는 20~30%, 매칭되지 않아도 수수료 지불)",
    actions: true,
  },
];

export function QaChatSection({
  intro,
  script,
  userAvatar,
  aiAvatar,
}: {
  intro?: ReactNode;
  script?: Msg[];
  userAvatar?: string;
  aiAvatar?: string;
} = {}) {
  // Default intro = the original influencer copy, so the influencer call site
  // keeps working unchanged.
  const introContent = intro ?? (
    <p className="mx-auto max-w-2xl text-center text-2xl leading-snug text-foreground/80 md:text-3xl">
      이렇게 작성한 제안서는
      <br />
      <img
        src="/repitch_wordmark.png"
        alt="repitch"
        className="inline-block h-[0.85em] w-auto translate-y-[0.12em] dark:invert"
      />{" "}
      AI의 재가공을 거쳐 정돈된 톤앤매너로
      <br />
      브랜드에게 전송됩니다.
    </p>
  );

  return (
    <section className="w-full px-4 pt-8 pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Intro */}
        {introContent}

        {/* Chat */}
        <div className="mx-auto mt-12 max-w-3xl">
          <ChatDemo script={script} userAvatar={userAvatar} aiAvatar={aiAvatar} />
        </div>
      </div>
    </section>
  );
}

export function ChatDemo({
  script = SCRIPT,
  userAvatar = USER_AVATAR_SRC,
  aiAvatar = AI_AVATAR_SRC,
}: {
  script?: Msg[];
  userAvatar?: string;
  aiAvatar?: string;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const startedRef = useRef(false);

  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pressed, setPressed] = useState(false);
  const [cursor, setCursor] = useState({ x: 24, y: 24, visible: false });

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    // Reduced motion: skip the animation, show the final conversation.
    if (reduced) {
      setMessages(script.map((m) => ({ ...m, typing: false, showExtras: true })));
      return;
    }

    let cancelled = false;
    const sleep = (ms: number) =>
      new Promise<void>((res) => setTimeout(res, ms));

    // Resting position over the chat area (used once, at the very start).
    const cursorOverChat = () => {
      const card = ref.current;
      const row = rowRef.current;
      if (!card || !row) return;
      const cr = card.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      setCursor({ x: rr.width * 0.5, y: (cr.top - rr.top) * 0.5, visible: true });
    };
    // Idle just beside the send button (where the cursor lingers after the
    // first interaction, so later moves stay near the button).
    const cursorNearSend = () => {
      const row = rowRef.current;
      const btn = sendRef.current;
      if (!row || !btn) return;
      const r = row.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      setCursor({
        x: b.left - r.left + b.width / 2 + 8,
        y: b.top - r.top + b.height / 2 + 16,
        visible: true,
      });
    };
    const cursorToSend = () => {
      const row = rowRef.current;
      const btn = sendRef.current;
      if (!row || !btn) return;
      const r = row.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      setCursor({
        x: b.left - r.left + b.width / 2 - 4,
        y: b.top - r.top + b.height / 2 - 2,
        visible: true,
      });
    };

    const run = async () => {
      let firstUser = true;
      cursorOverChat();
      await sleep(400);
      for (const step of script) {
        if (cancelled) return;

        if (step.role === "user") {
          // After the first message the cursor idles near the button.
          if (!firstUser) {
            cursorNearSend();
            await sleep(160);
          }
          // Type the question into the input, char by char.
          for (let i = 1; i <= step.text.length; i++) {
            if (cancelled) return;
            setInput(step.text.slice(0, i));
            await sleep(USER_CHAR_MS);
          }
          await sleep(180);
          // Move the fake cursor to the send button and press it.
          cursorToSend();
          await sleep(firstUser ? 340 : 200);
          setPressed(true);
          await sleep(110);
          setPressed(false);
          // Commit the user bubble.
          setMessages((prev) => [...prev, { role: "user", text: step.text }]);
          setInput("");
          // Keep the cursor resting near the button instead of flying away.
          cursorNearSend();
          firstUser = false;
          await sleep(280);
        } else {
          // Typing indicator first.
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: "", typing: true },
          ]);
          await sleep(500);
          if (cancelled) return;
          // Switch to text and type it out.
          setMessages((prev) =>
            prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, typing: false } : m
            )
          );
          for (let i = 1; i <= step.text.length; i++) {
            if (cancelled) return;
            setMessages((prev) =>
              prev.map((m, idx) =>
                idx === prev.length - 1
                  ? { ...m, text: step.text.slice(0, i) }
                  : m
              )
            );
            await sleep(AI_CHAR_MS);
          }
          // Reveal attachment / footnote / actions.
          if (step.image || step.footnote || step.actions) {
            await sleep(150);
            setMessages((prev) =>
              prev.map((m, idx) =>
                idx === prev.length - 1
                  ? {
                      ...m,
                      image: step.image,
                      footnote: step.footnote,
                      actions: step.actions,
                      showExtras: true,
                    }
                  : m
              )
            );
          }
          await sleep(350);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [inView, reduced, script]);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Avatar src={aiAvatar} alt="repitch AI" />
        <div className="leading-tight">
          <p className="text-base font-medium">repitch AI</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-foreground" />
            online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex min-h-[440px] flex-col gap-4 px-5 py-6">
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} userAvatar={userAvatar} aiAvatar={aiAvatar} />
        ))}
      </div>

      {/* Input row */}
      <div
        ref={rowRef}
        className="relative flex items-center gap-2 border-t border-border p-3"
      >
        <div className="min-h-[40px] flex-1 whitespace-pre-wrap rounded-2xl bg-muted px-4 py-2.5 text-base">
          {input ? (
            <>
              {input}
              <span className="ml-px inline-block h-5 w-px translate-y-0.5 animate-pulse bg-foreground" />
            </>
          ) : (
            <span className="text-muted-foreground">메시지를 입력하세요</span>
          )}
        </div>
        <button
          ref={sendRef}
          type="button"
          aria-label="전송"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform",
            pressed && "scale-90"
          )}
        >
          <ArrowUp className="size-5" />
        </button>

        {/* Fake cursor */}
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-20"
          animate={{ x: cursor.x, y: cursor.y, opacity: cursor.visible ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 130, damping: 18 }}
        >
          <MousePointer2 className="size-5 -rotate-12 fill-foreground text-background drop-shadow" />
        </motion.div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  userAvatar,
  aiAvatar,
}: {
  msg: Msg;
  userAvatar: string;
  aiAvatar: string;
}) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex items-end gap-2", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <Avatar src={isUser ? userAvatar : aiAvatar} alt={isUser ? "user" : "repitch AI"} />
      <div className={cn("flex max-w-[80%] flex-col gap-2 md:max-w-[60%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-base leading-relaxed",
            isUser
              ? "rounded-br-sm bg-foreground text-background"
              : "rounded-bl-sm bg-muted text-foreground"
          )}
        >
          {msg.typing ? (
            <TypingDots />
          ) : (
            <>
              {msg.text}
              {msg.footnote && msg.showExtras && (
                <span className="mt-1.5 block text-sm text-muted-foreground">
                  {msg.footnote}
                </span>
              )}
            </>
          )}
        </div>

        {msg.image && msg.showExtras && (
          <motion.img
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            src={msg.image}
            alt="탐색 탭"
            className="w-[200px] rounded-2xl border border-border"
          />
        )}

        {msg.actions && msg.showExtras && !isUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <MessageActions />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function MessageActions() {
  const icons = [RotateCcw, ThumbsUp, ThumbsDown, Copy, Share2];
  return (
    <div className="flex items-center gap-2 pl-1">
      {icons.map((Icon, i) => (
        <button
          key={i}
          type="button"
          className="text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="size-8 shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
      {src ? <img src={src} alt={alt} className="size-full object-cover" /> : null}
    </div>
  );
}
