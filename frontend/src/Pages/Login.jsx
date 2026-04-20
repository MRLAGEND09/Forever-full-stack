import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { auth, googleProvider, facebookProvider } from '../firebase';
import { signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { useLocation } from 'react-router-dom'
import '@fortawesome/fontawesome-free/css/all.min.css'

const LoginMethodButton = ({
  method,
  lastLoginMethod,
  showLastLogin = true,
  type = 'button',
  onClick,
  className,
  icon,
  label,
  disabled = false
}) => {
  const isLastLogin = showLastLogin && method && lastLoginMethod === method

  return (
    <div className='relative w-full'>
      <button
        type={type}
        onClick={onClick}
        className={`${className} ${isLastLogin ? 'border-gray-400/80 ring-1 ring-gray-100' : ''} transition-all duration-200`}
        disabled={disabled}
      >
        <div className='flex items-center justify-center gap-3'>
          {icon}
          <span className='text-sm font-medium truncate'>{label}</span>
        </div>
      </button>
      {isLastLogin && (
        <div className='absolute left-full top-1/2 ml-3 -translate-y-1/2'>
          <span className='inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-gray-500'>
            <span>Last login</span>
            <span className='inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-100 text-[7px] text-gray-500'>
              <i className='fas fa-arrow-right'></i>
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lastLoginMethod, setLastLoginMethod] = useState('')

  const location = useLocation();

  const persistLastLoginMethod = (method) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('last_login_method', method)
    setLastLoginMethod(method)
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (currentState === 'Verify Email') {
        const response = await axios.post(backendUrl + '/api/user/verify-email', { email, code: verificationCode })
        if (response.data.success) {
          setToken(response.data.token)
          toast.success('Email verified successfully!')
          return
        }
        toast.error(response.data.message)
        return
      }

      if (currentState === 'Sign Up') {
        const response = await axios.post(backendUrl + '/api/user/register', { name, email, password })
        if (response.data.success) {
          if (response.data.requiresVerification) {
            setCurrentState('Verify Email')
            toast.success(response.data.message || 'Please check your email for verification code.')
          } else {
            setToken(response.data.token)
          }
        } else {
          toast.error(response.data.message)
        }
      } else {
        const response = await axios.post(backendUrl + '/api/user/login', { email, password })
        if (response.data.success) {
          setToken(response.data.token)
        } else if (response.data.requiresVerification) {
          setCurrentState('Verify Email')
          toast.info(response.data.message || 'Please verify your email first.')
        } else {
          toast.error(response.data.message)
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  const handleResendVerificationCode = async () => {
    if (!email) {
      toast.error('Please enter your email first')
      return
    }
    try {
      const response = await axios.post(backendUrl + '/api/user/resend-verification', { email })
      if (response.data.success) {
        toast.success(response.data.message || 'Verification code resent')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleSocialLogin = async (provider, providerName) => {
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const response = await axios.post(backendUrl + '/api/user/social-login', {
        name: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        uid: user.uid,
        provider: providerName
      })

      if (response.data.success) {
        if (providerName === 'google' || providerName === 'facebook') {
          persistLastLoginMethod(providerName)
        }
        setToken(response.data.token)
        toast.success(`Welcome, ${user.displayName}!`)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('This email is already registered with Google. Please use Google login!')
      } else if (error.code === 'auth/cancelled-popup-request') {
        // do nothing
      } else {
        toast.error(error.code || 'Login failed')
      }
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first!')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email!')
      } else {
        toast.error('Failed to send reset email. Try again!')
      }
    }
  }

  useEffect(() => {
    const savedMethod = typeof window !== 'undefined' ? localStorage.getItem('last_login_method') : ''
    setLastLoginMethod(savedMethod || '')
  }, [])

  useEffect(() => {
    if (token) {
      const destination = location?.state?.from?.pathname || '/'
      navigate(destination, { replace: true })
    }
  }, [token, location, navigate])

  return (
    <div className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {/* Social Login Buttons */}
      <div className='w-full flex flex-col gap-3'>
        <LoginMethodButton
          method='google'
          lastLoginMethod={lastLoginMethod}
          type='button'
          onClick={() => handleSocialLogin(googleProvider, 'google')}
          className='w-full border border-gray-300 py-2.5 px-4 hover:bg-gray-50 transition'
          icon={<i className='fab fa-google text-red-500 text-lg'></i>}
          label='Continue with Google'
        />

        <LoginMethodButton
          method='facebook'
          lastLoginMethod={lastLoginMethod}
          type='button'
          onClick={() => handleSocialLogin(facebookProvider, 'facebook')}
          className='w-full bg-[#1877F2] text-white py-2.5 px-4 hover:bg-[#166FE5] transition'
          icon={<i className='fab fa-facebook text-white text-lg'></i>}
          label='Continue with Facebook'
        />

        <LoginMethodButton
          method='instagram'
          lastLoginMethod={lastLoginMethod}
          type='button'
          onClick={() => toast.info('Instagram login can be enabled after adding Instagram OAuth app keys in Firebase/Auth provider settings.')}
          className='w-full bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white py-2.5 px-4 transition'
          icon={<i className='fab fa-instagram text-white text-lg'></i>}
          label='Continue with Instagram'
        />
      </div>

      {/* Divider */}
      <div className='w-full flex items-center gap-3'>
        <hr className='flex-1 border-gray-300' />
        <span className='text-sm text-gray-400'>or</span>
        <hr className='flex-1 border-gray-300' />
      </div>

      {/* Manual Login Form */}
      <form onSubmit={onSubmitHandler} className='w-full flex flex-col gap-4'>
        {currentState === 'Sign Up' && (
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            className='w-full px-3 py-2 border border-gray-800'
            placeholder='Name'
          />
        )}
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          className='w-full px-3 py-2 border border-gray-800'
          placeholder='Email'
          required
        />
        {currentState !== 'Verify Email' ? (
          <div className='relative'>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type={showPassword ? 'text' : 'password'}
              className='w-full px-3 py-2 border border-gray-800 pr-10'
              placeholder='Password'
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-2.5 cursor-pointer text-gray-500'
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </span>
          </div>
        ) : (
          <input
            onChange={(e) => setVerificationCode(e.target.value)}
            value={verificationCode}
            type='text'
            className='w-full px-3 py-2 border border-gray-800 tracking-[0.3em]'
            placeholder='Enter 6-digit code'
            maxLength={6}
            required
          />
        )}

        <div className='w-full flex justify-between text-sm'>
          {currentState === 'Verify Email' ? (
            <>
              <p onClick={handleResendVerificationCode} className='cursor-pointer text-blue-500 hover:underline'>Resend code</p>
              <p onClick={() => setCurrentState('Login')} className='cursor-pointer'>Back to Login</p>
            </>
          ) : (
            <>
              <p
                onClick={handleForgotPassword}
                className='cursor-pointer text-blue-500 hover:underline'
              >
                Forgot password?
              </p>
              {currentState === 'Login'
                ? <p onClick={() => setCurrentState('Sign Up')} className='cursor-pointer'>Create account</p>
                : <p onClick={() => setCurrentState('Login')} className='cursor-pointer'>Login Here</p>
              }
            </>
          )}
        </div>

        <LoginMethodButton
          method='email'
          lastLoginMethod={lastLoginMethod}
          showLastLogin={false}
          type='submit'
          className='w-full bg-black text-white font-light py-2'
          icon={null}
          label={currentState === 'Login' ? 'Sign In' : currentState === 'Sign Up' ? 'Sign Up' : 'Verify Email'}
        />
      </form>
    </div>
  )
}

export default Login