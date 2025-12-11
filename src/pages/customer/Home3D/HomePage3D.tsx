import NextJsHomepageIframe from '../../../components/3D/NextJsHomepageIframe'

function HomePage3D() {
  return (
    <div className="min-h-screen">
      <NextJsHomepageIframe
        src={import.meta.env.VITE_NEXTJS_HOMEPAGE_URL || 'https://homeland-finest-homepage.vercel.app'}
        height="100vh"
        autoResize={true}
      />
    </div>
  )
}

export default HomePage3D