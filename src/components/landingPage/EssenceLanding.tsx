import { motion, type Variants } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import React from 'react'

type EssenceItem = {
  title: string
  description: string
  imageUrl?: string
  ctaLabel?: string
  ctaHref?: string
  badge?: string
}

type EssenceLandingProps = {
  heading?: string
  subheading?: string
  highlight?: string
  cta?: {
    label: string
    href: string
  }
  items: EssenceItem[]
  className?: string
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: [0.22, 0.68, 0, 1] as const }
  })
}

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] as const } }
}

export const EssenceLanding: React.FC<EssenceLandingProps> = ({
  heading = 'Tinh hoa quê nhà',
  subheading = 'Kết nối đặc sản địa phương đến người thưởng thức bằng chuỗi cung ứng minh bạch và câu chuyện nguồn gốc rõ ràng.',
  highlight = 'Tươi mát - Nguyên bản - Bền vững',
  cta,
  items,
  className
}) => {
  const safeItems = Array.isArray(items) ? items : []

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-cyan-50 border border-emerald-100 shadow-lg',
        'px-4 py-10 sm:px-8 lg:px-12 lg:py-14',
        className
      )}
    >
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-100 blur-3xl opacity-50' />
        <div className='absolute right-0 top-10 h-48 w-48 rounded-full bg-cyan-100 blur-3xl opacity-50' />
      </div>

      <div className='relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
        <motion.div
          variants={fadeIn}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='max-w-2xl space-y-3'
        >
          <p className='text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700'>{highlight}</p>
          <h2 className='text-3xl sm:text-4xl font-bold text-emerald-900 leading-tight'>{heading}</h2>
          <p className='text-base sm:text-lg text-slate-600'>{subheading}</p>
          {cta && (
            <div className='pt-3'>
              <Button asChild variant='greenLight' className='shadow-xl shadow-emerald-200'>
                <a href={cta.href}>{cta.label}</a>
              </Button>
            </div>
          )}
        </motion.div>
        <motion.div
          variants={fadeIn}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='rounded-xl bg-white/70 backdrop-blur border border-emerald-100 px-4 py-3 text-sm text-emerald-800 shadow-sm lg:max-w-xs'
        >
          <p>
            Từ ruộng đồng đến gian bếp, mỗi sản vật đều có câu chuyện riêng. Chúng tôi chọn tông xanh tươi mát để tôn
            vinh sự trong lành của làng nghề và sự bền vững trong canh tác.
          </p>
        </motion.div>
      </div>

      <div className='relative mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {safeItems.map((item, index) => (
          <motion.article
            key={`${item.title}-${index}`}
            custom={index}
            variants={cardVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, margin: '0px 0px -40px 0px' }}
            className='group relative overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'
          >
            <div className='relative h-44 w-full overflow-hidden'>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                  loading='lazy'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-cyan-100 text-emerald-700 text-sm font-semibold'>
                  Hình ảnh đang cập nhật
                </div>
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-emerald-900/10 to-transparent' />
              {item.badge && (
                <span className='absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm'>
                  {item.badge}
                </span>
              )}
            </div>
            <div className='space-y-3 p-4'>
              <h3 className='text-lg font-semibold text-emerald-900'>{item.title}</h3>
              <p className='text-sm text-slate-600 leading-relaxed'>{item.description}</p>
              {(item.ctaHref || item.ctaLabel) && (
                <Button
                  asChild
                  variant='green'
                  className='h-10 rounded-lg px-4 font-semibold transition-transform duration-200 group-hover:scale-[1.02]'
                >
                  <a href={item.ctaHref ?? '#'}>{item.ctaLabel ?? 'Khám phá'}</a>
                </Button>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

export default EssenceLanding
