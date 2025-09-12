import React from 'react'
import FooterBrand from './FooterBrand'
import FooterNavColumn from './FooterNavColumn'
import FooterSocial from './FooterSocial'

const Footer: React.FC = () => {
  const productItems = [{ label: 'Nông sản' }, { label: 'Đặc sản' }, { label: 'Thủ công mỹ nghệ' }]

  const supportItems = [{ label: 'Liên hệ' }, { label: 'Chính sách' }, { label: 'Hướng dẫn' }]

  const socialIcons = [
    {
      src: 'https://api.builder.io/api/v1/image/assets/9932d9fef19b42818562293c1777e31a/6b03769196e456662b85a9d37e98bad466e7a9f3?placeholderIfAbsent=true',
      alt: 'Social media icon 1',
      className: 'object-contain shrink-0 aspect-[0.64] w-[18px]'
    },
    {
      src: 'https://api.builder.io/api/v1/image/assets/9932d9fef19b42818562293c1777e31a/f834eca026285368430590e14365d1ca551f9d17?placeholderIfAbsent=true',
      alt: 'Social media icon 2',
      className: 'object-contain shrink-0 w-4 aspect-[0.57]'
    },
    {
      src: 'https://api.builder.io/api/v1/image/assets/9932d9fef19b42818562293c1777e31a/0954fa1084981768c3e936a3754baea717b4dbf6?placeholderIfAbsent=true',
      alt: 'Social media icon 3',
      className: 'object-contain shrink-0 aspect-[0.64] w-[18px]'
    }
  ]

  return (
    <footer className='px-20 bg-lime-900 max-md:px-5'>
      <div className='px-8 py-12 w-full bg-lime-900 max-md:px-5 max-md:max-w-full'>
        <div className='bg-lime-900 bg-opacity-0 max-md:max-w-full'>
          <div className='flex gap-5 max-md:flex-col'>
            <div className='w-3/12 max-md:ml-0 max-md:w-full'>
              <FooterBrand
                logo={
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='28'
                    height='28'
                    viewBox='0 0 24 24'
                    fill='none'
                    className='shrink-0'
                  >
                    <path d='M24 24H0V0H24V24Z' stroke='#2D5016' />
                    <path
                      d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                      fill='#F4A261'
                    />
                  </svg>
                }
                brandName='Tinh Hoa Quê Nhà'
                tagline='Kết nối tinh hoa đặc sản Việt Nam với thế giới'
              />
            </div>

            <div className='ml-5 w-3/12 max-md:ml-0 max-md:w-full'>
              <FooterNavColumn title='Sản phẩm' items={productItems} />
            </div>

            <div className='ml-5 w-3/12 max-md:ml-0 max-md:w-full'>
              <FooterNavColumn title='Hỗ trợ' items={supportItems} />
            </div>

            <div className='ml-5 w-3/12 max-md:ml-0 max-md:w-full'>
              <FooterSocial title='Liên hệ' socialIcons={socialIcons} />
            </div>
          </div>
        </div>

        <section className='flex flex-col items-center px-16 pt-8 pb-2 mt-8 text-sm leading-none text-center text-gray-400 bg-lime-900 bg-opacity-0 max-md:px-5 max-md:max-w-full'>
          <p>© 2024 GrainHeart. All rights reserved.</p>
        </section>
      </div>
    </footer>
  )
}

export default Footer
