import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, LoaderCircle, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import { assistantService } from '../../services/assistantService.js';
import { getApiError } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const QUICK_PROMPTS = [
  'What should I order?',
  'Show me offers',
  'Where is my order?',
  'What are the delivery fees?',
];

export function ChatWidget() {
  const { city } = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const nextId = useRef(0);

  function makeId() {
    nextId.current += 1;
    return `msg-${nextId.current}`;
  }

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    inputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi${user ? ` ${user.name.split(' ')[0]}` : ''}! I am the CRAVIO assistant. Ask me about dishes, offers, delivery fees, or your latest order.`,
          suggestions: QUICK_PROMPTS,
          actions: [],
        },
      ]);
    }
  }, [open, messages.length, user]);

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, sending, open]);

  async function send(text) {
    const question = text.trim();
    if (!question || sending) return;

    const history = messages
      .filter((message) => message.id !== 'welcome')
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [
      ...current,
      { id: makeId(), role: 'user', content: question },
    ]);
    setInput('');
    setError('');
    setLastQuestion(question);
    setSending(true);

    try {
      const data = await assistantService.chat({
        message: question,
        city: city.name,
        history,
      });

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content: data.reply,
          suggestions: data.suggestions || [],
          actions: data.actions || [],
        },
      ]);
    } catch (requestError) {
      setError(getApiError(requestError).message);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    send(input);
  }

  return (
    <>
      {open ? (
        <section
          role="dialog"
          aria-label="Cravio assistant"
          className="fixed inset-x-3 bottom-24 z-[80] flex h-[min(78vh,600px)] flex-col overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-2xl animate-fade-up sm:inset-x-auto sm:right-6 sm:w-[390px]"
        >
          <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold">Cravio Assistant</h2>
                <p className="text-[11px] text-white/80">Live menus · offers · order help</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-canvas px-3.5 py-4"
            aria-live="polite"
          >
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isLatest = index === messages.length - 1;
              const actions = (message.actions || []).filter(
                (action) => typeof action?.href === 'string' && action.href.startsWith('/')
              );

              return (
                <div
                  key={message.id}
                  className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}
                >
                  {!isUser ? (
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  ) : null}

                  <div
                    className={cn(
                      'max-w-[85%] space-y-2 rounded-2xl px-3.5 py-2.5 text-sm leading-6 whitespace-pre-line',
                      isUser
                        ? 'rounded-br-md bg-brand-500 text-white'
                        : 'rounded-bl-md border border-black/[0.05] bg-white text-ink shadow-sm'
                    )}
                  >
                    <p>{message.content}</p>

                    {actions.length ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {actions.map((action) => (
                          <Link
                            key={action.href}
                            to={action.href}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 transition hover:bg-brand-100"
                          >
                            {action.label}
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {!isUser && isLatest && !sending && message.suggestions?.length ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => send(suggestion)}
                            className="rounded-full border border-brand-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {sending ? (
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-2xl border border-black/[0.05] bg-white px-3 py-2">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Finding an answer…
                </span>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-danger/20 bg-red-50 p-3 text-xs text-danger">
                <p>{error}</p>
                {lastQuestion ? (
                  <button
                    type="button"
                    onClick={() => send(lastQuestion)}
                    className="mt-2 font-bold underline-offset-2 hover:underline"
                  >
                    Try again
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-black/[0.07] bg-white p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-1.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setError('');
                }}
                maxLength={500}
                placeholder="Ask about dishes, offers, orders…"
                aria-label="Ask the Cravio assistant"
                className="h-9 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted/70"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Send message"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-ink-muted">
              Answers use live Cravio data. For payment or refund issues, contact
              support@cravio.dev.
            </p>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Close Cravio assistant' : 'Ask the Cravio assistant'}
        className={cn(
          'fixed bottom-4 right-4 z-[80] inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand-500 text-sm font-bold text-white shadow-glow transition hover:bg-brand-600 sm:bottom-6 sm:right-6 sm:px-5',
          open ? 'w-14 px-0' : 'w-14 sm:w-auto'
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!open ? <span className="hidden sm:inline">Ask Cravio</span> : null}
      </button>
    </>
  );
}
