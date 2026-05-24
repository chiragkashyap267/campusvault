"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, Flag, Calendar, LogIn, CloudOff } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { getTodos, saveTodo, updateTodo, deleteTodo } from "@/lib/firebase/firestore";
import { Todo, Priority } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "High", color: "text-red-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "low", label: "Low", color: "text-green-400" },
];

const CATEGORIES = ["general", "assignment", "exam", "project"] as const;
const LOCAL_KEY = "cv_guest_todos";

function loadLocalTodos(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalTodos(todos: Todo[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(todos));
}

export default function TodoPage() {
  const { user, loading } = useAuthStore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", priority: "medium" as Priority, dueDate: "", category: "general" as Todo["category"] });

  // Load todos based on auth state
  useEffect(() => {
    if (loading) return;
    if (user) {
      getTodos(user.uid).then(setTodos);
    } else {
      setTodos(loadLocalTodos());
    }
  }, [user, loading]);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    const newTodo: Todo = {
      id: `local_${Date.now()}`,
      uid: user?.uid || "guest",
      title: form.title,
      done: false,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      category: form.category,
      description: "",
      createdAt: new Date().toISOString(),
    };

    if (user) {
      const id = await saveTodo(user.uid, {
        title: form.title,
        done: false,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        category: form.category,
        description: "",
      });
      newTodo.id = id;
    } else {
      const updated = [newTodo, ...todos];
      setTodos(updated);
      saveLocalTodos(updated);
      setForm({ title: "", priority: "medium", dueDate: "", category: "general" });
      setAdding(false);
      toast.success("Task added (saved locally)");
      return;
    }

    setTodos((prev) => [newTodo, ...prev]);
    setForm({ title: "", priority: "medium", dueDate: "", category: "general" });
    setAdding(false);
    toast.success("Task added!");
  };

  const toggleDone = async (todo: Todo) => {
    const updated = todos.map((t) => t.id === todo.id ? { ...t, done: !t.done } : t);
    setTodos(updated);
    if (user) {
      await updateTodo(user.uid, todo.id, { done: !todo.done });
    } else {
      saveLocalTodos(updated);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    if (user) {
      await deleteTodo(user.uid, id);
    } else {
      saveLocalTodos(updated);
    }
    toast.success("Task deleted");
  };

  const filtered = todos.filter((t) => filter === "all" ? true : filter === "done" ? t.done : !t.done);
  const completedCount = todos.filter((t) => t.done).length;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Guest warning banner */}
        {!loading && !user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300"
          >
            <CloudOff className="w-4 h-4 shrink-0" />
            <p className="text-sm flex-1">Tasks are saved <strong>locally only</strong> — they'll be lost if you clear browser data.</p>
            <Link href="/login" className="flex items-center gap-1 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap">
              <LogIn className="w-3.5 h-3.5" /> Sign in
            </Link>
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Task Tracker</h1>
            <p className="text-slate-400 text-sm mt-0.5">{completedCount} of {todos.length} tasks completed</p>
          </div>
          <button onClick={() => setAdding(true)} className="btn-primary px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <motion.div
            className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
            animate={{ width: todos.length ? `${(completedCount / todos.length) * 100}%` : "0%" }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 glass-card p-1 rounded-xl">
          {(["all", "active", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all",
                filter === f ? "bg-cyan-400/15 text-cyan-400" : "text-slate-400 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-4 space-y-3 overflow-hidden"
            >
              <input
                autoFocus
                className="input-field"
                placeholder="Task title..."
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <div className="grid grid-cols-3 gap-2">
                <select className="input-field text-xs" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label} Priority</option>)}
                </select>
                <select className="input-field text-xs" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Todo["category"] }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
                <input type="date" className="input-field text-xs" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAdding(false)} className="btn-ghost flex-1 py-2 rounded-xl text-xs">Cancel</button>
                <button onClick={handleAdd} disabled={!form.title} className="btn-primary flex-1 py-2 rounded-xl text-xs disabled:opacity-40">Add Task</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Todo list */}
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No tasks here. Add one!</p>
              </motion.div>
            ) : (
              filtered.map((todo) => {
                const priority = PRIORITIES.find((p) => p.value === todo.priority);
                return (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={cn(
                      "glass-card p-4 flex items-center gap-3 group",
                      todo.done && "opacity-50"
                    )}
                  >
                    <button onClick={() => toggleDone(todo)} className="shrink-0">
                      {todo.done
                        ? <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        : <Circle className="w-5 h-5 text-slate-600 hover:text-cyan-400 transition-colors" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm text-white font-medium", todo.done && "line-through text-slate-500")}>
                        {todo.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[10px] font-medium flex items-center gap-1", priority?.color)}>
                          <Flag className="w-2.5 h-2.5" />{priority?.label}
                        </span>
                        {todo.category && (
                          <span className="text-[10px] text-slate-500 capitalize badge bg-white/5 rounded px-1.5 py-0.5">{todo.category}</span>
                        )}
                        {todo.dueDate && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> {formatDate(todo.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(todo.id)} className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
