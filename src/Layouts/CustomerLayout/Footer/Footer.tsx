import { Facebook, Instagram, Twitter } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'
import path from '../../../constants/path'

// Interfaces
interface FooterNavItem {
  label: string
  href?: string
}

interface SocialIcon {
  src: React.ReactNode
  alt: string
  href?: string
  className: string
}

interface FooterBrandProps {
  logo?: React.ReactNode
  brandName: string
  tagline: string
}

interface FooterNavColumnProps {
  title: string
  items: FooterNavItem[]
}

interface FooterSocialProps {
  title: string
  socialIcons: SocialIcon[]
}

// FooterBrand Component
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

// FooterNavColumn Component
const FooterNavColumn: React.FC<FooterNavColumnProps> = ({ title, items }) => {
  // Check if href is an internal route (starts with /)
  const isInternalRoute = (href?: string) => {
    return href && href.startsWith('/') && !href.startsWith('http')
  }

  return (
    <nav className='flex flex-col grow w-full bg-lime-900 bg-opacity-0 max-md:mt-8'>
      <h3 className='self-start text-base text-white'>{title}</h3>
      <ul className='mt-6 text-sm leading-none text-gray-300 bg-lime-900 bg-opacity-0'>
        {items.map((item, index) => (
          <li
            key={index}
            className='flex flex-col justify-center items-start py-1 mt-2 first:mt-0 bg-lime-900 bg-opacity-0 max-md:pr-5'
          >
            {item.href ? (
              isInternalRoute(item.href) ? (
                <Link to={item.href} className='hover:text-white transition-colors'>
                  {item.label}
                </Link>
              ) : (
                <a href={item.href} className='hover:text-white transition-colors'>
                  {item.label}
                </a>
              )
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

// FooterSocial Component
const FooterSocial: React.FC<FooterSocialProps> = ({ title, socialIcons }) => {
  return (
    <section className='flex flex-col pb-12 mx-auto w-full bg-lime-900 bg-opacity-0 max-md:mt-8'>
      <h3 className='self-start text-base text-white'>{title}</h3>
      <div className='flex gap-4 pr-10 mt-5 bg-lime-900 bg-opacity-0 max-md:pr-3'>
        {socialIcons.map((icon, index) =>
          icon.href ? (
            <a
              key={index}
              href={icon.href}
              target='_blank'
              rel='noopener noreferrer'
              className='hover:opacity-80 transition-opacity cursor-pointer'
              aria-label={icon.alt}
            >
              {icon.src}
            </a>
          ) : (
            <div key={index} className={icon.className}>
              {icon.src}
            </div>
          )
        )}
      </div>
    </section>
  )
}

// Main Footer Component
const Footer: React.FC = () => {
  const productItems = [{ label: 'Nông sản' }, { label: 'Đặc sản' }, { label: 'Thủ công mỹ nghệ' }]

  const supportItems = [{ label: 'Liên hệ' }, { label: 'Chính sách', href: path.portal }, { label: 'Hướng dẫn' }]

  const socialIcons = [
    {
      src: <Facebook className='text-orange-300' />,
      alt: 'Facebook',
      href: 'https://facebook.com/tinhhoaquenha',
      className: 'w-4 h-4'
    },
    {
      src: <Instagram className='text-orange-300' />,
      alt: 'Instagram',
      href: 'https://instagram.com/tinhhoaquenha',
      className: 'w-4 h-4'
    },
    {
      src: <Twitter className='text-orange-300' />,
      alt: 'Twitter',
      href: 'https://twitter.com/tinhhoaquenha',
      className: 'w-4 h-4'
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
                    <path
                      d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                      fill='#F4A261'
                    />
                  </svg>
                }
                brandName='Tinh Hoa Quê Nhà'
                tagline='Kết nối tinh hoa đặc sản Vùng miền Việt Nam với mọi nhà'
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
          <p>© 2025 Tinh Hoa Quê Nhà. All rights reserved.</p>
        </section>
      </div>
    </footer>
  )
}

export default Footer
