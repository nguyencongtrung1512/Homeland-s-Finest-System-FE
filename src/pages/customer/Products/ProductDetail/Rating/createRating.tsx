interface Review {
  id: string
  userName: string
  rating: number
  date: string
  comment: string
  images: string[]
  storeReply?: string
}

export const ReviewsSection: React.FC = () => {
  const overallRating = 4.9
  const totalReviews = 47

  const ratingBreakdown = [
    { stars: 5, count: 40 },
    { stars: 4, count: 7 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 }
  ]

  const reviews: Review[] = [
    {
      id: '1',
      userName: 'Nguyễn Thị Lan',
      rating: 5,
      date: '15/12/2024',
      comment:
        'Mật ong rất ngon, vị ngọt tự nhiên, không bị pha trộn. Đóng gói cẩn thận, giao hàng nhanh. Gia đình tôi rất hài lòng với sản phẩm này.',
      images: [
        'https://api.builder.io/api/v1/image/assets/TEMP/cfc75921499730bb21c7e8a1e53252b4da209d0e?width=117',
        'https://api.builder.io/api/v1/image/assets/TEMP/141990ccad8b2096589cfaacbf4352c7a255c955?width=117',
        'https://api.builder.io/api/v1/image/assets/TEMP/4768472abb688f3c7181151f52ea8c7c3c25fdbf?width=117'
      ],
      storeReply: 'Cảm ơn chị đã tin tưởng sản phẩm. Chúng tôi cam kết chất lượng 100% tự nhiên!'
    }
  ]

  const getProgressWidth = (count: number) => {
    return (count / totalReviews) * 100
  }

  return (
    <section className='flex w-[1248px] h-[660px] flex-col justify-center items-start shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-white mx-24 my-8 rounded-lg max-md:w-full max-md:mx-0 max-md:my-8'>
      <header className='flex w-[1248px] flex-col justify-center items-start gap-[23px] p-6 border-b border-solid'>
        <h2 className='text-black text-2xl font-bold leading-8 max-sm:text-xl max-sm:leading-7'>Đánh giá sản phẩm</h2>
        <div className='flex w-[1200px] h-[104px] items-center'>
          <div className='w-[584px] h-[104px]'>
            <div className='flex w-[584px] items-center mb-[9px]'>
              <span className='text-green-600 text-center text-4xl font-bold max-sm:text-[28px]'>{overallRating}</span>
            </div>
            <div className='flex w-[584px] items-start mb-3.5'>
              {/* <StarRating rating={overallRating} size='md' /> */}
            </div>
            <div className='flex w-[584px] items-center mb-3.5'>
              <span className='text-gray-600 text-center text-base font-normal'>{totalReviews} đánh giá</span>
            </div>
            <div className='flex w-[584px] flex-col items-start gap-2 ml-32 max-sm:w-full'>
              {ratingBreakdown.map((item) => (
                <div
                  key={item.stars}
                  className='flex w-[584px] h-5 justify-center items-center gap-[11.5px] max-sm:w-full max-sm:gap-2'
                >
                  <span className='text-black text-sm font-normal leading-5 w-[39px]'>{item.stars} sao</span>
                  <div className='flex w-[503px] h-2 items-center relative bg-gray-200 rounded-full max-sm:w-[200px]'>
                    <div
                      className='h-2 bg-green-500 rounded-full transition-all duration-300'
                      style={{ width: `${getProgressWidth(item.count)}%` }}
                    />
                  </div>
                  <span className='text-gray-600 text-sm font-normal leading-5 w-[19px] text-right'>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className='flex w-[1248px] h-[451px] flex-col justify-center items-start gap-6 p-6'>
        {reviews.map((review) => (
          <article
            key={review.id}
            className='flex h-[232px] justify-center items-center w-[1200px] pb-[25px] border-b border-solid'
          >
            <div className='flex w-[1200px] h-[207px] justify-center items-start gap-4 max-sm:flex-col max-sm:gap-3'>
              <img
                src='https://api.builder.io/api/v1/image/assets/TEMP/a0ce26bd7989709ff243eee9c9b44474ca38867f?width=96'
                alt={`${review.userName} avatar`}
                className='w-12 h-12 rounded-full max-sm:self-start'
              />
              <div className='w-[1136px] h-[207px] max-sm:w-full'>
                <div className='w-[1136px] h-6 flex items-center gap-4 mb-2 max-sm:flex-wrap max-sm:gap-2'>
                  <h3 className='text-black text-base font-normal leading-6'>{review.userName}</h3>
                  {/* <StarRating rating={review.rating} size='sm' /> */}
                  <time className='text-gray-500 text-sm font-normal leading-5'>{review.date}</time>
                </div>
                <p className='text-gray-700 text-base font-normal leading-6 mb-3'>{review.comment}</p>
                {review.images.length > 0 && (
                  <div className='flex w-48 h-[59px] justify-center items-start gap-2 mb-3 max-sm:w-full max-sm:justify-start'>
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className='w-[59px] h-[59px] object-cover rounded-lg'
                      />
                    ))}
                  </div>
                )}
                {review.storeReply && (
                  <div className='flex w-[1136px] h-[68px] flex-col justify-center items-start gap-1 bg-green-50 p-3 rounded-lg max-sm:w-full'>
                    <div className='flex w-full h-5 items-start gap-2'>
                      <svg
                        width='16'
                        height='15'
                        viewBox='0 0 16 15'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='fill-green-600'
                      >
                        <g clipPath='url(#clip0_45_226)'>
                          <path
                            d='M14.9733 3.26016L13.4065 0.780078C13.267 0.558594 13.0182 0.421875 12.7529 0.421875H2.99669C2.73146 0.421875 2.48263 0.558594 2.34318 0.780078L0.773646 3.26016C-0.0357294 4.53984 0.680677 6.31992 2.19279 6.525C2.30216 6.53867 2.41427 6.54688 2.52365 6.54688C3.23732 6.54688 3.87169 6.23516 4.30646 5.75391C4.74122 6.23516 5.3756 6.54688 6.08927 6.54688C6.80294 6.54688 7.43732 6.23516 7.87208 5.75391C8.30685 6.23516 8.94122 6.54688 9.6549 6.54688C10.3713 6.54688 11.0029 6.23516 11.4377 5.75391C11.8752 6.23516 12.5068 6.54688 13.2205 6.54688C13.3326 6.54688 13.442 6.53867 13.5514 6.525C15.069 6.32266 15.7881 4.54258 14.976 3.26016H14.9733ZM13.6635 7.3918H13.6608C13.5158 7.41094 13.3682 7.42188 13.2178 7.42188C12.8787 7.42188 12.5533 7.36992 12.2498 7.27695V10.9219H3.49982V7.27422C3.19357 7.36992 2.86544 7.42188 2.52638 7.42188C2.37599 7.42188 2.2256 7.41094 2.08068 7.3918H2.07794C1.96583 7.37539 1.85646 7.35625 1.74982 7.32891V10.9219V12.6719C1.74982 13.6371 2.53458 14.4219 3.49982 14.4219H12.2498C13.2151 14.4219 13.9998 13.6371 13.9998 12.6719V10.9219V7.32891C13.8904 7.35625 13.7811 7.37812 13.6635 7.3918Z'
                            fill='#16A34A'
                          />
                        </g>
                        <defs>
                          <clipPath id='clip0_45_226'>
                            <path d='M0 0.421875H15.75V14.4219H0V0.421875Z' fill='white' />
                          </clipPath>
                        </defs>
                      </svg>
                      <span className='text-green-700 text-sm font-normal leading-5'>Phản hồi từ cửa hàng</span>
                    </div>
                    <p className='text-green-700 text-sm font-normal'>{review.storeReply}</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
