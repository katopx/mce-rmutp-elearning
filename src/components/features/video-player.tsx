'use client'

import {
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
  type MediaAutoPlayEventDetail,
  type MediaAutoPlayFailEventDetail,
} from '@vidstack/react'
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default'
import '@vidstack/react/player/styles/default/layouts/video.css'
import '@vidstack/react/player/styles/default/theme.css'
import { useRef } from 'react'

interface VideoPlayerProps {
  url: string
  onDuration?: (duration: number) => void
  autoPlay?: boolean
  canSeek?: boolean
  muted?: boolean
}

export default function VideoPlayer({
  url,
  onDuration,
  autoPlay = true,
  canSeek = true,
  muted = true,
}: VideoPlayerProps) {
  const player = useRef<MediaPlayerInstance>(null)

  function onAutoPlay({ muted }: MediaAutoPlayEventDetail) {
    console.log('Autoplay started!', { muted })
  }

  function onAutoPlayFail({ error }: MediaAutoPlayFailEventDetail) {
    console.warn('Autoplay failed:', error)
  }

  return (
    <div className='relative h-full w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-sm'>
      <MediaPlayer
        ref={player}
        src={url}
        title=' '
        viewType='video'
        streamType='on-demand'
        logLevel='warn'
        crossOrigin
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        onAutoPlay={onAutoPlay}
        onAutoPlayFail={onAutoPlayFail}
        className='h-full w-full'
        onDurationChange={(duration) => {
          if (typeof duration === 'number' && duration > 0 && onDuration) {
            onDuration(duration)
          }
        }}
      >
        <MediaProvider />

        <DefaultVideoLayout icons={defaultLayoutIcons} noGestures={!canSeek} />

        {!canSeek && (
          <style jsx global>{`
            vds-time-slider,
            .vds-time-slider,
            vds-slider[type='time'] {
              display: none !important;
              pointer-events: none !important;
            }
            vds-gesture[action*='seek'] {
              display: none !important;
            }
          `}</style>
        )}
      </MediaPlayer>
    </div>
  )
}
