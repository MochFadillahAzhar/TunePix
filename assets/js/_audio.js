document.addEventListener('DOMContentLoaded', function () {
    const audioUpload = document.getElementById('audio-upload');
    const compressWavButton = document.getElementById('compress-wav-button');
    
    let audioContext;
    let audioBuffer;
    let audioSource;
    let audioFile;

    audioUpload.addEventListener('change', function (event) {
        resetAudioData();
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        handleAudioUpload(event);
    });

    compressWavButton.addEventListener('click', compressAudioWAV);

    function resetAudioData() {
        audioBuffer = null;
        audioSource = null;
        audioFile = null;

        const audioPreviewContainer = document.getElementById('audio-preview');
        audioPreviewContainer.innerHTML = '';

        const sizeInfo = document.getElementById('audio-size-info');
        sizeInfo.textContent = '';

        const downloadCompressedLink = document.getElementById('download-compressed-audio');
        downloadCompressedLink.style.display = 'none';
    }

    function handleAudioUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const arrayBuffer = e.target.result;
                audioContext.decodeAudioData(arrayBuffer, function (buffer) {
                    audioBuffer = buffer;
                    audioFile = file;
                    createAudioPreview(file);
                    displayOriginalFileSize(file);
                });
            };
            reader.readAsArrayBuffer(file);
        }
    }

    function displayOriginalFileSize(file) {
        const sizeInfo = document.getElementById('audio-size-info');
        const originalSize = (file.size / 1024).toFixed(2); // Size in KB
        sizeInfo.textContent = `Original File Size: ${originalSize} KB`;
    }

    function displayCompressedFileSize(blob) {
        const sizeInfo = document.getElementById('audio-size-info');
        const compressedSize = (blob.size / 1024).toFixed(2); // Size in KB
        sizeInfo.textContent += ` | Compressed File Size: ${compressedSize} KB`;
    }

    function createAudioPreview(file) {
        if (audioSource) {
            audioSource.stop();
        }
        const reader = new FileReader();
        reader.onload = function (event) {
            const arrayBuffer = event.target.result;
            audioContext.decodeAudioData(arrayBuffer, function (buffer) {
                audioBuffer = buffer;
                audioSource = audioContext.createBufferSource();
                audioSource.buffer = audioBuffer;
                audioSource.connect(audioContext.destination);
            });
        };
        reader.readAsArrayBuffer(file);
    }

    function downsampleBuffer(buffer, sampleRate) {
        if (sampleRate == audioContext.sampleRate) {
            return buffer;
        }
        const sampleRateRatio = audioContext.sampleRate / sampleRate;
        const newLength = Math.round(buffer.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < result.length) {
            const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
            let accum = 0, count = 0;
            for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                accum += buffer[i];
                count++;
            }
            result[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return result;
    }

    function bufferToWave(abuffer, offset, len, sampleRate) {
        const numOfChan = abuffer.numberOfChannels;
        const length = len * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i;
        let sample;
        let pos = 0;

        // Write WAVE header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // File length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // Length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(sampleRate);
        setUint32(sampleRate * 2 * numOfChan); // Avg. bytes/sec
        setUint16(numOfChan * 2); // Block-align
        setUint16(16); // 16-bit (hardcoded in this demo)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // Chunk length

        // Write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(downsampleBuffer(abuffer.getChannelData(i), sampleRate));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // Clamp
                sample = (0.5 + sample * 32767.5) | 0; // Scale to 16-bit signed int
                view.setInt16(pos, sample, true); // Write 16-bit sample
                pos += 2;
            }
            offset++; // Next source sample
        }

        return new Blob([buffer], { type: 'audio/wav' });

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }

    function compressAudioWAV() {
        if (!audioFile) {
            alert('Please upload an audio file first.');
            return;
        }

        const sampleRate = 22050; // Downsample to 22.05kHz
        const reader = new FileReader();
        reader.onload = function (event) {
            const arrayBuffer = event.target.result;
            audioContext.decodeAudioData(arrayBuffer, function (buffer) {
                const wavBlob = bufferToWave(buffer, 0, buffer.length, sampleRate);
                const url = URL.createObjectURL(wavBlob);

                const downloadLink = document.getElementById('download-compressed-audio');
                downloadLink.href = url;
                downloadLink.download = 'compressed_audio.wav';
                downloadLink.style.display = 'block';

                const audioPreviewContainer = document.getElementById('audio-preview');
                audioPreviewContainer.innerHTML = '';

                const audioElement = document.createElement('audio');
                audioElement.controls = true;
                audioElement.src = url;

                audioPreviewContainer.appendChild(audioElement);
                displayCompressedFileSize(wavBlob);
            });
        };
        reader.readAsArrayBuffer(audioFile);
    }
});
