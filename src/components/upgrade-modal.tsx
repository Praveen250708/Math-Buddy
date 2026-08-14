import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, CheckCircle2, QrCode, CreditCard, Loader2, ArrowRight, ShieldCheck, Crown 
} from "lucide-react";
import { upgradeToPremium, getSystemSettings } from "@/lib/admin.functions";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: "1-month" | "1-year";
}

export function UpgradeModal({ isOpen, onClose, initialPlan }: UpgradeModalProps) {
  const upgradeFn = useServerFn(upgradeToPremium);
  const getSettingsFn = useServerFn(getSystemSettings);
  const [step, setStep] = useState<"pricing" | "checkout" | "verifying" | "success">("pricing");
  const [selectedPlan, setSelectedPlan] = useState<"1-month" | "1-year">("1-month");
  const [upiId, setUpiId] = useState("");
  const [method, setMethod] = useState<"qr" | "upi-id">("qr");
  const [prices, setPrices] = useState({ monthly: 1, annual: 1000 });

  useEffect(() => {
    if (isOpen) {
      getSettingsFn({})
        .then((res) => {
          if (res && res.settings) {
            setPrices({
              monthly: res.settings.premiumMonthlyPrice ?? 1,
              annual: res.settings.premiumAnnualPrice ?? 1000,
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, getSettingsFn]);

  // Adjust step and selected plan when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        setSelectedPlan(initialPlan);
        setStep("checkout");
      } else {
        setSelectedPlan("1-month");
        setStep("pricing");
      }
      setUpiId("");
      setMethod("qr");
    }
  }, [isOpen, initialPlan]);

  const handleStartPayment = () => {
    setStep("checkout");
  };

  const handleSimulatePayment = async () => {
    if (method === "upi-id" && (!upiId.trim() || !upiId.includes("@"))) {
      toast.error("Please enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    
    setStep("verifying");
    
    // Simulate UPI checkout approval network latency
    setTimeout(async () => {
      try {
        await upgradeFn({ data: { plan: selectedPlan } });
        setStep("success");
        toast.success("Payment Received!");
      } catch (err) {
        toast.error("Upgrade failed. Please try again.");
        setStep("checkout");
      }
    }, 2500);
  };

  const handleSuccessDone = () => {
    onClose();
    // Reload window so that the application re-fetches the user's profile and unlocks everything
    window.location.reload();
  };

  const planPrice = selectedPlan === "1-year" ? prices.annual : prices.monthly;
  const planLabel = selectedPlan === "1-year" ? "1-Year Access" : "1-Month Access";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] bg-gradient-card border-border/80 text-foreground overflow-hidden">
        {step === "pricing" && (
          <div className="space-y-6 py-2">
            <DialogHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <DialogTitle className="font-display text-2xl font-black">
                Upgrade to <span className="text-gradient-hero">Math Buddy Pro</span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/90">
                Choose a plan and unlock permanent, unrestricted access to all features.
              </DialogDescription>
            </DialogHeader>

            {/* Plan selector cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedPlan("1-month")}
                className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                  selectedPlan === "1-month"
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border/60 bg-card hover:border-primary/20 hover:bg-muted/10"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  Monthly Plan
                </div>
                <div className="text-2xl font-black font-display text-foreground mt-2">₹{prices.monthly}</div>
                <div className="text-[11px] text-muted-foreground mt-1">1 Month full access</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("1-year")}
                className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all relative ${
                  selectedPlan === "1-year"
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border/60 bg-card hover:border-primary/20 hover:bg-muted/10"
                }`}
              >
                <Badge className="absolute -top-2.5 right-2 bg-gradient-primary text-[9px] px-1.5 py-0.5 border border-primary/25 font-bold uppercase tracking-wider">
                  Save 20%
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  Annual Plan
                </div>
                <div className="text-2xl font-black font-display text-foreground mt-2">₹{prices.annual.toLocaleString("en-IN")}</div>
                <div className="text-[11px] text-muted-foreground mt-1">1 Year full access</div>
              </button>
            </div>

            <div className="space-y-3 bg-card/40 border border-border/50 rounded-2xl p-4 text-xs">
              <FeatureRow text="Unlimited daily problem solves (No cap)" />
              <FeatureRow text="Full Voice Tutor real-time conversation access" />
              <FeatureRow text="Complete Formula Notebook Pro with full category index" />
              <FeatureRow text="Advanced Study Analytics and PDF downloads" />
            </div>

            <Button 
              onClick={handleStartPayment} 
              className="w-full bg-gradient-primary shadow-glow font-bold"
            >
              Continue to Payment <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "checkout" && (
          <div className="space-y-6 py-2">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Simulated UPI Checkout</DialogTitle>
              <DialogDescription>
                Paying <span className="font-bold text-foreground">₹{planPrice}</span> for <span className="font-semibold text-primary-glow">{planLabel}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant={method === "qr" ? "default" : "outline"} 
                onClick={() => setMethod("qr")}
                className={`h-11 flex items-center gap-2 border font-semibold ${method === "qr" ? "bg-primary border-primary" : "border-border/60 hover:bg-muted/30"}`}
              >
                <QrCode className="h-4 w-4" />
                Scan QR Code
              </Button>
              <Button 
                variant={method === "upi-id" ? "default" : "outline"} 
                onClick={() => setMethod("upi-id")}
                className={`h-11 flex items-center gap-2 border font-semibold ${method === "upi-id" ? "bg-primary border-primary" : "border-border/60 hover:bg-muted/30"}`}
              >
                <CreditCard className="h-4 w-4" />
                UPI ID Pay
              </Button>
            </div>

            {method === "qr" ? (
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border border-dashed border-border/60 rounded-2xl space-y-4">
                <div className="relative p-2 bg-white rounded-2xl shadow-lg border border-slate-200">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `upi://pay?pa=ourproject@gmail.com&pn=MathBuddyPro&am=${planPrice}&cu=INR&tn=MathBuddyProUpgrade`
                    )}`} 
                    alt="UPI QR Code" 
                    className="h-40 w-40 object-contain" 
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-foreground">Scan with Google Pay, PhonePe, or Paytm</p>
                  <p className="text-[10px] text-muted-foreground">Amount: ₹{planPrice}.00</p>
                  <p className="text-[10px] text-primary/80 font-medium">After scanning and completing in your app, click "Complete Payment" below.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-5 bg-muted/20 border border-border/50 rounded-2xl">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Enter UPI ID</label>
                  <Input 
                    type="text" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobileNumber@upi, username@paytm" 
                    className="bg-background border-border/60"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  We will send a payment notification request to your UPI app. Open the app to approve.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("pricing")} className="flex-1 font-semibold border border-border/50">
                Back
              </Button>
              <Button onClick={handleSimulatePayment} className="flex-1 bg-gradient-primary shadow-glow font-bold">
                Complete Payment
              </Button>
            </div>
          </div>
        )}

        {step === "verifying" && (
          <div className="flex flex-col items-center justify-center py-12 px-6 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-display text-lg font-bold">Verifying UPI transaction</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Awaiting payment response from your UPI gateway. Do not close this dialog or reload the page.
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8 px-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center text-success animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-display text-2xl font-black text-foreground">Welcome to Math Buddy Pro!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Your payment for <span className="font-bold text-foreground">{planLabel}</span> was successfully approved. All premium features are now unlocked.
              </p>
            </div>
            <Button onClick={handleSuccessDone} className="w-full bg-gradient-primary shadow-glow font-bold">
              Awesome, let's go!
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
      <span className="text-muted-foreground/90 font-medium">{text}</span>
    </div>
  );
}
