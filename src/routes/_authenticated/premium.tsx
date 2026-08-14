import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { 
  Sparkles, Check, Shield, ChevronRight, Loader2, Crown, 
  Flame, Trophy, Calendar, CheckCircle2, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyProfile } from "@/lib/gamification.functions";
import { getSystemSettings } from "@/lib/admin.functions";
import { UpgradeModal } from "@/components/upgrade-modal";
import { PageHeader } from "./formulas";
import { checkIsPremium } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/premium")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: PremiumPage,
});

function PremiumPage() {
  const profileFn = useServerFn(getMyProfile);
  const getSettingsFn = useServerFn(getSystemSettings);
  const [profile, setProfile] = useState<any>(null);
  const [prices, setPrices] = useState({ monthly: 1, annual: 1000 });
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"1-month" | "1-year">("1-month");

  useEffect(() => {
    (async () => {
      try {
        const [resProfile, resSettings] = await Promise.all([
          profileFn({}),
          getSettingsFn({})
        ]);
        if (resProfile.profile) {
          setProfile(resProfile.profile);
        }
        if (resSettings && resSettings.settings) {
          setPrices({
            monthly: resSettings.settings.premiumMonthlyPrice ?? 1,
            annual: resSettings.settings.premiumAnnualPrice ?? 1000,
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, [profileFn, getSettingsFn]);

  const handleUpgradeClick = (plan: "1-month" | "1-year") => {
    setSelectedPlan(plan);
    setUpgradeOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading membership plan...</p>
      </div>
    );
  }

  const isPremiumActive = checkIsPremium(profile);

  // Format expiration date
  const formatExpiration = (dateStr: string | null) => {
    if (!dateStr) return "Lifetime License";
    const dateObj = new Date(dateStr);
    if (dateObj.getFullYear() > 2090) return "Lifetime License (Admin)";
    return dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <PageHeader 
        icon={<Crown className="h-6 w-6 text-yellow-400 animate-pulse" />}
        title="Math Buddy Pro"
        subtitle="Manage your membership plan and explore premium solver privileges."
      />

      {isPremiumActive ? (
        // ACTIVE MEMBER VIEW
        <div className="grid gap-6 md:grid-cols-3">
          {/* Membership Card */}
          <div className="md:col-span-2 space-y-6">
            <Card className="rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-background to-primary/10 shadow-elegant overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-10 text-yellow-400 pointer-events-none group-hover:scale-105 transition-transform duration-500">
                <Crown className="h-44 w-44 rotate-12" />
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-yellow-500 text-yellow-foreground font-black px-3 py-1 text-xs shadow-md tracking-wider">
                    PRO MEMBER ACTIVE
                  </Badge>
                  <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
                </div>
                <CardTitle className="font-display text-2xl font-black mt-4">
                  {profile.display_name || "Premium Student"}
                </CardTitle>
                <CardDescription className="font-mono text-[10px] text-muted-foreground">
                  User ID: {profile.user_id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 border-y border-border/50 py-4 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="h-4.5 w-4.5 text-yellow-300 shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Points</div>
                      <div className="font-mono font-bold">{profile.total_points ?? 0} pts</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Flame className="h-4.5 w-4.5 text-accent shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Streak</div>
                      <div className="font-mono font-bold">{profile.current_streak ?? 0} days</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Plan Valid Until</div>
                      <div className="font-bold text-emerald-400">{formatExpiration(profile.premium_until)}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4 flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400">All features are fully unlocked</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Your subscription is active. You have full access to snap solves, voice tutors, analytics, and formula sheets.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-bold text-base mb-4">Your Active Subscription Benefits</h3>
              <div className="space-y-3.5">
                <BenefitRow text="Unlimited daily AI photo solves (No rate limits)" />
                <BenefitRow text="Complete real-time voice tutor conversation privileges" />
                <BenefitRow text="Formula Notebook Pro (All premium categories accessible)" />
                <BenefitRow text="Advanced Study progress analytics and worksheets" />
                <BenefitRow text="Ad-free clean learning workspace" />
              </div>
            </Card>
          </div>

          {/* Quick links & status */}
          <div className="space-y-6">
            <Card className="rounded-2xl border border-border bg-card p-5 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto text-yellow-400">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm">Need any help?</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  As a Pro member, you have priority access to support features.
                </p>
              </div>
              <Button variant="outline" className="w-full text-xs font-semibold border-border/60 hover:bg-muted/30">
                Contact Member Support
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        // FREE TIER VIEW - DISPLAY THE TWO PLANS SIDE-BY-SIDE
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="font-display text-2xl font-black text-foreground">Select Your Premium Plan</h2>
            <p className="text-sm text-muted-foreground">
              Unlock the full power of Math Buddy and study without boundaries. Remove the daily 30-solve cap instantly.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* 1 Month Plan Card */}
            <Card className="rounded-3xl border border-border bg-gradient-card p-6 md:p-8 flex flex-col justify-between shadow-elegant relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary-glow">
                      MONTHLY PASS
                    </Badge>
                    <h3 className="font-display text-xl font-bold mt-2">1 Month Pro</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black font-display text-foreground">₹{prices.monthly}</span>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">One-time payment</p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/40 pt-5 mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Key Features:</h4>
                  <div className="space-y-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Unlimited solves for 1 full month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Voice Tutor conversation access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Formula Notebook Pro unlocked</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handleUpgradeClick("1-month")} 
                className="w-full bg-gradient-primary shadow-glow font-bold"
              >
                Get 1 Month Access <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Card>

            {/* 1 Year Plan Card */}
            <Card className="rounded-3xl border border-primary bg-gradient-card p-6 md:p-8 flex flex-col justify-between shadow-glow relative overflow-hidden group hover:border-yellow-400/50 transition-all duration-300">
              <Badge className="absolute -top-1.5 right-6 bg-gradient-primary text-[10px] font-bold px-2 py-0.5 border border-primary/25 tracking-wider">
                BEST VALUE · SAVE 20%
              </Badge>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-bold">
                      ANNUAL PASS
                    </Badge>
                    <h3 className="font-display text-xl font-bold mt-2">1 Year Pro</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black font-display text-yellow-300">₹{prices.annual.toLocaleString("en-IN")}</span>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">One-time payment</p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/40 pt-5 mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Key Features:</h4>
                  <div className="space-y-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-yellow-400 shrink-0" />
                      <span className="text-foreground">Unlimited solves for 1 full year</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-yellow-400 shrink-0" />
                      <span className="text-foreground">Voice Tutor conversation access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-yellow-400 shrink-0" />
                      <span className="text-foreground">Formula Notebook Pro unlocked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-yellow-400 shrink-0" />
                      <span className="text-foreground">Advanced solves analytics insights</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handleUpgradeClick("1-year")} 
                className="w-full bg-yellow-500 text-yellow-foreground font-black hover:bg-yellow-600 shadow-glow"
              >
                Get 1 Year Access <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground max-w-md mx-auto bg-muted/10 border border-border/50 rounded-2xl p-4 mt-6">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>UPI Checkout Gateways</span>
            </div>
            <div className="hidden sm:block text-muted-foreground/40">|</div>
            <div>Fully encrypted simulated transactions</div>
          </div>
        </div>
      )}

      <UpgradeModal 
        isOpen={upgradeOpen} 
        onClose={() => setUpgradeOpen(false)} 
        initialPlan={selectedPlan}
      />
    </div>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
      <span className="text-foreground/90 font-medium">{text}</span>
    </div>
  );
}
