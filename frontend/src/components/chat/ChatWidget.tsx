import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { toast } from "sonner"
import api from "../../api/client"
import { formatCurrency } from "../../lib/format"
import MarkdownContent from "./MarkdownContent"

interface ChatProduct {
  id: number
  name: string
  slug: string
  price: number
  sale_price: number | null
  image_url: string | null
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  products?: ChatProduct[]
}

interface ChatResponse {
  reply: string
  products: ChatProduct[]
}

const STORAGE_KEY = "phin-bean-chat"
const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "Xin chào! Mình là trợ lý Phin & Bean. Bạn đang tìm hương vị cà phê nào?",
}
const SUGGESTIONS = [
  "Cà phê nào ít đắng?",
  "Quà tặng dưới 300k",
  "Cách pha phin ngon?",
]

function readHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [GREETING]
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return [GREETING]
    const parsed: unknown = JSON.parse(saved)
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (item): item is ChatMessage =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          typeof item.id === "string" &&
          "role" in item &&
          (item.role === "user" || item.role === "assistant") &&
          "content" in item &&
          typeof item.content === "string"
      )
    ) {
      return parsed.length > 0 ? parsed : [GREETING]
    }
  } catch {
    toast.error("Không thể khôi phục lịch sử trò chuyện.")
  }
  return [GREETING]
}

function saveHistory(messages: ChatMessage[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
  } catch {
    toast.error("Không thể lưu lịch sử trò chuyện trong phiên này.")
  }
}

function newMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: `${Date.now()}-${Math.random()}`, role, content }
}

export default function ChatWidget() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(readHistory)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending, isOpen])

  if (location.pathname.startsWith("/admin")) return null

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim()
    if (!message || isSending) return

    const userMessage = newMessage("user", message)
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    saveHistory(updatedMessages)
    setInput("")
    setIsSending(true)

    try {
      const response = await api.post<ChatResponse>("/api/chat", {
        message,
        history: messages
          .filter((item) => item.id !== "greeting")
          .slice(-10)
          .map(({ role, content }) => ({ role, content })),
      })
      const assistantMessage: ChatMessage = {
        ...newMessage("assistant", response.data.reply),
        products: response.data.products,
      }
      const withReply = [...updatedMessages, assistantMessage]
      setMessages(withReply)
      saveHistory(withReply)
    } catch (error: unknown) {
      const isRateLimited =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response &&
        error.response.status === 429
      const reply = isRateLimited
        ? "Bạn nhắn hơi nhanh, đợi chút nhé."
        : "Mình chưa thể trả lời lúc này. Bạn thử lại sau một chút nhé."
      const withError = [...updatedMessages, newMessage("assistant", reply)]
      setMessages(withError)
      saveHistory(withError)
      if (isRateLimited) {
        toast.error(reply)
      } else {
        toast.error("Không thể kết nối với trợ lý Phin & Bean.")
      }
    } finally {
      setIsSending(false)
    }
  }

  const submitMessage = () => {
    void sendMessage(input)
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label="Trợ lý Phin & Bean"
          className="ui-chat-window fixed inset-0 z-[60] flex h-[100dvh] flex-col overflow-hidden bg-background shadow-2xl md:inset-auto md:bottom-24 md:right-6 md:h-[min(560px,calc(100dvh-7rem))] md:w-[380px] md:rounded-2xl md:border md:border-border"
        >
          <header className="flex shrink-0 items-center justify-between bg-primary px-4 py-3.5 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Bot aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Trợ lý Phin &amp; Bean</h2>
                <p className="mt-0.5 text-xs text-white/75">Tư vấn cà phê cùng bạn</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng cửa sổ trò chuyện"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </header>

          <div
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto bg-[#FAF7F2] px-4 py-5"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border/80 bg-white text-foreground"
                  }`}
                >
                  <MarkdownContent content={message.content} />
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <Link
                          key={product.id}
                          to={`/products/${product.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 rounded-xl border border-border bg-background p-2 transition-colors hover:border-primary/40 hover:bg-secondary/50"
                        >
                          <img
                            src={product.image_url ?? "/placeholder.svg"}
                            alt={product.name}
                            className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            onError={(event) => {
                              event.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                          <span className="min-w-0">
                            <span className="block line-clamp-2 text-xs font-medium leading-5 text-foreground">
                              {product.name}
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-primary">
                              {formatCurrency(product.sale_price ?? product.price)}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && messages[0].id === "greeting" && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-full border border-primary/25 bg-white px-3 py-2 text-left text-xs font-medium text-primary transition-colors hover:bg-secondary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {isSending && (
              <div className="flex justify-start">
                <div
                  aria-label="Trợ lý đang gõ"
                  className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-white px-4 py-3"
                >
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          <form
            className="flex shrink-0 items-end gap-2 border-t border-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onSubmit={(event) => {
              event.preventDefault()
              submitMessage()
            }}
          >
            <label className="sr-only" htmlFor="chat-message">
              Nhập câu hỏi
            </label>
            <textarea
              id="chat-message"
              rows={1}
              maxLength={500}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  submitMessage()
                }
              }}
              placeholder="Hỏi mình về cà phê nhé..."
              className="max-h-24 min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-5 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex flex-col items-center gap-1">
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Gửi tin nhắn"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? (
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <Send aria-hidden="true" className="h-4 w-4" />
                )}
              </button>
              <span className="text-[10px] text-muted-foreground">{input.length}/500</span>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Đóng trợ lý chat" : "Mở trợ lý chat"}
        className={`fixed bottom-20 right-4 z-[59] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-6 md:right-6 ${
          isOpen ? "hidden" : "animate-[pulse_2.5s_ease-in-out_infinite]"
        }`}
      >
        <MessageCircle aria-hidden="true" className="h-6 w-6" />
      </button>
    </>
  )
}
