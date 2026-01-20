import { cn } from '@/lib/utils'

const CircularProgress = ({
  value,
  size = 18,
  strokeWidth = 3,
}: {
  value: number
  size?: number
  strokeWidth?: number
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div
      className='relative inline-flex items-center justify-center'
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className='rotate-[-90deg]'>
        <circle
          className='text-slate-200'
          strokeWidth={strokeWidth}
          stroke='currentColor'
          fill='transparent'
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn(
            'transition-all duration-500 ease-in-out',
            value === 100 ? 'text-emerald-500' : 'text-primary',
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
          stroke='currentColor'
          fill='transparent'
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    </div>
  )
}

export default CircularProgress
