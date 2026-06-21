import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

// True MP4 (H.264) export of the animated replay lap, built with WebCodecs +
// mp4-muxer. We encode H.264 specifically because iOS Safari does not play the
// WebM that canvas.captureStream()/MediaRecorder would produce.

export function canRecordMp4(): boolean {
  return typeof window !== 'undefined' && typeof window.VideoEncoder !== 'undefined'
}

export interface LapVideoOptions {
  width: number
  height: number
  fps: number
  frames: number
  /** Target bitrate in bits/sec. Defaults to 12 Mbps. */
  bitrate?: number
  /** Paint frame `i` (progress `t` in 0..1) onto the shared canvas context. */
  drawFrame: (t: number, ctx: CanvasRenderingContext2D) => Promise<void>
  onProgress?: (done: number, total: number) => void
}

// H.264 candidates, most-capable first. All decode on modern iOS/Android/desktop;
// we probe for the first the local encoder actually supports.
//   640033 = High@5.1, 4d0033 = Main@5.1, 42e033 = Baseline@5.1, 42001f = Baseline@3.1
const H264_CANDIDATES = ['avc1.640033', 'avc1.4d0033', 'avc1.42e033', 'avc1.42001f']

async function pickCodec(width: number, height: number, framerate: number, bitrate: number): Promise<string> {
  for (const codec of H264_CANDIDATES) {
    try {
      const support = await VideoEncoder.isConfigSupported({ codec, width, height, framerate, bitrate })
      if (support.supported) return codec
    } catch {
      // isConfigSupported can throw on malformed codec strings — just try the next.
    }
  }
  // Last resort: let configure() try the most compatible profile and surface any error.
  return 'avc1.42001f'
}

export async function recordLapVideo(opts: LapVideoOptions): Promise<Blob> {
  if (!canRecordMp4()) throw new Error('WebCodecs (VideoEncoder) is not supported in this browser')

  const { width, height, fps, frames, drawFrame, onProgress } = opts
  const bitrate = opts.bitrate ?? 12_000_000

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height, frameRate: fps },
    fastStart: 'in-memory', // moov atom up front so the file plays/streams immediately
  })

  let encodeError: unknown = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encodeError = e },
  })
  encoder.configure({
    codec: await pickCodec(width, height, fps, bitrate),
    width,
    height,
    bitrate,
    framerate: fps,
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D canvas context')

  const frameDurUs = 1_000_000 / fps

  for (let i = 0; i < frames; i++) {
    if (encodeError) throw encodeError
    // i / frames (not frames-1) so the last frame is just before the loop point —
    // the clip loops seamlessly.
    const t = i / frames
    await drawFrame(t, ctx)

    const frame = new VideoFrame(canvas, {
      timestamp: Math.round(i * frameDurUs),
      duration: Math.round(frameDurUs),
    })
    encoder.encode(frame, { keyFrame: i % fps === 0 })
    frame.close()

    // Don't let the encoder queue run away on slower machines.
    if (encoder.encodeQueueSize > 8) {
      await new Promise<void>((r) => setTimeout(r, 0))
    }
    onProgress?.(i + 1, frames)
  }

  await encoder.flush()
  encoder.close()
  if (encodeError) throw encodeError

  muxer.finalize()
  const { buffer } = muxer.target as ArrayBufferTarget
  return new Blob([buffer], { type: 'video/mp4' })
}
