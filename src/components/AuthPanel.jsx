import { Link } from 'react-router-dom'

export default function AuthPanel({ headline, body }) {
  return (
    <div
      className="hidden lg:flex relative w-[38%] max-w-[554px] shrink-0 flex-col justify-between rounded-r-[50px] bg-cover bg-center p-8 overflow-hidden"
      style={{ backgroundImage: "url('/assets/images/authBg.png')" }}
    >
      <Link to="/">
        <img src="/assets/images/logo.svg" alt="ezbac" className="h-11 w-auto" />
      </Link>
      <div>
        <h2 className="font-heading font-medium text-3xl xl:text-[40px] leading-[1.2] text-white tracking-tight capitalize">
          {headline}
        </h2>
        <p className="mt-4 font-body text-base xl:text-xl leading-[1.2] text-white/90">
          {body}
        </p>
      </div>
    </div>
  )
}
