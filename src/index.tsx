import React, { useEffect, useRef, useState } from 'react'
import { Controls } from './controls'
import { Marker, MarkerConfiguration } from './marker'
import { SettingsViewer } from './settings-viewer'
import './input.css'
export type ControlSelection =
  | 'FullScreen'
  | 'Play'
  | 'Progress'
  | 'Time'
  | 'Volume'
  | 'LastFrame'
  | 'NextFrame'

export type SettingsSelection = 'Title' | 'FPS' | 'Repeat' | 'StartTime' | 'Volume'

export interface ProgressProps {
  currentTime: number
  duration: number
  percentage: number
}

interface Props {
  url: string
  controls?: ControlSelection[]
  height?: string
  width?: string
  isPlaying: boolean
  volume: number
  loop?: boolean
  markers?: Marker[]
  timeStart?: number
  fps?: number
  onPlay?: () => void
  onPause?: () => void
  onVolume?: (volume: number) => void
  onProgress?: (event: Event, props: ProgressProps) => void
  onDuration?: (duration: number) => void
  onMarkerClick?: (marker: Marker) => void
  onMarkerAdded?: (marker: Marker) => void
  onLoadedMetadata?: (event: React.SyntheticEvent<HTMLVideoElement, Event>) => void
  onVideoPlayingComplete?: (props: ProgressProps) => void
  selectedMarker?: Marker
  viewSettings?: SettingsSelection[]
  markerConfiguration?: MarkerConfiguration
}

const DEFAULT_VOLUME: number = 0.7

function VideoPlayer(props: Props) {
  const playerEl = useRef<HTMLVideoElement>(null)
  const progressEl = useRef<HTMLProgressElement>(null)
  const volumeEl = useRef<HTMLProgressElement>(null)

  const [currentTime, setCurrentTime] = useState<number>(0)
  const [videoDuration, setVideoDuration] = useState<number>(null)
  const [muted, setMuted] = useState<boolean>(false)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)

  const {
    url,
    controls = ['Play', 'Time', 'Progress', 'Volume', 'FullScreen'],
    height = '360px',
    width = '640px',
    isPlaying = false,
    volume = 0.7,
    loop = false,
    markers = [],
    timeStart = 0,
    fps = 30,
    // tslint:disable-next-line: no-empty
    onPlay = () => {},
    // tslint:disable-next-line: no-empty
    onPause = () => {},
    // tslint:disable-next-line: no-empty
    onVolume = () => {},
    onProgress,
    // tslint:disable-next-line: no-empty
    onDuration = () => {},
    // tslint:disable-next-line: no-empty
    onMarkerClick = () => {},
    onMarkerAdded,
    onVideoPlayingComplete,
    // tslint:disable-next-line: no-empty
    onLoadedMetadata = () => {},
    selectedMarker,
    viewSettings,
    markerConfiguration,
  } = props

  const [allMarkers, setAllMarkers] = useState<Marker[]>(markers)

  useEffect(() => {
    seekToPlayer()
  }, [timeStart])

  useEffect(() => {
    isPlaying ? playerEl.current.play() : playerEl.current.pause()
  }, [isPlaying])

  useEffect(() => {
    setVolume(volume)
  }, [volume])

  const seekToPlayer = () => {
    if (timeStart && playerEl) {
      playerEl.current.currentTime = timeStart
    }
  }

  const setVolume = (value: number) => {
    playerEl.current.volume = value
    setMuted(!value)
  }

  const handlePlayerClick = () => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }

  const handleDurationLoaded = (e: Event) => {
    let duration = e.currentTarget['duration']
    if (duration === Infinity) {
      duration = 0
    }
    setVideoDuration(duration)
    onDuration(duration)
  }

  const handleProgress = (e: Event) => {
    const { currentTarget } = e
    // tslint:disable-next-line: no-shadowed-variable
    const currentTime = currentTarget['currentTime']
    const duration = currentTarget['duration']
    let percentage = 0
    if (duration) {
      setCurrentTime(currentTime)
      percentage = (100 / duration) * currentTime
      if (progressEl && progressEl.current) {
        progressEl.current.value = percentage
        progressEl.current.innerHTML = percentage + '% played'
      } else {
        console.warn(`Progress bar element is not available in DOM`)
      }
      if (currentTime === duration) {
        onPause()
      }
    }
    const progressProps: ProgressProps = {
      currentTime,
      duration,
      percentage,
    }
    onProgress(e, progressProps)
  }

  const onHandleVideoEnded = () => {
    const progressProps: ProgressProps = {
      currentTime,
      duration: videoDuration,
      percentage: 100,
    }
    if (onVideoPlayingComplete) {
      onVideoPlayingComplete(progressProps)
    } else {
      console.warn(`No onVideoPlayingComplete function is implemented`)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLProgressElement, MouseEvent>) => {
    const x =
      e['clientX'] - progressEl.current.getBoundingClientRect().left + document.body.scrollLeft
    const percentage = (x * progressEl.current.max) / progressEl.current.offsetWidth
    playerEl.current.currentTime = (percentage / 100) * playerEl.current.duration
  }

  const handleVolumeClick = (e: React.MouseEvent<HTMLProgressElement, MouseEvent>) => {
    const y =
      volumeEl.current.offsetWidth -
      (e['clientY'] - volumeEl.current.getBoundingClientRect().top + document.body.scrollTop)
    const percentage = (y * volumeEl.current.max) / volumeEl.current.offsetWidth
    playerEl.current.muted = false
    onVolume(percentage / 100)
  }

  const handleMuteClick = () => {
    if (muted) {
      playerEl.current.muted = false
      setVolume(DEFAULT_VOLUME)
      setMuted(false)
    } else {
      playerEl.current.muted = true
      setVolume(0)
      setMuted(true)
    }
  }

  const handleFullScreenClick = () => {
    const videoWrap = document.getElementsByClassName('react-video-wrap')[0]
    if (isFullScreen) {
      document.body.classList.remove('react-video-full-screen')
      if (document['exitFullscreen']) {
        document['exitFullscreen']()
      } else if (document['mozCancelFullScreen']) {
        document['mozCancelFullScreen']()
      } else if (document['webkitExitFullscreen']) {
        document['webkitExitFullscreen']()
      } else if (document['msExitFullscreen']) {
        document['msExitFullscreen']()
      }
    } else {
      document.body.classList.add('react-video-full-screen')
      if (videoWrap['requestFullscreen']) {
        videoWrap['requestFullscreen']()
      } else if (videoWrap['mozRequestFullScreen']) {
        videoWrap['mozRequestFullScreen']()
      } else if (videoWrap['webkitRequestFullscreen']) {
        videoWrap['webkitRequestFullscreen']()
      } else if (videoWrap['msRequestFullscreen']) {
        videoWrap['msRequestFullscreen']()
      }
    }
    setIsFullScreen(!isFullScreen)
  }

  const handleMarkerClick = (marker: Marker) => {
    playerEl.current.currentTime = marker['time']
    onMarkerClick(marker)
  }

  const handleNextFrameClick = () => {
    const frameTime = 1 / fps
    playerEl.current.currentTime = Math.min(
      playerEl.current.duration,
      playerEl.current.currentTime + frameTime,
    )
  }

  const handleLastFrameClick = () => {
    const frameTime = 1 / fps
    playerEl.current.currentTime = Math.max(0, playerEl.current.currentTime - frameTime)
  }

  const handleAddMarkerClick = () => {
    const id = Math.round(Math.random() * 1000)
    const newMarker: Marker = {
      id,
      time: currentTime,
      title: `newMarker_${id}`,
    }
    const m = allMarkers.map((x) => x)
    m.push(newMarker)
    setAllMarkers(m)
    onMarkerAdded(newMarker)
  }

  useEffect(() => {
    const instance = playerEl.current
    instance.addEventListener('timeupdate', handleProgress)
    instance.addEventListener('durationchange', handleDurationLoaded)
    if (timeStart) {
      seekToPlayer()
    }
    if (isPlaying) {
      instance.play()
    }

    return () => {
      if (instance) {
        instance.removeEventListener('timeupdate', handleProgress)
        instance.removeEventListener('durationchange', handleDurationLoaded)
      }
    }
  }, [])

  return (
    <div className="react-video-wrap rounded-lg overflow-hidden" style={{ height, width }}>
      <video
        ref={playerEl}
        key={url}
        className="react-video-player"
        loop={loop}
        onClick={handlePlayerClick}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onHandleVideoEnded}
      >
        <source src={url} type="video/mp4" />
      </video>
      {viewSettings && (
        <SettingsViewer
          url={url}
          fps={fps}
          timeStart={timeStart}
          volume={volume}
          loop={loop}
          markersCount={allMarkers.length}
          viewSettings={viewSettings}
        />
      )}
      {isFullScreen ? (
        <button className="react-video-close" onClick={handleFullScreenClick}>
          Close video
        </button>
      ) : null}
      {controls.length ? (
        <Controls
          progressEl={progressEl as any}
          volumeEl={volumeEl as any}
          controls={controls}
          isPlaying={isPlaying}
          volume={volume}
          currentTime={currentTime}
          duration={videoDuration}
          muted={muted}
          markers={allMarkers}
          onPlayClick={onPlay}
          onPauseClick={onPause}
          onProgressClick={handleProgressClick}
          onVolumeClick={handleVolumeClick}
          onMuteClick={handleMuteClick}
          onFullScreenClick={handleFullScreenClick}
          onMarkerClick={handleMarkerClick}
          onNextFrameClick={handleNextFrameClick}
          onLastFrameClick={handleLastFrameClick}
          onAddMarkerClick={handleAddMarkerClick}
          onMarkerImported={(importedMarkers: Marker[]) => {
            const completeMarkers = allMarkers.slice().concat(importedMarkers)
            setAllMarkers(completeMarkers)
          }}
          selectedMarker={selectedMarker}
          markerConfiguration={markerConfiguration}
        />
      ) : null}
    </div>
  )
}

export default VideoPlayer
