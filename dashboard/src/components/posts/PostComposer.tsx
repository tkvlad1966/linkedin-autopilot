import { useState, useRef, useCallback } from "react";
import { Smile, Image, Sparkles, Clock, Send } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { EmojiPicker } from "./EmojiPicker";
import { useCreatePost } from "../../hooks/usePosts";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/useToast";
import styles from "./PostComposer.module.scss";

const MAX_CHARS = 3000;

export function PostComposer() {
  const [content, setContent] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [showEmoji, setShowEmoji] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<
    { text: string; image: string | null }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createPost = useCreatePost();
  const profile = useAuthStore((s) => s.profile);
  const { toast } = useToast();

  const charCount = content.length;

  function getCharColor() {
    if (charCount >= 2900) return "danger";
    if (charCount >= 2500) return "warning";
    return "normal";
  }

  // SVG circle progress
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(charCount / MAX_CHARS, 1);
  const dashOffset = circumference * (1 - progress);

  const strokeColor =
    charCount >= 2900 ? "#dc2626" : charCount >= 2500 ? "#d97706" : "#94a3b8";

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(180, el.scrollHeight)}px`;
  }

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const el = textareaRef.current;
      if (!el) {
        setContent((prev) => prev + emoji);
        return;
      }
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + emoji.length;
        el.focus();
      });
    },
    [content],
  );

  async function handleAiSuggest() {
    if (aiLoading) return;
    setAiLoading(true);
    setAiSuggestions([]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-post-suggestions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            topic: content || "general LinkedIn thought leadership",
            tone: "professional yet conversational",
            audience: "B2B professionals",
          }),
        },
      );
      console.log("res", res);

      if (!res.ok) throw new Error("Failed to get suggestions");
      const data = await res.json();
      setAiSuggestions(data.suggestions ?? []);
    } catch {
      toast.error("AI suggestions unavailable");
    } finally {
      setAiLoading(false);
    }
  }

  function handleUseSuggestion(suggestion: {
    text: string;
    image: string | null;
  }) {
    setContent(suggestion.text);
    setAiSuggestions([]);
    requestAnimationFrame(() => {
      autoResize();
    });
  }

  function handleSubmit() {
    if (!content.trim() || charCount > MAX_CHARS) return;

    let scheduled_at: string | null = null;
    if (isScheduled && scheduledDate && scheduledTime) {
      scheduled_at = new Date(
        `${scheduledDate}T${scheduledTime}`,
      ).toISOString();
    }

    createPost.mutate(
      {
        content: content.trim(),
        status: isScheduled ? "scheduled" : "draft",
        scheduled_at,
      },
      {
        onSuccess: () => {
          setContent("");
          setIsScheduled(false);
          setScheduledDate("");
          setScheduledTime("09:00");
          if (textareaRef.current) {
            textareaRef.current.style.height = "180px";
          }
        },
      },
    );
  }

  const timezone =
    profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className={styles.composer}>
      {/* Textarea area */}
      <div className={styles.textareaWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="What do you want to talk about?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            autoResize();
          }}
        />
        <div className={styles.charCounter}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke="#e8edf5"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
              style={{ transition: "stroke-dashoffset 0.2s, stroke 0.2s" }}
            />
          </svg>
          <span className={`${styles.charNumber} ${styles[getCharColor()]}`}>
            {charCount}
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.emojiWrapper}>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => setShowEmoji(!showEmoji)}
            >
              <Smile size={18} />
            </button>
            {showEmoji && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
          <button type="button" className={styles.toolBtn} disabled>
            <Image size={18} />
            <Badge variant="info" size="sm">
              Soon
            </Badge>
          </button>
        </div>
        <button
          type="button"
          className={styles.aiBtn}
          onClick={handleAiSuggest}
          disabled={aiLoading}
        >
          <Sparkles size={16} />
          {aiLoading ? "Generating..." : "AI Suggest"}
        </button>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className={styles.suggestions}>
          <span className={styles.suggestionsLabel}>AI Suggestions</span>
          {aiSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className={styles.suggestionCard}
              onClick={() => handleUseSuggestion(s)}
            >
              {s.image && (
                <img src={s.image} alt="" className={styles.suggestionImage} />
              )}
              <div className={styles.suggestionBody}>
                <p className={styles.suggestionText}>
                  {s.text.length > 200 ? s.text.slice(0, 200) + "..." : s.text}
                </p>
                <span className={styles.useBtn}>Use this</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Schedule section */}
      <div className={styles.scheduleSection}>
        <div className={styles.scheduleToggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${!isScheduled ? styles.active : ""}`}
            onClick={() => setIsScheduled(false)}
          >
            <Send size={14} />
            Post now
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${isScheduled ? styles.active : ""}`}
            onClick={() => setIsScheduled(true)}
          >
            <Clock size={14} />
            Schedule
          </button>
        </div>

        {isScheduled && (
          <div className={styles.scheduleInputs}>
            <input
              type="date"
              className={styles.dateInput}
              value={scheduledDate}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <input
              type="time"
              className={styles.timeInput}
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
            {scheduledDate && scheduledTime && (
              <span className={styles.timezoneHint}>
                Will post at {scheduledTime} your time ({timezone})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        fullWidth
        size="lg"
        onClick={handleSubmit}
        disabled={
          !content.trim() || charCount > MAX_CHARS || createPost.isPending
        }
      >
        {createPost.isPending
          ? "Posting..."
          : isScheduled
            ? "Schedule Post"
            : "Post Now"}
      </Button>
    </div>
  );
}
