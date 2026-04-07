export async function extractVideoFrames(
  file: File,
  frameCount = 6
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.preload = 'auto';

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Canvas context unavailable'));
      }

      const timestamps = Array.from({ length: frameCount }, (_, i) =>
        (duration / (frameCount + 1)) * (i + 1)
      );

      const frames: string[] = [];
      let index = 0;

      const seekNext = () => {
        if (index >= timestamps.length) {
          URL.revokeObjectURL(url);
          return resolve(frames);
        }
        video.currentTime = timestamps[index]!;
      };

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        frames.push(dataUrl.split(',')[1] ?? dataUrl);
        index++;
        seekNext();
      });

      seekNext();
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    });
  });
}
