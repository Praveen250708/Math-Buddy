import { useEffect, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ShoppingBag,
  Palette,
  Zap,
  Crown,
  Trophy,
  Lock,
  Check,
  Sparkles,
  Snowflake,
  BatteryCharging,
  Lightbulb,
  Gem,
  PenTool,
  ChevronRight,
  Bot,
  Shield,
  Timer,
  Magnet,
  Clover,
  Brain,
  Flame,
  Star,
  Rainbow,
  BookOpen,
  Users,
  BarChart3,
  FileText,
  Ban,
  Eye,
  Rocket,
  Heart,
  Music,
  Gamepad2,
  Candy,
  FlowerIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getMyProfile } from "@/lib/gamification.functions";
import { spendPoints, purchaseStreakFreeze } from "@/lib/store.functions";

export const Route = createFileRoute("/_authenticated/store")({
  component: Store,
});

/* ─── Types & Constants ───────────────────────────── */

const STORE_PURCHASES_KEY = "mathbuddy_store_purchases";
const ACTIVE_THEME_KEY = "mathbuddy_active_theme";
const DOUBLE_XP_KEY = "mathbuddy_double_xp_until";
const HINT_TOKENS_KEY = "mathbuddy_hint_tokens";
const SCORE_SHIELD_KEY = "mathbuddy_score_shields";
const TIME_WARP_KEY = "mathbuddy_time_warps";
const XP_MAGNET_KEY = "mathbuddy_xp_magnet_until";
const LUCKY_CHARM_KEY = "mathbuddy_lucky_charms";
const FOCUS_BOOSTER_KEY = "mathbuddy_focus_booster_until";

type StoreCategory = "themes" | "powerups" | "features" | "flair";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: StoreCategory;
  icon: string;
  themeClass?: string;
  previewColors?: { primary: string; accent: string; bg: string };
  consumable?: boolean;
}

const STORE_ITEMS: StoreItem[] = [
  // ─── Themes ───
  {
    id: "theme-midnight-galaxy",
    name: "Midnight Galaxy",
    description: "Deep purple & blue cosmic gradient — feel like studying among the stars.",
    cost: 50,
    category: "themes",
    icon: "🌌",
    themeClass: "theme-midnight-galaxy",
    previewColors: { primary: "#7c3aed", accent: "#e879f9", bg: "#1e1b4b" },
  },
  {
    id: "theme-sunset-glow",
    name: "Sunset Glow",
    description: "Warm orange-pink tones inspired by golden-hour skies.",
    cost: 75,
    category: "themes",
    icon: "🌅",
    themeClass: "theme-sunset-glow",
    previewColors: { primary: "#ea580c", accent: "#f472b6", bg: "#431407" },
  },
  {
    id: "theme-ocean-breeze",
    name: "Ocean Breeze",
    description: "Aqua & teal tones for a calm, focused study vibe.",
    cost: 60,
    category: "themes",
    icon: "🌊",
    themeClass: "theme-ocean-breeze",
    previewColors: { primary: "#0891b2", accent: "#2dd4bf", bg: "#083344" },
  },
  {
    id: "theme-neon-cyber",
    name: "Neon Cyber",
    description: "Electrifying neon green & pink cyberpunk aesthetics.",
    cost: 100,
    category: "themes",
    icon: "⚡",
    themeClass: "theme-neon-cyber",
    previewColors: { primary: "#22c55e", accent: "#f43f5e", bg: "#052e16" },
  },
  {
    id: "theme-forest-calm",
    name: "Forest Calm",
    description: "Nature-inspired earthy greens for a serene experience.",
    cost: 50,
    category: "themes",
    icon: "🌿",
    themeClass: "theme-forest-calm",
    previewColors: { primary: "#16a34a", accent: "#a3a322", bg: "#052e16" },
  },
  {
    id: "theme-aurora-borealis",
    name: "Aurora Borealis",
    description: "Shimmering northern lights with shifting green, blue & violet hues.",
    cost: 120,
    category: "themes",
    icon: "✨",
    themeClass: "theme-aurora-borealis",
    previewColors: { primary: "#06b6d4", accent: "#a855f7", bg: "#0c1222" },
  },
  {
    id: "theme-sakura-bloom",
    name: "Sakura Bloom",
    description: "Delicate cherry-blossom pinks with soft Japanese-inspired aesthetics.",
    cost: 90,
    category: "themes",
    icon: "🌸",
    themeClass: "theme-sakura-bloom",
    previewColors: { primary: "#ec4899", accent: "#f9a8d4", bg: "#1a0a14" },
  },
  {
    id: "theme-volcano",
    name: "Volcano",
    description: "Fiery reds & deep blacks — study with intensity and passion.",
    cost: 85,
    category: "themes",
    icon: "🌋",
    themeClass: "theme-volcano",
    previewColors: { primary: "#dc2626", accent: "#f97316", bg: "#1c0a0a" },
  },
  {
    id: "theme-candy-pop",
    name: "Candy Pop",
    description: "Bright, playful pastels for a fun and energetic study session.",
    cost: 65,
    category: "themes",
    icon: "🍬",
    themeClass: "theme-candy-pop",
    previewColors: { primary: "#e879f9", accent: "#38bdf8", bg: "#1e103a" },
  },
  {
    id: "theme-stealth-dark",
    name: "Stealth Dark",
    description: "Ultra-minimal matte black with subtle gray accents — pure focus mode.",
    cost: 70,
    category: "themes",
    icon: "🖤",
    themeClass: "theme-stealth-dark",
    previewColors: { primary: "#a1a1aa", accent: "#52525b", bg: "#09090b" },
  },
  {
    id: "theme-retro-arcade",
    name: "Retro Arcade",
    description: "Pixel-perfect neon with 80s retro vibes — game on, math champion!",
    cost: 110,
    category: "themes",
    icon: "🕹️",
    themeClass: "theme-retro-arcade",
    previewColors: { primary: "#facc15", accent: "#f43f5e", bg: "#0f0a1e" },
  },
  {
    id: "theme-rose-gold",
    name: "Rose Gold",
    description: "Elegant rose-gold tones with a luxurious, premium feel.",
    cost: 130,
    category: "themes",
    icon: "🌹",
    themeClass: "theme-rose-gold",
    previewColors: { primary: "#e0a080", accent: "#f5c6a0", bg: "#1a1018" },
  },

  // ─── Power-Ups ───
  {
    id: "powerup-streak-freeze",
    name: "Streak Freeze ×1",
    description: "Protect your streak if you miss a day. Stacks with existing freezes.",
    cost: 30,
    category: "powerups",
    icon: "❄️",
    consumable: true,
  },
  {
    id: "powerup-double-xp",
    name: "Double XP (24h)",
    description: "Earn 2× focus points for the next 24 hours on every quiz & solve.",
    cost: 80,
    category: "powerups",
    icon: "⚡",
    consumable: true,
  },
  {
    id: "powerup-hint-tokens",
    name: "Hint Token ×3",
    description: "Get 3 extra hints when you're stuck in quiz mode.",
    cost: 25,
    category: "powerups",
    icon: "💡",
    consumable: true,
  },
  {
    id: "powerup-score-shield",
    name: "Score Shield ×2",
    description: "Protects your score from penalty on 2 wrong answers in quiz mode.",
    cost: 40,
    category: "powerups",
    icon: "🛡️",
    consumable: true,
  },
  {
    id: "powerup-time-warp",
    name: "Time Warp ×3",
    description: "Adds +30 extra seconds on 3 timed quiz questions. No rush!",
    cost: 35,
    category: "powerups",
    icon: "⏳",
    consumable: true,
  },
  {
    id: "powerup-xp-magnet",
    name: "XP Magnet (12h)",
    description: "Earn 1.5× bonus focus points for the next 12 hours.",
    cost: 50,
    category: "powerups",
    icon: "🧲",
    consumable: true,
  },
  {
    id: "powerup-lucky-charm",
    name: "Lucky Charm ×5",
    description: "5 chances to re-roll a quiz question you don't like.",
    cost: 45,
    category: "powerups",
    icon: "🍀",
    consumable: true,
  },
  {
    id: "powerup-focus-booster",
    name: "Focus Booster (1h)",
    description: "Activates a distraction-free focus timer with 3× point multiplier for 1 hour.",
    cost: 60,
    category: "powerups",
    icon: "🧠",
    consumable: true,
  },

  // ─── Profile Flair ───
  {
    id: "flair-gold-crown",
    name: "Gold Crown Badge",
    description: "A golden crown badge displayed next to your name on the leaderboard.",
    cost: 120,
    category: "flair",
    icon: "👑",
  },
  {
    id: "flair-diamond-frame",
    name: "Diamond Frame",
    description: "A diamond-studded avatar frame that sparkles on your profile.",
    cost: 200,
    category: "flair",
    icon: "💎",
  },
  {
    id: "flair-custom-title",
    name: "Custom Title",
    description: "Set a custom title that shows under your name everywhere.",
    cost: 150,
    category: "flair",
    icon: "✍️",
  },
  {
    id: "flair-fire-trail",
    name: "Fire Trail Effect",
    description: "A blazing fire trail animation on your leaderboard entry. 🔥",
    cost: 180,
    category: "flair",
    icon: "🔥",
  },
  {
    id: "flair-animated-avatar",
    name: "Animated Avatar Ring",
    description: "Your avatar gets a glowing, animated ring that pulses with your streak.",
    cost: 160,
    category: "flair",
    icon: "💫",
  },
  {
    id: "flair-rainbow-name",
    name: "Rainbow Name",
    description: "Your display name shimmers with a rainbow gradient everywhere.",
    cost: 250,
    category: "flair",
    icon: "🌈",
  },
  {
    id: "flair-star-halo",
    name: "Star Halo",
    description: "A rotating star halo orbits your avatar on the leaderboard.",
    cost: 220,
    category: "flair",
    icon: "⭐",
  },
  {
    id: "flair-math-wizard",
    name: "Math Wizard Title",
    description: "The exclusive 'Math Wizard 🧙‍♂️' title badge under your name.",
    cost: 300,
    category: "flair",
    icon: "🧙",
  },
  {
    id: "flair-vip-badge",
    name: "VIP Badge",
    description: "A premium purple VIP badge — show everyone you're a top supporter.",
    cost: 350,
    category: "flair",
    icon: "💜",
  },

  // ─── Feature Unlocks ───
  {
    id: "feature-voice-tutor",
    name: "Voice Tutor Access",
    description: "Unlock full real-time voice feedback, speech-to-text questions, and dynamic read-aloud features with your AI Math Buddy.",
    cost: 150,
    category: "features",
    icon: "🎙️",
  },
  {
    id: "feature-ad-free",
    name: "Ad-Free Experience",
    description: "Remove all promotional banners and enjoy a clean, distraction-free interface forever.",
    cost: 200,
    category: "features",
    icon: "🚫",
  },
  {
    id: "feature-advanced-stats",
    name: "Advanced Stats Dashboard",
    description: "Unlock detailed performance analytics, topic-wise breakdown, time-of-day heatmaps, and progress predictions.",
    cost: 180,
    category: "features",
    icon: "📊",
  },
  {
    id: "feature-custom-quizzes",
    name: "Custom Quiz Builder",
    description: "Create your own quizzes with custom questions, share them with friends, and challenge classmates.",
    cost: 250,
    category: "features",
    icon: "📝",
  },
  {
    id: "feature-formula-notebook",
    name: "Formula Notebook Pro",
    description: "Unlock an enhanced formula notebook with LaTeX rendering, categories, favorites, and quick-search.",
    cost: 120,
    category: "features",
    icon: "📖",
  },
  {
    id: "feature-study-groups",
    name: "Study Groups",
    description: "Create or join study groups, share progress, compete on group leaderboards, and chat in real-time.",
    cost: 300,
    category: "features",
    icon: "👥",
  },
];

/* ─── localStorage helpers ───────────────────────── */

function getPurchases(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORE_PURCHASES_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePurchase(itemId: string) {
  const purchases = getPurchases();
  if (!purchases.includes(itemId)) {
    purchases.push(itemId);
    localStorage.setItem(STORE_PURCHASES_KEY, JSON.stringify(purchases));
  }
}

function getActiveTheme(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACTIVE_THEME_KEY) || "";
}

function setActiveTheme(themeClass: string) {
  // Remove all theme classes first
  const allThemes = STORE_ITEMS.filter((i) => i.themeClass).map((i) => i.themeClass!);
  const html = document.documentElement;
  allThemes.forEach((t) => html.classList.remove(t));

  if (themeClass) {
    html.classList.add(themeClass);
    localStorage.setItem(ACTIVE_THEME_KEY, themeClass);
  } else {
    localStorage.removeItem(ACTIVE_THEME_KEY);
  }
}

const CATEGORY_META: Record<StoreCategory, { label: string; icon: typeof Palette | typeof Bot; color: string }> = {
  themes: { label: "Dashboard Themes", icon: Palette, color: "text-primary" },
  powerups: { label: "Power-Ups", icon: Zap, color: "text-accent" },
  features: { label: "Feature Unlocks", icon: Bot, color: "text-purple-400" },
  flair: { label: "Profile Flair", icon: Crown, color: "text-warning" },
};

/* ─── Store Page Component ────────────────────────── */

function Store() {
  const profileFn = useServerFn(getMyProfile);
  const spendFn = useServerFn(spendPoints);
  const freezeFn = useServerFn(purchaseStreakFreeze);

  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [activeTheme, setActiveThemeState] = useState<string>("");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [justPurchased, setJustPurchased] = useState<string | null>(null);

  useEffect(() => {
    setPurchases(getPurchases());
    setActiveThemeState(getActiveTheme());

    (async () => {
      try {
        const res = await profileFn({});
        if (res.profile) {
          setPoints(res.profile.total_points ?? 0);
        }
      } catch {}
      setLoading(false);
    })();
  }, [profileFn]);

  const handleBuy = useCallback(
    async (item: StoreItem) => {
      if (purchasingId) return;
      if (points < item.cost) {
        toast.error("Not enough focus points!");
        return;
      }

      setPurchasingId(item.id);

      try {
        if (item.id === "powerup-streak-freeze") {
          const res = await freezeFn({ data: { cost: item.cost } });
          setPoints(res.newBalance);
          toast.success(`❄️ Streak freeze added! You now have ${res.streakFreezes} freezes.`);
        } else if (item.id === "powerup-double-xp") {
          const res = await spendFn({ data: { cost: item.cost, itemId: item.id } });
          setPoints(res.newBalance);
          const until = Date.now() + 24 * 60 * 60 * 1000;
          localStorage.setItem(DOUBLE_XP_KEY, String(until));
          toast.success("⚡ Double XP activated for 24 hours!");
        } else if (item.id === "powerup-hint-tokens") {
          const res = await spendFn({ data: { cost: item.cost, itemId: item.id } });
          setPoints(res.newBalance);
          const current = Number(localStorage.getItem(HINT_TOKENS_KEY) || "0");
          localStorage.setItem(HINT_TOKENS_KEY, String(current + 3));
          toast.success(`💡 3 hint tokens added! Total: ${current + 3}`);
        } else if (item.id === "powerup-score-shield") {
          const res = await spendFn({ data: { cost: item.cost, itemId: item.id } });
          setPoints(res.newBalance);
          const current = Number(localStorage.getItem(SCORE_SHIELD_KEY) || "0");
          localStorage.setItem(SCORE_SHIELD_KEY, String(current + 2));
          toast.success(`🛡️ 2 score shields added! Total: ${current + 2}`);
        } else if (item.id === "powerup-time-warp") {
          const res = await spendFn({ data: { cost: item.cost, itemId: item.id } });
          setPoints(res.newBalance);
          const current = Number(localStorage.getItem(TIME_WARP_KEY) || "0");
          localStorage.setItem(TIME_WARP_KEY, String(current + 3));
          toast.success(`⏳ 3 time warps added! Total: ${current + 3}`);
        } else if (item.id === "powerup-xp-magnet") {
          const res = await spendFn({ data: { cost: item.cost, itemId: item.id } });
          setPoints(res.newBalance);
          const until = Date.now() + 12 * 60 * 60 * 1000;
          localStorage.setItem(XP_MAGNET_KEY, String(until));
          toast.success("🧲 XP Magnet activated for 12 hours!");
        } else if (item.id === "powerup-lucky-charm") {
          const res = await spendFn({ data: { cost: item.cost, itemId: item.id } });
          setPoints(res.newBalance);
          const current = Number(localStorage.getItem(LUCKY_CHARM_KEY) || "0");
          localStorage.setItem(LUCKY_CHARM_KEY, String(current + 5));
          toast.success(`🍀 5 lucky charms added! Total: ${current + 5}`);
        } else if (item.id === "powerup-focus-booster") {
          const res = await spendFn({ data: { cost: item.cost, itemId: item.id } });
          setPoints(res.newBalance);
          const until = Date.now() + 1 * 60 * 60 * 1000;
          localStorage.setItem(FOCUS_BOOSTER_KEY, String(until));
          toast.success("🧠 Focus Booster activated for 1 hour! 3× points!");
        } else {
          const res = await spendFn({ data: { cost: item.cost, itemId: item.id } });
          setPoints(res.newBalance);
          savePurchase(item.id);
          setPurchases(getPurchases());

          // Auto-equip themes on purchase
          if (item.themeClass) {
            setActiveTheme(item.themeClass);
            setActiveThemeState(item.themeClass);
          }

          toast.success(`🎉 ${item.name} purchased!`);
        }

        setJustPurchased(item.id);
        setTimeout(() => setJustPurchased(null), 1200);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Purchase failed");
      } finally {
        setPurchasingId(null);
      }
    },
    [points, purchasingId, spendFn, freezeFn],
  );

  const handleEquipTheme = useCallback(
    (item: StoreItem) => {
      if (!item.themeClass) return;
      if (activeTheme === item.themeClass) {
        // Unequip
        setActiveTheme("");
        setActiveThemeState("");
        toast.info("Theme reset to default");
      } else {
        setActiveTheme(item.themeClass);
        setActiveThemeState(item.themeClass);
        toast.success(`🎨 ${item.name} theme activated!`);
      }
    },
    [activeTheme],
  );

  const isOwned = (id: string) => purchases.includes(id);
  const isEquipped = (item: StoreItem) => item.themeClass === activeTheme && !!activeTheme;
  const canAfford = (cost: number) => points >= cost;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-hero px-6 py-8 shadow-elegant sm:px-10 sm:py-10">
        <div className="store-shimmer absolute inset-0 rounded-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
                  Focus Store
                </h1>
                <p className="text-sm text-white/70">
                  Exchange your focus points for premium rewards
                </p>
              </div>
            </div>
          </div>

          {/* Points balance chip */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-6 py-4 shrink-0">
            <Trophy className="h-6 w-6 text-yellow-300 price-pulse" />
            <div>
              <div className="text-xs text-white/60 uppercase tracking-wider font-medium">Your Balance</div>
              <div className="font-mono text-3xl font-bold text-white">
                {loading ? "···" : points.toLocaleString()}
              </div>
              <div className="text-xs text-white/50">focus points</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <Tabs defaultValue="themes" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1.5 bg-card/60 border border-border rounded-xl">
          {(Object.entries(CATEGORY_META) as [StoreCategory, typeof CATEGORY_META["themes"]][]).map(
            ([key, meta]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2 py-3 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
              >
                <meta.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{meta.label}</span>
                <span className="sm:hidden">{key === "themes" ? "Themes" : key === "powerups" ? "Power" : key === "features" ? "Unlock" : "Flair"}</span>
              </TabsTrigger>
            ),
          )}
        </TabsList>

        {/* ── Theme items ── */}
        <TabsContent value="themes" className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Default Theme card (always first) */}
            <div
              className={`relative group rounded-2xl border-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-1
                ${!activeTheme ? "border-primary/60 bg-gradient-card glow-border" : "border-border bg-gradient-card hover:border-primary/30 hover:shadow-glow"}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-lg">
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-base">Default Theme</h3>
                  <p className="text-xs text-muted-foreground">The original Math Buddy look.</p>
                </div>
              </div>

              {/* Preview bar */}
              <div className="flex gap-1.5 mb-4">
                <div className="h-3 flex-1 rounded-full" style={{ background: "var(--primary)" }} />
                <div className="h-3 w-8 rounded-full" style={{ background: "var(--accent)" }} />
                <div className="h-3 w-6 rounded-full bg-muted" />
              </div>

              <Button
                size="sm"
                className={`w-full ${!activeTheme ? "bg-primary/15 text-primary hover:bg-primary/25" : "bg-gradient-primary"}`}
                onClick={() => {
                  setActiveTheme("");
                  setActiveThemeState("");
                  toast.info("Theme reset to default");
                }}
                disabled={!activeTheme}
              >
                {!activeTheme ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Active
                  </>
                ) : (
                  <>
                    <Palette className="mr-1.5 h-3.5 w-3.5" /> Use Default
                  </>
                )}
              </Button>
            </div>

            {STORE_ITEMS.filter((i) => i.category === "themes").map((item) => (
              <ThemeCard
                key={item.id}
                item={item}
                owned={isOwned(item.id)}
                equipped={isEquipped(item)}
                canAfford={canAfford(item.cost)}
                purchasing={purchasingId === item.id}
                justPurchased={justPurchased === item.id}
                onBuy={() => handleBuy(item)}
                onEquip={() => handleEquipTheme(item)}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Power-Up items ── */}
        <TabsContent value="powerups" className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_ITEMS.filter((i) => i.category === "powerups").map((item) => (
              <PowerUpCard
                key={item.id}
                item={item}
                canAfford={canAfford(item.cost)}
                purchasing={purchasingId === item.id}
                justPurchased={justPurchased === item.id}
                onBuy={() => handleBuy(item)}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Feature Unlock items ── */}
        <TabsContent value="features" className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_ITEMS.filter((i) => i.category === "features").map((item) => (
              <FlairCard
                key={item.id}
                item={item}
                owned={isOwned(item.id)}
                canAfford={canAfford(item.cost)}
                purchasing={purchasingId === item.id}
                justPurchased={justPurchased === item.id}
                onBuy={() => handleBuy(item)}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Flair items ── */}
        <TabsContent value="flair" className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_ITEMS.filter((i) => i.category === "flair").map((item) => (
              <FlairCard
                key={item.id}
                item={item}
                owned={isOwned(item.id)}
                canAfford={canAfford(item.cost)}
                purchasing={purchasingId === item.id}
                justPurchased={justPurchased === item.id}
                onBuy={() => handleBuy(item)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── How to earn section ── */}
      <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          How to earn Focus Points
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <EarnMethod emoji="🧠" title="Quiz Mode" desc="+2 pts per correct answer" />
          <EarnMethod emoji="🎯" title="Perfect Score" desc="+10 bonus points" />
          <EarnMethod emoji="📸" title="Snap Solve" desc="+12 pts per solved problem" />
          <EarnMethod emoji="🔥" title="Daily Streak" desc="Keep solving every day!" />
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-Components ──────────────────────────────── */

function ThemeCard({
  item,
  owned,
  equipped,
  canAfford,
  purchasing,
  justPurchased,
  onBuy,
  onEquip,
}: {
  item: StoreItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  purchasing: boolean;
  justPurchased: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  return (
    <div
      className={`relative group rounded-2xl border-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 ${justPurchased ? "purchase-pop" : ""}
        ${equipped ? "border-primary/60 glow-border" : owned ? "border-accent/30 bg-gradient-card hover:border-accent/60 hover:shadow-glow" : canAfford ? "border-border bg-gradient-card hover:border-primary/30 hover:shadow-glow" : "border-border bg-card/40 opacity-75"}`}
    >
      {/* Owned badge */}
      {owned && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5 shadow-md">
            <Check className="h-3 w-3 mr-0.5" /> OWNED
          </Badge>
        </div>
      )}

      {/* Confetti burst on purchase */}
      {justPurchased && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="confetti-burst text-4xl">🎉</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-base">{item.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        </div>
      </div>

      {/* Color preview bar */}
      {item.previewColors && (
        <div className="flex gap-1.5 mb-4">
          <div
            className="h-3 flex-1 rounded-full transition-all"
            style={{ background: item.previewColors.primary }}
          />
          <div
            className="h-3 w-8 rounded-full transition-all"
            style={{ background: item.previewColors.accent }}
          />
          <div
            className="h-3 w-6 rounded-full transition-all"
            style={{ background: item.previewColors.bg }}
          />
        </div>
      )}

      {/* Action area */}
      {owned ? (
        <Button
          size="sm"
          className={`w-full transition-all ${equipped ? "bg-primary/15 text-primary hover:bg-primary/25" : "bg-gradient-primary"}`}
          onClick={onEquip}
        >
          {equipped ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" /> Active
            </>
          ) : (
            <>
              <Palette className="mr-1.5 h-3.5 w-3.5" /> Equip
            </>
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          className="w-full bg-gradient-primary disabled:opacity-50"
          onClick={onBuy}
          disabled={!canAfford || purchasing}
        >
          {purchasing ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Buying…
            </span>
          ) : !canAfford ? (
            <>
              <Lock className="mr-1.5 h-3.5 w-3.5" /> {item.cost} pts
            </>
          ) : (
            <>
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Buy · {item.cost} pts
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function PowerUpCard({
  item,
  canAfford,
  purchasing,
  justPurchased,
  onBuy,
}: {
  item: StoreItem;
  canAfford: boolean;
  purchasing: boolean;
  justPurchased: boolean;
  onBuy: () => void;
}) {
  const iconMap: Record<string, typeof Snowflake> = {
    "powerup-streak-freeze": Snowflake,
    "powerup-double-xp": BatteryCharging,
    "powerup-hint-tokens": Lightbulb,
    "powerup-score-shield": Shield,
    "powerup-time-warp": Timer,
    "powerup-xp-magnet": Magnet,
    "powerup-lucky-charm": Clover,
    "powerup-focus-booster": Brain,
  };
  const Icon = iconMap[item.id] || Zap;

  return (
    <div
      className={`relative group rounded-2xl border-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 ${justPurchased ? "purchase-pop" : ""}
        ${canAfford ? "border-border bg-gradient-card hover:border-accent/50 hover:shadow-glow" : "border-border bg-card/40 opacity-75"}`}
    >
      {justPurchased && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="confetti-burst text-4xl">✨</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-accent/15 flex items-center justify-center">
          <Icon className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-base">{item.name}</h3>
          <Badge variant="outline" className="text-[10px] mt-1">
            Consumable
          </Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">{item.description}</p>

      <Button
        size="sm"
        className="w-full bg-gradient-accent text-accent-foreground disabled:opacity-50"
        onClick={onBuy}
        disabled={!canAfford || purchasing}
      >
        {purchasing ? (
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Buying…
          </span>
        ) : !canAfford ? (
          <>
            <Lock className="mr-1.5 h-3.5 w-3.5" /> {item.cost} pts
          </>
        ) : (
          <>
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Buy · {item.cost} pts
          </>
        )}
      </Button>
    </div>
  );
}

function FlairCard({
  item,
  owned,
  canAfford,
  purchasing,
  justPurchased,
  onBuy,
}: {
  item: StoreItem;
  owned: boolean;
  canAfford: boolean;
  purchasing: boolean;
  justPurchased: boolean;
  onBuy: () => void;
}) {
  const iconMap: Record<string, typeof Crown> = {
    "flair-gold-crown": Crown,
    "flair-diamond-frame": Gem,
    "flair-custom-title": PenTool,
    "flair-fire-trail": Flame,
    "flair-animated-avatar": Eye,
    "flair-rainbow-name": Rainbow,
    "flair-star-halo": Star,
    "flair-math-wizard": Sparkles,
    "flair-vip-badge": Rocket,
    "feature-voice-tutor": Bot,
    "feature-ad-free": Ban,
    "feature-advanced-stats": BarChart3,
    "feature-custom-quizzes": FileText,
    "feature-formula-notebook": BookOpen,
    "feature-study-groups": Users,
  };
  const Icon = iconMap[item.id] || Crown;

  return (
    <div
      className={`relative group rounded-2xl border-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 ${justPurchased ? "purchase-pop" : ""}
        ${owned ? "border-warning/40 bg-gradient-card" : canAfford ? "border-border bg-gradient-card hover:border-warning/40 hover:shadow-glow" : "border-border bg-card/40 opacity-75"}`}
    >
      {owned && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-warning text-warning-foreground text-[10px] px-2 py-0.5 shadow-md">
            <Check className="h-3 w-3 mr-0.5" /> OWNED
          </Badge>
        </div>
      )}

      {justPurchased && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="confetti-burst text-4xl">🎉</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-warning/15 flex items-center justify-center">
          <Icon className="h-6 w-6 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-base">{item.name}</h3>
        </div>
        <span className="text-2xl">{item.icon}</span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">{item.description}</p>

      {owned ? (
        <Button size="sm" className="w-full bg-warning/15 text-warning hover:bg-warning/25" disabled>
          <Check className="mr-1.5 h-3.5 w-3.5" /> Owned
        </Button>
      ) : (
        <Button
          size="sm"
          className="w-full bg-gradient-primary disabled:opacity-50"
          onClick={onBuy}
          disabled={!canAfford || purchasing}
        >
          {purchasing ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Buying…
            </span>
          ) : !canAfford ? (
            <>
              <Lock className="mr-1.5 h-3.5 w-3.5" /> {item.cost} pts
            </>
          ) : (
            <>
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Buy · {item.cost} pts
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function EarnMethod({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4 transition-all hover:border-primary/30 hover:bg-card/80">
      <span className="text-xl shrink-0">{emoji}</span>
      <div className="min-w-0">
        <div className="font-display font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
