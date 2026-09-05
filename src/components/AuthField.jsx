const inputClasses =
  'w-full h-14 rounded-[20px] bg-bg-card px-6 font-body font-light text-sm text-ink placeholder:text-[#5e8ab3] outline-none focus:ring-2 focus:ring-primary/40'

export function AuthField({ label, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-body text-ez-lg text-ink">{label}</span>
      <input {...props} className={inputClasses} />
    </label>
  )
}

export function AuthSelect({ label, options, placeholder, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-body text-ez-lg text-ink">{label}</span>
      <div className="relative">
        <select
          {...props}
          className={`${inputClasses} appearance-none pr-12 ${props.value ? '' : 'text-[#5e8ab3]'}`}
        >
          <option value="" disabled hidden>{placeholder || `select your ${label?.toLowerCase()}`}</option>
          {options.map((o) => (
            <option key={o} value={o} className="text-ink">{o}</option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#5e8ab3]"
          viewBox="0 0 12 8" fill="none"
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  )
}
