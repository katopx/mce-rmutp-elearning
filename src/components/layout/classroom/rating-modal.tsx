'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { submitReview } from '@/lib/firebase/services'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function RatingModal({ isOpen, onClose, user, courseId, courseTitle }: any) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('กรุณาเลือกคะแนนดาว')

    setIsSubmitting(true)
    try {
      await submitReview(user.uid, {
        courseId,
        rating,
        comment,
        userName: user.displayName,
        userImage: user.photoURL,
      })
      toast.success('ขอบคุณสำหรับรีวิวครับ!')
      onClose()
    } catch (error) {
      toast.error('ไม่สามารถส่งรีวิวได้')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='text-center sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold'>เย้! เรียนจบแล้ว 🎉</DialogTitle>
          <DialogDescription>
            ความเห็นของคุณมีค่ามาก ช่วยให้เราพัฒนาหลักสูตร "{courseTitle}" ให้ดียิ่งขึ้น
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center py-6'>
          {/* Star Rating UI */}
          <div className='mb-6 flex gap-2'>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type='button'
                className='transition-transform hover:scale-125 focus:outline-none'
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <Star
                  size={40}
                  className={cn(
                    'transition-colors',
                    (hover || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
                  )}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder='เขียนความประทับใจหรือสิ่งที่อยากให้ปรับปรุง...'
            className='mb-6 min-h-[100px]'
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className='flex w-full gap-3'>
            <Button variant='outline' className='flex-1' onClick={onClose}>
              ไว้ทีหลัง
            </Button>
            <Button
              className='flex-1'
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
