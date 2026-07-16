import { useEffect, useState } from 'react'

const fmt = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
})

/** Ambient liveness: the site knows what time it is where Aditya is. */
export function LiveClock() {
  const [now, setNow] = useState(() => fmt.format(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setNow(fmt.format(new Date())), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span className="live-clock">
      {now} IST, Pune — probably training something
    </span>
  )
}
