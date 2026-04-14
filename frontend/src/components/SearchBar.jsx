import React, { useEffect, useState, useContext } from 'react'
import { assets } from '../assets/assets'
import { useLocation } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

const SearchBar = () => {
  const {
    search,
    setSearch,
    showSearch,
    setShowSearch,
    autocompleteSuggestions,
    fetchAutocompleteSuggestions,
    popularSearchTerms,
    trackSearchTerm,
    t
  } = useContext(ShopContext)
  const [visible, setVisible] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.toLowerCase().includes('collection')) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [location])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAutocompleteSuggestions(search)
    }, 250)

    return () => clearTimeout(timer)
  }, [search])

  const handleSuggestionClick = (term) => {
    setSearch(term)
    trackSearchTerm(term)
  }

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (transcript) {
        setSearch(transcript)
        trackSearchTerm(transcript)
      }
    }

    recognition.start()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      trackSearchTerm(search)
    }
  }

  return showSearch && visible ? (
    <div className='border-t border-b bg-gray-50 text-center py-2'>
      <div className='inline-flex items-center justify-center border border-gray-400 px-4 py-2 mt-2 mx-3 rounded-full w-[92%] sm:w-1/2 bg-white'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className='flex-1 outline-none bg-inherit text-sm'
          type="text"
          placeholder={t('searchPlaceholder')}
        />
        <button
          type='button'
          onClick={handleVoiceSearch}
          className={`text-xs px-2 py-1 mr-1 rounded ${isListening ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
        >
          {isListening ? 'Listening...' : 'Voice'}
        </button>
        <img className='w-4' src={assets.search_icon} alt="" />
      </div>

      {autocompleteSuggestions.length > 0 && (
        <div className='mx-auto mt-2 w-[92%] sm:w-1/2 bg-white border border-gray-200 rounded-lg text-left shadow-sm'>
          {autocompleteSuggestions.map((item, idx) => (
            <button
              type='button'
              key={`${item}-${idx}`}
              onClick={() => handleSuggestionClick(item)}
              className='block w-full px-3 py-2 text-sm hover:bg-gray-50 text-left'
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {popularSearchTerms.length > 0 && (
        <div className='mx-auto mt-3 mb-1 w-[92%] sm:w-1/2 text-left'>
          <p className='text-xs text-gray-500 mb-2'>Popular searches</p>
          <div className='flex flex-wrap gap-2'>
            {popularSearchTerms.slice(0, 6).map((item) => (
              <button
                type='button'
                key={item.term}
                onClick={() => handleSuggestionClick(item.term)}
                className='text-xs px-3 py-1 border rounded-full bg-white hover:bg-gray-100'
              >
                {item.term}
              </button>
            ))}
          </div>
        </div>
      )}

      <img
        onClick={() => setShowSearch(false)}
        className='inline w-3 cursor-pointer my-2'
        src={assets.cross_icon}
        alt=""
      />
    </div>
  ) : null
}

export default SearchBar