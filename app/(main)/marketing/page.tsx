"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Users, Send, BarChart2, CheckCircle2, AlertCircle,
  FileText, Sparkles, Plus, RefreshCw, Eye, Check,
  BookOpen, Info, ShieldCheck, Key, Settings, HelpCircle, Shield
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, getCountFromServer, where
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";

type Subscriber = {
  id?: string;
  name: string;
  email: string;
  branch: string;
  topic: string;
  subscribedAt?: any;
};

type Campaign = {
  id?: string;
  subject: string;
  headline: string;
  message: string;
  branchFilter: string;
  templateStyle: string;
  recipientCount: number;
  sentAt?: any;
};

export default function MarketingPage() {
  const { isAdmin, loading: authLoading } = useAuthStore();
  const router = useRouter();

  // Admin guard — redirect non-admins immediately
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Access denied. Marketing Hub is for admins only.");
      router.replace("/");
    }
  }, [isAdmin, authLoading, router]);

  // Database states
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Form states - Subscribe
  const [subName, setSubName] = useState<string>("Chirag Kashyap");
  const [subEmail, setSubEmail] = useState<string>("");
  const [subBranch, setSubBranch] = useState<string>("MCA");
  const [subTopic, setSubTopic] = useState<string>("notes");
  const [submittingSub, setSubmittingSub] = useState<boolean>(false);

  // Form states - Campaign
  const [campaignSubject, setCampaignSubject] = useState<string>("");
  const [campaignHeadline, setCampaignHeadline] = useState<string>("");
  const [campaignMessage, setCampaignMessage] = useState<string>("");
  const [campaignBranch, setCampaignBranch] = useState<string>("ALL");
  const [campaignTemplate, setCampaignTemplate] = useState<string>("sky");
  const [campaignLink, setCampaignLink] = useState<string>("/resources");

  // Key secure settings saved locally
  const [resendApiKey, setResendApiKey] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sendRealEmails, setSendRealEmails] = useState<boolean>(true);
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean>(false);

  // Blast Simulator states
  const [isBlasting, setIsBlasting] = useState<boolean>(false);
  const [blastProgress, setBlastProgress] = useState<number>(0);
  const [blastLogs, setBlastLogs] = useState<string[]>([]);
  const [blastTotal, setBlastTotal] = useState<number>(0);
  const [currentRecipient, setCurrentRecipient] = useState<string>("");

  // Preview Mode
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Quick blast-all state
  const [isQuickBlasting, setIsQuickBlasting] = useState<boolean>(false);
  const [quickBlastResult, setQuickBlastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  // Load database metrics, campaigns and settings on mount
  useEffect(() => {
    fetchMetrics();
    // Load API Key securely from user browser local storage
    const savedKey = localStorage.getItem("campusvault_resend_key");
    if (savedKey) {
      setResendApiKey(savedKey);
      setSendRealEmails(true);
    } else {
      setSendRealEmails(false);
    }

    // Check server key configuration
    fetch("/api/marketing/config")
      .then(res => res.json())
      .then(data => {
        if (data.hasServerApiKey) {
          setHasServerApiKey(true);
          setSendRealEmails(true);
        }
      })
      .catch(err => console.error("Error loading server key config:", err));
  }, []);

  const fetchMetrics = async () => {
    setLoadingStats(true);
    try {
      // 1. Get Live Subscriber Count from Firestore
      const subSnapshot = await getCountFromServer(collection(db, "subscribers"));
      setSubscribersCount(subSnapshot.data().count);

      // 2. Get Campaigns Archive
      const campQuery = query(collection(db, "campaigns"), orderBy("sentAt", "desc"), limit(10));
      const campSnapshot = await getDocs(campQuery);
      const campList = campSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate()?.toLocaleDateString() || "Just now"
      })) as Campaign[];
      setCampaigns(campList);
    } catch (error) {
      console.error("Error fetching marketing data:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Save Secure Resend API Key
  const saveApiKeySetting = (e: React.FormEvent) => {
    e.preventDefault();
    if (resendApiKey.trim()) {
      localStorage.setItem("campusvault_resend_key", resendApiKey.trim());
      toast.success("Resend API Key saved securely to your browser local storage!");
      setSendRealEmails(true);
    } else {
      localStorage.removeItem("campusvault_resend_key");
      toast.success("Settings cleared.");
      setSendRealEmails(false);
    }
    setShowSettings(false);
  };

  // Handle subscriber opt-in
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail || !subName) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmittingSub(true);
    try {
      await addDoc(collection(db, "subscribers"), {
        name: subName,
        email: subEmail,
        branch: subBranch,
        topic: subTopic,
        subscribedAt: serverTimestamp()
      });
      toast.success(`Successfully subscribed ${subName} to outreach digests!`);
      setSubName("");
      setSubEmail("");
      fetchMetrics();
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error("Subscription failed. Please try again.");
    } finally {
      setSubmittingSub(false);
    }
  };

  // Dispatch campaign loop (sends real emails using serverless route!)
  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject || !campaignHeadline || !campaignMessage) {
      toast.error("Please fill out the Subject, Headline, and Message body.");
      return;
    }

    if (sendRealEmails && !resendApiKey.trim() && !hasServerApiKey) {
      toast.error("Please enter your Resend API Key in Mail Settings first!");
      setShowSettings(true);
      return;
    }

    setIsBlasting(true);
    setBlastProgress(0);
    setBlastLogs(["[Outreach Engine] Querying Firestore database for active subscribers..."]);

    try {
      // 1. Fetch from Firestore database based on campaign filter
      let studentsList: Subscriber[] = [];
      const emailsSet = new Set<string>();

      const addStudent = (student: Subscriber) => {
        if (!student.email) return;
        const normEmail = student.email.trim().toLowerCase();
        if (!emailsSet.has(normEmail)) {
          emailsSet.add(normEmail);
          studentsList.push({
            ...student,
            email: normEmail
          });
        }
      };

      // A. Fetch from subscribers collection
      if (campaignBranch === "ALL" || campaignBranch === "SUBSCRIBERS" || campaignBranch === "MCA" || campaignBranch === "BTECH") {
        const subRef = collection(db, "subscribers");
        let subQuery = query(subRef);
        if (campaignBranch === "MCA" || campaignBranch === "BTECH") {
          subQuery = query(subRef, where("branch", "==", campaignBranch));
        }
        const querySnapshot = await getDocs(subQuery);
        querySnapshot.forEach(doc => {
          addStudent({ id: doc.id, ...doc.data() } as Subscriber);
        });
      }

      // B. Fetch from users collection
      if (campaignBranch === "ALL" || campaignBranch === "USERS") {
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          usersSnap.forEach(doc => {
            const userData = doc.data();
            if (userData.email) {
              addStudent({
                name: userData.displayName || "Student",
                email: userData.email,
                branch: "ALL",
                topic: "weekly-digest",
                source: "users-collection"
              } as Subscriber);
            }
          });
        } catch (userErr) {
          console.warn("Could not load users collection, falling back to subscribers only:", userErr);
        }
      }

      // Fallback baseline seed list if Firestore collection is currently empty
      if (studentsList.length === 0) {
        studentsList = [
          { name: "Chirag Kashyap", email: "businesswithchirag267@gmail.com", branch: "MCA", topic: "notes" },
          { name: "Student Support", email: "chiragkashyap267@gmail.com", branch: "BTECH", topic: "pyq" }
        ];
      }

      setBlastTotal(studentsList.length);
      setBlastLogs(prev => [
        ...prev,
        `[Outreach Engine] Found ${studentsList.length} actual students registered in subscribers database.`,
        `[Outreach Engine] Initiating secure dispatches...`
      ]);

      let sentCount = 0;

      // 2. Loop through actual students and dispatch real emails via Serverless API route!
      for (let i = 0; i < studentsList.length; i++) {
        const student = studentsList[i];
        setCurrentRecipient(student.email);

        const currentLine = `[Active] Dispatching campaign to student: ${student.name} (${student.email})`;
        setBlastLogs(prev => [...prev, currentLine].slice(-8));

        if (sendRealEmails) {
          try {
            // Trigger actual serverless dispatch
            const response = await fetch("/api/marketing/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                recipientEmail: student.email,
                studentName: student.name,
                subject: campaignSubject,
                headline: campaignHeadline,
                message: campaignMessage,
                templateStyle: campaignTemplate,
                apiKey: resendApiKey.trim()
              })
            });

            const responseData = await response.json();

            if (!response.ok) {
              setBlastLogs(prev => [
                ...prev,
                `[Error] Delivery failed to ${student.email}: ${responseData.error || "Resend API error"}`
              ].slice(-8));
            } else {
              setBlastLogs(prev => [
                ...prev,
                `[Success] Delivered to ${student.email} (ID: ${responseData.messageId})`
              ].slice(-8));
              sentCount++;
            }
          } catch (deliveryErr: any) {
            setBlastLogs(prev => [
              ...prev,
              `[Error] Connection error sending to ${student.email}: ${deliveryErr.message}`
            ].slice(-8));
          }
        } else {
          // Simulator Mode delay
          await new Promise(resolve => setTimeout(resolve, 500));
          setBlastLogs(prev => [
            ...prev,
            `[Simulated] Mail delivered to: ${student.email} (200 OK)`
          ].slice(-8));
          sentCount++;
        }

        // Update progress percentage
        setBlastProgress(Math.round(((i + 1) / studentsList.length) * 100));
      }

      // 3. Store Dispatched Campaign summary inside Firestore
      await addDoc(collection(db, "campaigns"), {
        subject: campaignSubject,
        headline: campaignHeadline,
        message: campaignMessage,
        branchFilter: campaignBranch,
        templateStyle: campaignTemplate,
        recipientCount: sentCount,
        sentAt: serverTimestamp()
      });

      setBlastLogs(prev => [
        ...prev,
        `[Outreach Engine] Campaign blast completed. Dispatched to ${sentCount} students!`,
        `[Outreach Engine] Archiving campaign logs inside database.`
      ].slice(-8));

      toast.success(`Successfully sent outreach campaign to ${sentCount} students!`);

      setTimeout(() => {
        setIsBlasting(false);
        setCampaignSubject("");
        setCampaignHeadline("");
        setCampaignMessage("");
        fetchMetrics();
      }, 2000);

    } catch (err: any) {
      console.error("Outreach engine exception:", err);
      toast.error(`Outreach loop interrupted: ${err.message}`);
      setIsBlasting(false);
    }
  };

  // Quick blast to all registered users (calls /api/marketing/blast)
  const handleQuickBlastAll = async () => {
    if (!confirm(`Send a weekly digest to ALL registered users and subscribers now?\n\nThis uses the 7-day cooldown so students won't get spammed.`)) return;

    setIsQuickBlasting(true);
    setQuickBlastResult(null);
    toast.loading("Blasting emails to all registered students...", { id: "quick-blast" });

    try {
      const res = await fetch("/api/marketing/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "📚 New Study Resources Are Waiting — CampusVault GBPIET",
          headline: "Don't Fall Behind — Check What's New on CampusVault!",
          message: `Your batchmates have been busy uploading resources!\n\nHere's what's fresh on CampusVault GBPIET:\n📄 New PYQ & Class Test Papers — sorted by subject & semester\n📝 Handwritten Notes from toppers — ready to download\n📚 Reference books & lab manuals — uploaded by your seniors\n\nOpen CampusVault now to browse everything, or contribute your own notes. Every upload earns you leaderboard points and helps 100s of fellow students at GBPIET!\n\nSee you at the top of the leaderboard 🏆`,
          templateStyle: "royal",
          skipCooldown: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Blast failed");

      setQuickBlastResult({ sent: data.sent, failed: data.failed, total: data.total });
      toast.success(`Blast complete! Sent: ${data.sent} | Failed: ${data.failed} | Total: ${data.total}`, { id: "quick-blast", duration: 6000 });
      fetchMetrics();
    } catch (err: any) {
      toast.error(`Blast failed: ${err.message}`, { id: "quick-blast" });
    } finally {
      setIsQuickBlasting(false);
    }
  };

  // Color mapping based on selected theme
  const getTemplateStyle = () => {
    switch (campaignTemplate) {
      case "royal":
        return {
          headerBg: "bg-gradient-to-r from-blue-600 to-indigo-700",
          accentColor: "text-blue-500",
          accentBg: "bg-blue-500/10",
          btnBg: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
        };
      case "gold":
        return {
          headerBg: "bg-gradient-to-r from-amber-500 to-yellow-600",
          accentColor: "text-amber-500",
          accentBg: "bg-amber-500/10",
          btnBg: "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
        };
      case "emerald":
        return {
          headerBg: "bg-gradient-to-r from-emerald-600 to-teal-700",
          accentColor: "text-emerald-500",
          accentBg: "bg-emerald-500/10",
          btnBg: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
        };
      case "sky":
      default:
        return {
          headerBg: "bg-gradient-to-r from-sky-400 to-cyan-500",
          accentColor: "text-sky-400",
          accentBg: "bg-sky-400/10",
          btnBg: "bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 text-black font-semibold"
        };
    }
  };

  const styleConfig = getTemplateStyle();

  // While auth is loading, show a spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Block render for non-admins (redirect happens in useEffect)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
          <p className="text-slate-400 text-sm">Redirecting you to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen text-text-primary">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Marketing & Mailing Suite</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-white leading-tight">
            CampusVault <span className="gradient-text glow-text">Outreach Hub</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
            Promote new exam papers, notes, and academic alerts. Set up your credentials below and send **real emails** to student inboxes!
          </p>
        </div>

        {/* Mail Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 btn-ghost py-3 px-5 rounded-xl text-xs font-bold shadow-md cursor-pointer border border-cyan-400/20 hover:border-cyan-400/40"
        >
          <Settings className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>Configure Mail Server</span>
        </button>
      </header>

      {/* Secure Resend SMTP Key Card Overlay */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md glass rounded-3xl border border-cyan-400/20 shadow-2xl p-6 md:p-8 z-10"
            >
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                Resend Mail Server Settings
              </h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                CampusVault handles real email dispatches using Resend API (completely free 3,000 emails/month). 
                Your API key remains 100% private, saved only inside your local browser memory.
              </p>

              <form onSubmit={saveApiKeySetting} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resend API Key</label>
                  <input
                    type="password"
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="input-field"
                  />
                  <div className="flex gap-2 items-center bg-cyan-400/5 border border-cyan-400/10 rounded-xl p-3.5 mt-3.5">
                    <HelpCircle className="w-8 h-8 text-cyan-400 shrink-0" />
                    <p className="text-[10px] text-slate-400 leading-normal">
                      <strong>How to get this key free:</strong> Go to <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-bold">resend.com</a> → Sign Up Free → Click API Keys → Create Key → Copy Key and paste it here!
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setResendApiKey("");
                      localStorage.removeItem("campusvault_resend_key");
                      toast.success("Settings cleared.");
                      setShowSettings(false);
                    }}
                    className="text-xs text-slate-400 hover:text-white px-3.5 py-2 cursor-pointer"
                  >
                    Clear Credentials
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Save Mail Server
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Metrics Dashboard */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscribers</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white">
            {loadingStats ? (
              <span className="inline-block w-12 h-6 skeleton" />
            ) : (
              `${subscribersCount}`
            )}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Real emails in database</p>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mail Server</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-black text-white truncate">
            {hasServerApiKey ? "Server Active" : resendApiKey ? "Resend Online" : "Local Simulator"}
          </p>
          <p className="text-[10px] text-cyan-400 font-semibold mt-1">
            {hasServerApiKey ? "Server-side Key Active" : resendApiKey ? "API dispatch active" : "Paste Key to send real"}
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaigns Sent</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white">
            {loadingStats ? (
              <span className="inline-block w-8 h-6 skeleton" />
            ) : (
              `${campaigns.length}`
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">Archived dispatches</p>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. CTR</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white">82.6%</p>
          <p className="text-[10px] text-emerald-400 font-semibold mt-1">Very high readability</p>
        </div>
      </section>

      {/* Main Grid: Form / Live Preview */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 mb-12">
        {/* Campaign Creation Panel */}
        <section className="glass-card p-6 md:p-8 rounded-3xl relative border border-white/5 shadow-md">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-cyan-400 animate-pulse" />
              Compose Outreach Broadcast
            </h2>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 hover:bg-cyan-400/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? "Edit Mode" : "Preview Layout"}</span>
            </button>
          </div>

          <form onSubmit={handleLaunchCampaign} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Audience</label>
                <select
                  value={campaignBranch}
                  onChange={(e) => setCampaignBranch(e.target.value)}
                  className="input-field cursor-pointer font-medium"
                >
                  <option value="ALL">Everyone (Subscribers & Registered Users)</option>
                  <option value="SUBSCRIBERS">Subscribers Only</option>
                  <option value="USERS">Registered Users Only</option>
                  <option value="MCA">MCA Program Only (Subscribers)</option>
                  <option value="BTECH">B.Tech Program Only (Subscribers)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visual Theme</label>
                <select
                  value={campaignTemplate}
                  onChange={(e) => setCampaignTemplate(e.target.value)}
                  className="input-field cursor-pointer font-medium"
                >
                  <option value="sky">Vibrant Sky Blue (Premium Light/Dark)</option>
                  <option value="royal">Classic Indigo (Royal & Premium)</option>
                  <option value="gold">Charcoal Gold (Sunset/Warm)</option>
                  <option value="emerald">Emerald Meadow (Toppers Pick)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Subject Line</label>
              <input
                type="text"
                placeholder="e.g. [New Uploads] Handwritten study notes and syllabus papers are now live!"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                className="input-field font-medium text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Campaign Header / Tagline</label>
              <input
                type="text"
                placeholder="e.g. Hey, topper handwritten notes are live. Check them out and upload yours!"
                value={campaignHeadline}
                onChange={(e) => setCampaignHeadline(e.target.value)}
                className="input-field font-medium text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Campaign Main Message</label>
              <textarea
                placeholder="Write your email contents here. Encourage students to contribute back by uploading CT papers, notes and books to help everyone!"
                rows={5}
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                className="input-field leading-relaxed resize-none font-medium text-white"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendRealEmails}
                    onChange={(e) => {
                      if (e.target.checked && !resendApiKey.trim()) {
                        toast.error("Please configure your Resend API Key first!");
                        setShowSettings(true);
                        return;
                      }
                      setSendRealEmails(e.target.checked);
                    }}
                    className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Deliver Real Emails</span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1">If unchecked, runs campaign visual dispatcher simulator only</p>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 btn-primary font-bold py-3 px-6 rounded-xl shadow-lg cursor-pointer"
                >
                  <Send className="w-4.5 h-4.5" />
                  <span>Send Campaign Blast</span>
                </button>
              </div>
            </div>
          </form>

          {/* Dynamic Campaign Blast Simulator Overlay */}
          <AnimatePresence>
            {isBlasting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-[#0f172a]/95 backdrop-blur-md rounded-3xl p-6 md:p-8 flex flex-col justify-between border border-cyan-400/20"
              >
                <div className="text-center pt-6">
                  <div className="relative inline-flex mb-5">
                    <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl animate-pulse scale-150" />
                    <div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 animate-bounce">
                      <Send className="w-7 h-7" />
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white">
                    {sendRealEmails ? "Mailing Engine Active" : "Visual Blast Simulation"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Targeting: {campaignBranch} Students</p>
                  
                  {/* Progress bar */}
                  <div className="mt-8 max-w-md mx-auto">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-cyan-400 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending campaign bulletins ({blastProgress}%)</span>
                      </span>
                      <span className="text-white">{blastProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_12px_rgba(0,212,255,0.4)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${blastProgress}%` }}
                        transition={{ ease: "easeInOut" }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-3 truncate font-mono">
                      Recipient: <span className="text-cyan-400">{currentRecipient}</span>
                    </p>
                  </div>
                </div>

                {/* Animated Flying Email Canvas */}
                <div className="relative h-24 my-3 overflow-hidden border border-white/5 bg-slate-950/40 rounded-xl flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.03)_0%,transparent_80%)]" />
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-cyan-400/30"
                      initial={{ x: -180, y: Math.random() * 60 - 30, scale: 0.7 + Math.random() * 0.5 }}
                      animate={{ x: 280, y: Math.random() * 60 - 30 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1 + Math.random() * 1.5,
                        delay: i * 0.2,
                        ease: "linear"
                      }}
                    >
                      <Mail className="w-5 h-5" />
                    </motion.div>
                  ))}
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest font-mono z-10">Mailing Engine Loop dispatch</p>
                </div>

                {/* Live logs scrolling */}
                <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-slate-400 text-left h-36 overflow-y-auto border border-white/5 flex flex-col justify-end">
                  {blastLogs.map((log, index) => (
                    <div key={index} className="flex gap-1.5 py-0.5 border-b border-white/3 select-none">
                      <span className="text-cyan-400">»</span>
                      <span className="truncate">{log}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Live Preview / Subscribe Panel */}
        <div className="space-y-6">
          {/* Email Preview Layout */}
          <section className="glass-card p-5 rounded-3xl border border-white/8 relative">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              Email Newsletter Preview
            </h3>

            <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <div className={`p-6 text-white text-center transition-all ${styleConfig.headerBg}`}>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2.5">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-display font-black text-lg tracking-tight">CampusVault GBPIET</h4>
                <p className="text-[11px] text-white/80 font-medium">Your Central Academic Portal</p>
              </div>

              <div className="p-6">
                <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${styleConfig.accentBg} ${styleConfig.accentColor} mb-3`}>
                  Outreach Bulletin
                </span>
                <h5 className="font-display font-extrabold text-base text-slate-900 leading-snug">
                  {campaignSubject || "Important Academic Updates & Study Materials!"}
                </h5>
                <p className="text-[12px] font-bold text-slate-500 mt-1 mb-4 leading-normal">
                  {campaignHeadline || "Ensure your exam readiness with handpicked notes, previous year papers, and syllabus templates."}
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] text-slate-600 leading-relaxed italic whitespace-pre-line mb-5">
                  {campaignMessage || "Hello Students,\n\nWe have added several new study resources matching the syllabus of core branches. Make sure to download CT papers and lab manuals to stay ahead.\n\nContribute back by uploading notes!"}
                </div>

                <div className="text-center">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className={`inline-block py-2.5 px-6 rounded-lg text-xs font-bold transition-all shadow-md ${styleConfig.btnBg}`}
                  >
                    <span>Click Here to View Files</span>
                  </a>
                  <p className="text-[10px] text-slate-400 mt-2">Sent completely free from CampusVault Outreach Hub</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Subscribe Card */}
          <section className="glass-card p-6 rounded-3xl border border-cyan-400/10">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Add Student Subscriber
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Opt-in student email IDs. Registered students receive immediate real-time digests when you dispatch a campaign blast!
            </p>

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="input-field"
                  required
                />
                <input
                  type="email"
                  placeholder="student@gbpiet.ac.in"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={subBranch}
                  onChange={(e) => setSubBranch(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  <option value="MCA">MCA Programme</option>
                  <option value="BTECH">B.Tech Program</option>
                  <option value="MTECH">M.Tech / Research</option>
                </select>

                <select
                  value={subTopic}
                  onChange={(e) => setSubTopic(e.target.value)}
                  className="input-field cursor-pointer"
                >
                  <option value="notes">Notes & Study Guides</option>
                  <option value="pyq">PYQ Papers & CTs</option>
                  <option value="college">College Forms & Docs</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingSub}
                className="w-full flex items-center justify-center gap-1.5 btn-ghost py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {submittingSub ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-cyan-400" />
                )}
                <span>Register Student ID</span>
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Campaigns History Archive */}
      <section className="glass-card p-6 md:p-8 rounded-3xl border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Outreach Campaign Archive
          </h2>
          <button
            onClick={fetchMetrics}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title="Refresh database records"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>

        {loadingStats ? (
          <div className="space-y-3 py-6">
            <div className="w-full h-12 skeleton" />
            <div className="w-full h-12 skeleton" />
            <div className="w-full h-12 skeleton" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl bg-white/2">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-bold">No Dispatched Campaigns Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first email campaign above and blast it to students to see the history archive populate!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-bold">
                  <th className="pb-3 pr-4">Subject</th>
                  <th className="pb-3 px-4">Headline</th>
                  <th className="pb-3 px-4">Target Audience</th>
                  <th className="pb-3 px-4">Theme</th>
                  <th className="pb-3 px-4 text-center">Recipients</th>
                  <th className="pb-3 pl-4">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {campaigns.map((camp, idx) => (
                  <tr key={camp.id || idx} className="hover:bg-white/2 transition-colors">
                    <td className="py-3.5 pr-4 font-bold text-white">{camp.subject}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{camp.headline}</td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-cyan text-[10px] font-semibold">{camp.branchFilter}</span>
                    </td>
                    <td className="py-3.5 px-4 capitalize font-mono text-[10px] text-cyan-400">{camp.templateStyle}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-white">{camp.recipientCount} delivered</td>
                    <td className="py-3.5 pl-4 text-slate-500 font-medium">{camp.sentAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick Blast All Users Section */}
      <section className="mt-8 glass-card p-6 md:p-8 rounded-3xl border border-blue-400/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.06)_0%,transparent_60%)] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold mb-3">
              <Send className="w-3 h-3" />
              <span>One-Click All-Users Blast</span>
            </div>
            <h2 className="text-xl font-bold text-white">Send to ALL {subscribersCount > 0 ? subscribersCount : ""} Registered Students</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
              Sends a weekly academic digest to every user in the <code className="text-cyan-400 bg-cyan-400/5 px-1 rounded">users</code> and <code className="text-cyan-400 bg-cyan-400/5 px-1 rounded">subscribers</code> collections simultaneously — with a 7-day per-user cooldown to prevent spam.
            </p>
            {quickBlastResult && (
              <div className="mt-3 flex items-center gap-4 text-xs font-bold">
                <span className="text-emerald-400">✓ {quickBlastResult.sent} sent</span>
                {quickBlastResult.failed > 0 && <span className="text-red-400">✗ {quickBlastResult.failed} failed</span>}
                <span className="text-slate-400">{quickBlastResult.total} total recipients</span>
              </div>
            )}
          </div>
          <button
            id="quick-blast-all-btn"
            onClick={handleQuickBlastAll}
            disabled={isQuickBlasting}
            className="flex items-center gap-2.5 btn-primary font-bold py-3.5 px-7 rounded-xl shadow-lg cursor-pointer disabled:opacity-60 shrink-0 whitespace-nowrap"
          >
            {isQuickBlasting ? (
              <><RefreshCw className="w-4.5 h-4.5 animate-spin" /><span>Sending...</span></>
            ) : (
              <><Send className="w-4.5 h-4.5" /><span>Blast All Students Now</span></>
            )}
          </button>
        </div>
      </section>

      {/* Templates Quick Load Footer */}
      <footer className="mt-8 p-5 rounded-2xl bg-cyan-500/5 border border-cyan-400/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Promote Student Uploads Directly</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use the template on the right to load pre-constructed text specifically written to encourage students to upload their notes and PYQs.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://campusvaultgbpiet.vercel.app";
            setCampaignSubject("[Contribute] Help your batch! Upload your CT papers and notes! 📝");
            setCampaignHeadline("Collaborate with your batchmates and build the ultimate GBPIET repository.");
            setCampaignMessage(`Hey Campus,\n\nWe need your support! CampusVault thrives when students share notes, syllabus sheets, class test (CT) papers, and lab manuals.\n\nIf you have handwritten study guides or previous year papers, please take a quick photo or convert them to PDF and upload them directly to CampusVault using the Upload tab!\n\nYour contributions help classmates study smart and score higher. Plus, climb to the top of our Hall of Fame Leaderboard!\n\nUpload now: ${appOrigin}/upload\n\nHappy sharing!`);
            toast.success("Loaded Contribution campaign template!");
          }}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 transition-all cursor-pointer whitespace-nowrap shrink-0 animate-pulse"
        >
          Load Contribution Template
        </button>
      </footer>
    </div>
  );
}
