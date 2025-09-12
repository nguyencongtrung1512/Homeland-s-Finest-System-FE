import React from 'react'

interface SocialIcon {
  src: string
  alt: string
  href?: string
  className: string
}

interface FooterSocialProps {
  title: string
  socialIcons: SocialIcon[]
}

const FooterSocial: React.FC<FooterSocialProps> = ({ title, socialIcons }) => {
  return (
    <section className='flex flex-col pb-12 mx-auto w-full bg-lime-900 bg-opacity-0 max-md:mt-8'>
      <h3 className='self-start text-base text-white'>{title}</h3>
      <div className='flex gap-4 pr-14 mt-7 bg-lime-900 bg-opacity-0 max-md:pr-5'>
        {socialIcons.map((icon, index) =>
          icon.href ? (
            <a key={index} href={icon.href} className='hover:opacity-80 transition-opacity' aria-label={icon.alt}>
              <img src={icon.src} alt={icon.alt} className={icon.className} />
            </a>
          ) : (
            <img key={index} src={icon.src} alt={icon.alt} className={icon.className} />
          )
        )}
      </div>
    </section>
  )
}

export default FooterSocial
