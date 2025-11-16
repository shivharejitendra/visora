import React from 'react'
import { assets, testimonialsData } from '../assets/assets'
import { motion } from 'framer-motion'
const Testimonial = () => {
  return (
    <motion.div
      initial={{ opacity: 0.2, y: 100 }}
      transition={{ duration: 1 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className='flex flex-col items-center justify-center my-20 p-6 md:px-28'>
      <h1 className='text-3xl sm:text-4xl font-semibold mb-2'>
        Customer testimonial
      </h1>

      <p className='text-gray-500 mb-8'>
        What our users are saying
      </p>

      <div className='flex flex-wrap gap-6'>
        {testimonialsData.map((testimonial, index) => (
          <div key={index} 
        className='bg-white/20 shadow-md rounded-lg p-6 w-80 m-auto cursor-pointer hover:scale-[1.02]
        transition-all duration-300'>
            <div className='flex flex-col items-center'>
              <img
                src={testimonial.image}
                alt=''
                className='rounded-full w-14 mb-4'
              />
              <h2 className='font-semibold text-lg'>{testimonial.name}</h2>
              <p className='text-gray-500 text-sm mb-2'>{testimonial.role}</p>

              <div className='flex mb-4'>
                {Array(testimonial.stars)
                  .fill()
                  .map((item, index) => (
                    <img
                      key={index}
                      src={assets.rating_star}
                      alt='star'
                      className='w-4 h-4'
                    />
                  ))}
              </div>

              <p className='text-center text-gray-600 text-sm '>
                "{testimonial.text}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default Testimonial
