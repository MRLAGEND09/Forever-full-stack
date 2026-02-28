import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-40 text-sm'>

        <div>
          <img src={assets.logo} className='mb-5 w-32' alt="" />
          <p className='w-full md:w-2/3 text-gray-600'>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
            when an unknown printer took a galley of type and scrambled it to make a type specimen book.
          </p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>COMPANY</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li>Home</li>
            <li>About</li>
            <li>Delivery</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li>+1-212-456-7890</li>
            <li>contact@foreveryou.com</li>
          </ul>
        </div>

      </div>

      {/* Social Media Icons */}
      <div className='flex justify-center gap-5 mb-6'>
        <a href="https://facebook.com/profile.php?id=61554214816293" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-facebook-f text-xl text-gray-600 hover:text-blue-600"></i>
        </a>
        <a href="https://twitter.com/mrlagend09" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-twitter text-xl text-gray-600 hover:text-blue-400"></i>
        </a>
        <a href="https://instagram.com/saieem297/?hl=en" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-instagram text-xl text-gray-600 hover:text-pink-500"></i>
        </a>
        <a href="https://linkedin.com/in/irfan-ahmed-416591307" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-linkedin-in text-xl text-gray-600 hover:text-blue-800"></i>
        </a>
        <a href="https://github.com/MRLAGEND09" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-github text-xl text-gray-600 hover:text-black"></i>
        </a>
      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>
          Copyright 2025@ forever.com - All Right Reserved.
        </p>
      </div>

    </div>
  )
}

export default Footer