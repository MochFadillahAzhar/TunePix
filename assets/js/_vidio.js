function showSection(sectionId) {
    document.querySelectorAll('.compression-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

function handleVideoSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const videoPreview = document.getElementById('video-preview');
        videoPreview.src = URL.createObjectURL(file);
        videoPreview.style.display = 'block';
    }
}

async function compressVideo() {
    const algorithm = document.getElementById('compression-algorithm').value;
    const file = document.getElementById('video-upload').files[0];
    const originalSize = file.size;
    document.getElementById('original-size').innerText = `Original Size: ${formatBytes(originalSize)}`;

    if (algorithm === 'webcodecs') {
        await compressVideoWebCodecs(file);
    } else if (algorithm === 'canvas') {
        await compressVideoCanvas(file);
    }
}

async function compressVideoWebCodecs(file) {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    await video.play();

    const track = video.captureStream().getVideoTracks()[0];
    const processor = new MediaStreamTrackProcessor(track);
    const generator = new MediaStreamTrackGenerator('video');
    const transform = new TransformStream({
        async transform(videoFrame, controller) {
            const newFrame = new VideoFrame(videoFrame, { timestamp: videoFrame.timestamp });
            videoFrame.close();
            controller.enqueue(newFrame);
        }
    });

    processor.readable.pipeThrough(transform).pipeTo(generator.writable);
    const compressedStream = new MediaStream([generator]);
    const options = {
        mimeType: 'video/webm; codecs=vp8',
        videoBitsPerSecond: 500000 // 500 kbps
    };
    const recorder = new MediaRecorder(compressedStream, options);
    const chunks = [];

    recorder.ondataavailable = event => chunks.push(event.data);
    recorder.start();

    await new Promise(resolve => setTimeout(resolve, video.duration * 1000));
    recorder.stop();

    recorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        const compressedURL = URL.createObjectURL(compressedBlob);

        const downloadLink = document.getElementById('download-compressed-video');
        downloadLink.href = compressedURL;
        downloadLink.style.display = 'block';
        downloadLink.download = 'compressed_video_webcodecs.webm';

        const compressedSize = compressedBlob.size;
        document.getElementById('compressed-size').innerText = `Compressed Size: ${formatBytes(compressedSize)}`;
        document.getElementById('compression-info').innerText = 'Compressed using WebCodecs Algorithm';

        const compressedVideoPreview = document.getElementById('compressed-video-preview');
        compressedVideoPreview.src = compressedURL;
        compressedVideoPreview.style.display = 'block';
    };
}

async function compressVideoCanvas(file) {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    const chunks = [];
    const stream = canvas.captureStream();
    const options = {
        mimeType: 'video/webm; codecs=vp8',
        videoBitsPerSecond: 500000 // 500 kbps
    };
    const recorder = new MediaRecorder(stream, options);
    recorder.ondataavailable = event => chunks.push(event.data);
    recorder.start();

    const duration = video.duration;
    video.currentTime = 0;

    await new Promise((resolve) => {
        video.onseeked = async () => {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (video.currentTime < duration) {
                video.currentTime += 0.1; // Next frame
            } else {
                resolve();
            }
        };
        video.currentTime = 0.1; // Start processing frames
    });

    recorder.stop();

    recorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        const compressedURL = URL.createObjectURL(compressedBlob);

        const downloadLink = document.getElementById('download-compressed-video');
        downloadLink.href = compressedURL;
        downloadLink.style.display = 'block';
        downloadLink.download = 'compressed_video_canvas.webm';

        const compressedSize = compressedBlob.size;
        document.getElementById('compressed-size').innerText = `Compressed Size: ${formatBytes(compressedSize)}`;
        document.getElementById('compression-info').innerText = 'Compressed using Canvas Algorithm';

        const compressedVideoPreview = document.getElementById('compressed-video-preview');
        compressedVideoPreview.src = compressedURL;
        compressedVideoPreview.style.display = 'block';
    };
}
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
