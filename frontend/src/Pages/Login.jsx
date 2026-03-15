import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { auth, googleProvider, facebookProvider } from '../firebase';
import { signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import '@fortawesome/fontawesome-free/css/all.min.css'

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (currentState === 'Sign Up') {
        const response = await axios.post(backendUrl + '/api/user/register', { name, email, password })
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
        } else {
          toast.error(response.data.message)
        }
      } else {
        const response = await axios.post(backendUrl + '/api/user/login', { email, password })
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
        } else {
          toast.error(response.data.message)
        }
      }
    } catch (error) {
      console.log(error);
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
        setToken(response.data.token)
        localStorage.setItem('token', response.data.token)
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
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <div className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {/* Social Login Buttons */}
      <div className='w-full flex flex-col gap-3'>
        <button
          type='button'
          onClick={() => handleSocialLogin(googleProvider, 'google')}
          className='w-full flex items-center justify-center gap-3 border border-gray-300 py-2.5 px-4 hover:bg-gray-50 transition'
        >
          <i className='fab fa-google text-red-500 text-lg'></i>
          <span className='text-sm font-medium'>Continue with Google</span>
        </button>

        <button
          type='button'
          onClick={() => handleSocialLogin(facebookProvider, 'facebook')}
          className='w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-2.5 px-4 hover:bg-[#166FE5] transition'
        >
          <i className='fab fa-facebook text-white text-lg'></i>
          <span className='text-sm font-medium'>Continue with Facebook</span>
        </button>
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

        <div className='w-full flex justify-between text-sm'>
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
        </div>

        <button className='w-full bg-black text-white font-light py-2'>
          {currentState === 'Login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}

export default Login