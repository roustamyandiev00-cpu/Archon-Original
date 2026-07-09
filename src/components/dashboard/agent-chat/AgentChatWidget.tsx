"use client";

import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Bot, GripHorizontal, Minus, Send, Sparkles, X } from "lucide-react";
import { useAgentChat } from "@/components/dashboard/agent-chat/AgentChatProvider";

export default function AgentChatWidget() {
  const {
    view,
    minimize,
    close,
    activeAgent,
    position,
    setPosition,
    messages,
    sendMessage,
    isTyping,
  } = useAgentChat();
  const [input, setInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!dragging) return;

    function onPointerMove(event: globalThis.PointerEvent) {
      setPosition({
        x: event.clientX - dragOffset.current.x,
        y: event.clientY - dragOffset.current.y,
      });
    }

    function onPointerUp() {
      setDragging(false);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [dragging, setPosition]);

  if (!mounted || view !== "open") return null;

  function onDragStart(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    setDragging(true);
    event.preventDefault();
  }

  function submitCurrent() {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitCurrent();
  }

  const panel = (
    <div
      ref={panelRef}
      className="agent-chat-widget fixed z-[80] flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/98 shadow-2xl shadow-black/80 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.8),0_0_30px_rgba(14,165,233,0.15)] backdrop-blur-xl"
      style={{
        left: position.x,
        top: position.y,
        height: "min(70vh, 520px)",
        touchAction: dragging ? "none" : "auto",
      }}
      role="dialog"
      aria-modal="false"
      aria-label={`${activeAgent.name} AI-chat`}
    >
      <div
        data-drag-handle
        onPointerDown={onDragStart}
        className={`flex cursor-grab items-center justify-between border-b border-white/15 bg-zinc-900/95 px-3.5 py-3 select-none ${
          dragging ? "cursor-grabbing" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${activeAgent.gradient} text-zinc-950 shadow-md`}
          >
            {activeAgent.id === "nova" ? (
              <Bot size={17} />
            ) : (
              <span className="text-sm font-bold">
                {activeAgent.name.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-50">
              {activeAgent.name}
            </p>
            <p className="truncate text-[11px] font-medium text-emerald-400">
              Live · {activeAgent.role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              minimize();
            }}
            aria-label="Minimaliseer naar topbar"
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
            aria-label="Sluit chat"
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-rose-300"
          >
            <X size={16} />
          </button>
          <GripHorizontal size={16} className="ml-0.5 hidden text-zinc-500 sm:block" />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 bg-zinc-950/20">
        {messages.map((message, idx) => {
          const isLatest = idx === messages.length - 1;
          return (
            <div
              key={message.id}
              className={`flex flex-col gap-1.5 ${message.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-sky-500 font-semibold text-zinc-950 shadow-md"
                    : "border border-white/15 bg-zinc-800/90 text-zinc-100 shadow-sm"
                }`}
              >
                <div className="whitespace-pre-line">{message.text}</div>
                <p
                  className={`mt-1.5 text-[10px] ${
                    message.role === "user" ? "text-sky-950/70" : "text-zinc-400"
                  }`}
                >
                  {message.time}
                </p>
              </div>

              {message.role === "agent" && message.options && message.options.length > 0 && isLatest && (
                <div className="flex flex-wrap gap-1.5 mt-1 max-w-[88%]">
                  {message.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => sendMessage(option)}
                      className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-300 hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-200 transition-all text-left"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/15 bg-zinc-800/90 px-3.5 py-2.5 text-sm text-zinc-300 shadow-sm">
              {activeAgent.name} typt…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-white/15 bg-[#18181b]/95 p-3.5"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={1}
            placeholder={`Vraag ${activeAgent.name} iets of geef een taak...`}
            className="max-h-24 min-h-[42px] flex-1 resize-none rounded-xl border border-white/15 bg-zinc-800/60 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitCurrent();
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Verstuur bericht"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500 text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
          <Sparkles size={11} className="text-sky-400" />
          Acties worden klaargezet ter goedkeuring
        </p>
      </form>
    </div>
  );

  return createPortal(panel, document.body);
}
