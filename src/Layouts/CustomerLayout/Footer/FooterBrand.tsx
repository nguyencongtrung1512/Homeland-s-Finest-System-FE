import React from 'react'

interface FooterBrandProps {
  logo?: React.ReactNode
  brandName: string
  tagline: string
}

const FooterBrand: React.FC<FooterBrandProps> = ({ logo, brandName, tagline }) => {
  return (
    <section className='pb-8 mx-auto w-full text-gray-300 bg-lime-900 bg-opacity-0 max-md:mt-8'>
      <div className='flex gap-2 text-2xl font-bold bg-lime-900 bg-opacity-0 items-center'>
        {logo}
        <h2 className='flex-auto w-[249px]'>{brandName}</h2>
      </div>
      <p className='mt-4 text-base leading-6 w-[260px]'>{tagline}</p>
    </section>
  )
}

export default FooterBrand
