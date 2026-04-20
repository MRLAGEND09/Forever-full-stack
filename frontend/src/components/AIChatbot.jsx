import React, { useContext, useEffect, useRef, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { persistChat, readPersistedChat } from '../utils/persistedState'

const defaultMessages = [
  {
    role: 'bot',
    text: 'Hi, I\'m BLOOP AI. How can I assist you?'
  }
]

const AIChatbot = () => {
  const { askAiAssistant, getAiSupportStatus, getActiveSupportChat, token, navigate } = useContext(ShopContext)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockText, setLockText] = useState('')
  const [messages, setMessages] = useState(defaultMessages)
  const latestTicketIdRef = useRef('')

  const appendBotMessage = (text) => {
    if (!text) return
    setMessages((prev) => [...prev, { role: 'bot', text }])
  }

  const resetChatIfNoActiveTicket = () => {
    latestTicketIdRef.current = ''
    setMessages(defaultMessages)
  }

  const applyStoredChat = () => {
    const fallbackChat = readPersistedChat(defaultMessages)
    latestTicketIdRef.current = fallbackChat.ticketId
    setMessages(fallbackChat.messages)
    setIsLocked(fallbackChat.isLocked)
    setLockText(fallbackChat.lockText)
  }

  const syncStatus = async () => {
    if (!token) return

    const [statusResponse, chatResponse] = await Promise.all([getAiSupportStatus(), getActiveSupportChat()])
    if (!statusResponse?.success && !chatResponse?.success) {
      applyStoredChat()
      return
    }

    const status = statusResponse?.status || chatResponse?.status || 'done'
    const activeMessages = Array.isArray(chatResponse?.messages) ? chatResponse.messages : []
    const ticketId = chatResponse?.ticket?.id || ''
    const hasActiveTicket = Boolean(ticketId && activeMessages.length)

    if (status === 'pending_admin') {
      setIsLocked(true)
      setLockText('⏳ Your complaint is with our support team. Please wait for the admin reply.')
      latestTicketIdRef.current = ticketId
      if (activeMessages.length) {
        setMessages(activeMessages.map((item, idx) => ({
          role: item.sender === 'user' ? 'user' : 'bot',
          text: item.text,
          id: `${ticketId}-${idx}`
        })))
      }
      return
    }

    if (status === 'resolved' || (latestTicketIdRef.current && !hasActiveTicket)) {
      setIsLocked(false)
      setLockText('')
      resetChatIfNoActiveTicket()
      return
    }

    setIsLocked(false)
    setLockText('')

    if (!chatResponse?.ticket && !latestTicketIdRef.current && messages.length === 0) {
      setMessages(defaultMessages)
    }
  }

  useEffect(() => {
    if (!isOpen || !token) return

    syncStatus()
    const interval = setInterval(syncStatus, 7000)
    return () => clearInterval(interval)
  }, [isOpen, token])

  useEffect(() => {
    persistChat({
      messages,
      isLocked,
      lockText,
      ticketId: latestTicketIdRef.current
    })
  }, [messages, isLocked, lockText])

  useEffect(() => {
    if (token) return
    latestTicketIdRef.current = ''
    setIsLocked(false)
    setLockText('')
    setMessages(defaultMessages)
  }, [token])

  const handleOpen = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    setIsOpen(true)
    await syncStatus()
  }

  const handleSend = async () => {
    const text = message.trim()
    if (!text || loading || isLocked) return

    setMessages((prev) => [...prev, { role: 'user', text }])
    setMessage('')
    setLoading(true)

    const response = await askAiAssistant(text)
    const reply = response?.reply || response?.message || 'Sorry, something went wrong.'
    appendBotMessage(reply)

    if (response?.status === 'pending_admin') {
      setIsLocked(true)
      setLockText('⏳ Your complaint is with our support team. Please wait for the admin reply.')
      await syncStatus()
    } else if (response?.status === 'resolved') {
      setIsLocked(false)
      setLockText('')
    }

    setLoading(false)
  }

  return (
    <div className='fixed z-50 bottom-5 right-5'>
      {isOpen && (
        <div className='w-[320px] sm:w-[380px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden'>
          <div className='bg-black text-white px-4 py-3 flex justify-between items-center'>
            <div>
              <p className='text-sm font-semibold tracking-wide'>BLOOP AI</p>
              <p className='text-[11px] opacity-80'>Stylist + Support</p>
            </div>
            <button type='button' onClick={() => setIsOpen(false)} className='text-xs opacity-80 hover:opacity-100'>
              Close
            </button>
          </div>

          <div className='h-80 overflow-y-auto p-3 space-y-2 bg-gray-50'>
            {messages.map((item, idx) => (
              <div
                key={`${item.role}-${idx}`}
                className={`max-w-[88%] text-sm px-3 py-2 rounded-xl whitespace-pre-line ${item.role === 'user' ? 'ml-auto bg-black text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
              >
                {item.text}
              </div>
            ))}

            {loading && <p className='text-xs text-gray-500'>BLOOP AI is preparing your reply...</p>}
          </div>

          {isLocked && (
            <div className='px-3 py-2 text-xs bg-amber-50 text-amber-700 border-t border-amber-100'>
              {lockText || '⏳ Your complaint is with our support team. Please wait for the admin reply.'}
            </div>
          )}

          <div className='p-3 border-t bg-white flex gap-2'>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className='flex-1 border rounded-lg px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed'
              placeholder='Ask for styling tips or support help...'
              disabled={isLocked || loading}
            />
            <button
              type='button'
              onClick={handleSend}
              className='bg-black text-white px-3 rounded-lg text-sm disabled:opacity-50'
              disabled={isLocked || loading}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type='button'
          onClick={handleOpen}
          className='bg-black text-white rounded-full px-4 py-3 text-sm shadow-lg hover:bg-gray-800'
        >
        BLOOP AI
        </button>
      )}
    </div>
  )
}

export default AIChatbot
