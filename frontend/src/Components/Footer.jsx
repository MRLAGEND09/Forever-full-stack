import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-40 text-sm'>
         
          <div>
              <img src={assets.logo} className='mb-5 w-32' alt="" />
              <p className='w-full md:w-2/3 text-gray-600'>lorem lpsum is simply dummy text of the printing and typesetting industry.
              lorem lpsum has been the industry's standard dummy text ever since the 1500s,when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p>
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

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright 2025@ forever.com -   All Right Reserved.</p>
      </div>

    </div>
  )
}

export default Footer
