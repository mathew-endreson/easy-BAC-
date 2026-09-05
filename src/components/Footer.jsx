const socialLinks = [
  { label: 'Facebook', icon: '/assets/icons/social-facebook.svg' },
  { label: 'Instagram', icon: '/assets/icons/social-instagram.svg' },
  { label: 'X', icon: '/assets/icons/social-x.svg' },
  { label: 'LinkedIn', icon: '/assets/icons/social-linkedin.svg' },
  { label: 'YouTube', icon: '/assets/icons/social-youtube.svg' }
]

export default function Footer() {
  return (
    <footer className="mt-[300px] bg-footer-bg text-white font-footer py-[60px] px-20 max-[600px]:py-10 max-[600px]:px-5">
      <div className="flex justify-between gap-[60px] max-lg:flex-col max-lg:gap-10">
        <div className="max-w-[420px] max-md:w-full">
          <div className="flex items-center gap-[10px] text-[24px] font-semibold">
            <img src="/assets/icons/Full_logo.svg" alt="EzBac logo" className="h-9" />
          </div>
          <p className="my-6 leading-[1.6] text-[15px] text-white">
            Subscribe to our newsletter for the latest updates on features and releases.
          </p>
          <div className="flex gap-3 max-[600px]:flex-col">
            <input
              type="email"
              placeholder="Your email here"
              className="flex-1 py-3 px-[18px] rounded-[14px] border border-white bg-transparent text-white placeholder:text-[rgba(255,255,255,0.6)] focus:outline-none focus:border-primary"
            />
            <button className="py-3 px-6 rounded-[14px] border-0 bg-[rgba(187,24,29,0.79)] text-white cursor-pointer hover:bg-primary-strong max-[600px]:w-full">
              Subscribe
            </button>
          </div>
          <p className="mt-3 text-xs text-white">
            By subscribing, you consent to our Privacy Policy and agree to receive updates.
          </p>
        </div>

        <div className="flex gap-[67px] max-lg:flex-wrap max-lg:justify-start max-[600px]:flex-col max-[600px]:gap-[30px]">
          <div className="flex flex-col gap-4">
            <h4 className="mb-1 text-[16px] text-footer-text font-semibold">Quick Links</h4>
            <a href="#" className="foot-link no-underline text-footer-text text-sm py-1">About Us</a>
            <a href="#" className="foot-link no-underline text-footer-text text-sm py-1">Contact Us</a>
            <a href="#faq" className="foot-link no-underline text-footer-text text-sm py-1">FAQs</a>
            <a href="/admin" className="foot-link no-underline text-footer-text text-sm py-1">Admin Dashboard</a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="mb-1 text-[16px] text-footer-text font-semibold">Connect With Us</h4>
            {socialLinks.map((s) => (
              <a key={s.label} href="#" className="foot-link flex items-center gap-3 no-underline text-footer-text text-sm py-1">
                <img src={s.icon} alt="" className="w-4 h-4 opacity-70" />
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
