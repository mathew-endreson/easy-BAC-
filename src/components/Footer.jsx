export default function Footer() {
  return (
    <footer className="mt-[300px] bg-footer-bg text-footer-text py-[60px] px-20 max-[600px]:py-[40px] max-[600px]:px-5">
      <div className="flex justify-between gap-[60px] max-lg:flex-col max-lg:gap-10">
        <div className="max-w-[420px] max-md:w-full">
          <div className="flex items-center gap-[10px] text-[24px] font-semibold">
            <img src="/assets/icons/Full_logo.svg" alt="EzBac logo" />
          </div>
          <p className="my-6 leading-[1.6]">
            Subscribe to our newsletter for the latest updates on features and releases.
          </p>
          <div className="flex gap-3 max-[600px]:flex-col">
            <input
              type="email"
              placeholder="Your email here"
              className="flex-1 py-3.5 px-[18px] rounded-[30px] border border-white bg-transparent text-white placeholder:text-[#ccc] focus:outline-none focus:border-[#C21D1D]"
            />
            <button className="py-3.5 px-6 rounded-[30px] border-0 bg-[#C21D1D] text-white cursor-pointer hover:bg-[#a81818] max-[600px]:w-full">
              Subscribe
            </button>
          </div>
          <p className="mt-3 text-[12px] text-[#ddd]">
            By subscribing, you consent to our Privacy Policy and agree to receive updates.
          </p>
        </div>

        <div className="flex gap-[60px] max-lg:flex-wrap max-lg:justify-start max-[600px]:flex-col max-[600px]:gap-[30px]">
          <div className="flex flex-col gap-3">
            <h4 className="mb-2.5 text-[16px]">Quick Links</h4>
            <a href="#" className="foot-link no-underline text-[#ddd] text-sm">About Us</a>
            <a href="#" className="foot-link no-underline text-[#ddd] text-sm">Contact Us</a>
            <a href="#" className="foot-link no-underline text-[#ddd] text-sm">FAQs</a>
            <a href="/admin" className="foot-link no-underline text-[#ddd] text-sm">Admin Dashboard</a>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="mb-2.5 text-[16px]">Connect With Us</h4>
            <a href="#" className="foot-link no-underline text-[#ddd] text-sm">Facebook</a>
            <a href="#" className="foot-link no-underline text-[#ddd] text-sm">Instagram</a>
            <a href="#" className="foot-link no-underline text-[#ddd] text-sm">Twitter</a>
            <a href="#" className="foot-link no-underline text-[#ddd] text-sm">LinkedIn</a>
            <a href="#" className="foot-link no-underline text-[#ddd] text-sm">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
