import GlobalLoading from '@/components/layout/common/GlobalLoading'

export default function Loading() {
  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm'>
      <GlobalLoading />
    </div>
  )
}
