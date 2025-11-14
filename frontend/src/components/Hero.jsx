import React from 'react'
import { assets } from '../assets/assets'
import Carousel from './Carousel/Carousel'

const Hero = () => {
  return (

    <Carousel>
       <div className='flex flex-col sm:flex-row border border-gray-400'>
        {/* Hero Left Side */}
        <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
              <div className='text-[#414141]'>
                  <div className='flex items-center gap-2'>
                      <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                      <p className=' font-medium text-sm md:text-base'>THIS IS FOR</p>
                  </div>
                  <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed'>Educational Purposes</h1>
                  <div className='flex items-center gap-2'>
                      <p className='font-semibold text-sm md:text-base'>ONLY</p>
                      <p className='w-8 md:w-11 h-[1px] bg-[#414141]'></p>
                  </div>
              </div>
        </div>
        {/* Hero Right Side - VIDEO (FIXED) */}
        <video 
            className='w-full sm:w-1/2 h-full object-cover object-center' 
            src='https://res.cloudinary.com/dnajgzzsl/video/upload/v1761492896/Banners_r8tyev.mp4' 
            autoPlay 
            loop 
            muted
            playsInline
        >
            Your browser does not support the video tag.
        </video>
      </div>

       <div className='flex flex-col sm:flex-row border border-gray-400'>
        {/* Hero Left Side */}
        <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
              <div className='text-[#414141]'>
                  <div className='flex items-center gap-2'>
                      <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                      <p className=' font-medium text-sm md:text-base'>THIS IS FOR</p>
                  </div>
                  <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed'>Educational Purposes</h1>
                  <div className='flex items-center gap-2'>
                      <p className='font-semibold text-sm md:text-base'>ONLY</p>
                      <p className='w-8 md:w-11 h-[1px] bg-[#414141]'></p>
                  </div>
              </div>
        </div>
        {/* Hero Right Side - VIDEO (FIXED) */}
        <video 
            className='w-full sm:w-1/2 h-full object-cover object-center' 
            src='https://res.cloudinary.com/dnajgzzsl/video/upload/v1761492930/video1_j3irmq.mp4' 
            autoPlay 
            loop 
            muted
            playsInline
        >
            Your browser does not support the video tag.
        </video>
      </div>
      
      <div className='flex flex-col sm:flex-row border border-gray-400'>
        {/* Hero Left Side */}
        <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
              <div className='text-[#414141]'>
                  <div className='flex items-center gap-2'>
                      <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                      <p className=' font-medium text-sm md:text-base'>THIS IS FOR</p>
                  </div>
                  <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed'>Educational Purposes</h1>
                  <div className='flex items-center gap-2'>
                      <p className='font-semibold text-sm md:text-base'>ONLY</p>
                      <p className='w-8 md:w-11 h-[1px] bg-[#414141]'></p>
                  </div>
              </div>
        </div>
        {/* Hero Right Side - Image */}
        <img className='w-full sm:w-1/2 h-full object-cover object-center' src='https://res.cloudinary.com/dnajgzzsl/image/upload/v1761492180/hero_img1_d5dt6k.png' alt="" />
      </div>

      <div className='flex flex-col sm:flex-row border border-gray-400'>
        {/* Hero Left Side */}
        <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
              <div className='text-[#414141]'>
                  <div className='flex items-center gap-2'>
                      <p className='w-8 md:w-11 h-[2px] bg-[#414141]'></p>
                      <p className=' font-medium text-sm md:text-base'>THIS IS FOR</p>
                  </div>
                  <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed'>Educational Purposes</h1>
                  <div className='flex items-center gap-2'>
                      <p className='font-semibold text-sm md:text-base'>ONLY</p>
                      <p className='w-8 md:w-11 h-[1px] bg-[#414141]'></p>
                  </div>
              </div>
        </div>
        {/* Hero Right Side - Image */}
        <img className='w-full sm:w-1/2 h-full object-cover object-center' src='https://res.cloudinary.com/dnajgzzsl/image/upload/v1761492180/hero_img2_yv99of.png' alt="" />
      </div>

    </Carousel>
  )
}

export default Hero