import React, { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'

const AIChatbot = () => {
  const { askAiAssistant, token, navigate } = useContext(ShopContext)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! I can help with product recommendations and order tracking. Try: track my latest order.'
    }
  ])

  const handleSend = async () => {
    const text = message.trim()
    if (!text) return

    if (!token) {
      navigate('/login')
      return
    }

    setMessages((prev) => [...prev, { role: 'user', text }])
    setMessage('')
    setLoading(true)

    const response = await askAiAssistant(text)

    setMessages((prev) => [...prev, { role: 'bot', text: response.reply || 'Sorry, something went wrong.' }])
    setLoading(false)
  }

  return (
    <div className='fixed z-50 bottom-5 right-5'>
      {isOpen && (
        <div className='w-[320px] sm:w-[360px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden'>
          <div className='bg-black text-white px-4 py-3 flex justify-between items-center'>
            <p className='text-sm font-medium'>AI Support</p>
            <button type='button' onClick={() => setIsOpen(false)} className='text-xs opacity-80 hover:opacity-100'>
              Close
            </button>
          </div>

          <div className='h-72 overflow-y-auto p-3 space-y-2 bg-gray-50'>
            {messages.map((item, idx) => (
              <div key={idx} className={`max-w-[85%] text-sm px-3 py-2 rounded-lg ${item.role === 'user' ? 'ml-auto bg-black text-white' : 'bg-white border border-gray-200'}`}>
                {item.text}
              </div>
            ))}
            {loading && <p className='text-xs text-gray-500'>AI is typing...</p>}
          </div>

          <div className='p-3 border-t bg-white flex gap-2'>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className='flex-1 border rounded px-3 py-2 text-sm outline-none'
              placeholder='Ask about orders, delivery, returns...'
            />
            <button type='button' onClick={handleSend} className='bg-black text-white px-3 rounded text-sm'>
              Send
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type='button'
          onClick={() => setIsOpen(true)}
          className='bg-black text-white rounded-full px-4 py-3 text-sm shadow-lg hover:bg-gray-800'
        >
          AI Chat
        </button>
      )}
    </div>
  )
}

export default AIChatbot
