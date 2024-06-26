function compressAudio() {
    var fileInput = document.getElementById("fileInput");
    var gainControl = document.getElementById("gainControl");
    var originalFileSizeSpan = document.getElementById("originalFileSize");
    var compressedFileSizeSpan = document.getElementById("compressedFileSize");
    var file = fileInput.files[0];
    var reader = new FileReader();

    reader.onload = function (e) {
        // Hitung ukuran file asli
        var originalFileSize = file.size;
        originalFileSizeSpan.innerText = "Original file size: " + (originalFileSize / 1024 / 1024).toFixed(2) + " MB";

        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.decodeAudioData(e.target.result, function (buffer) {
            var source = audioContext.createBufferSource();
            source.buffer = buffer;

            var gainNode = audioContext.createGain();
            gainNode.gain.value = gainControl.value;

            source.connect(gainNode);
            gainNode.connect(audioContext.destination);

            var offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
            var offlineSource = offlineContext.createBufferSource();
            offlineSource.buffer = buffer;
            var offlineGainNode = offlineContext.createGain();
            offlineGainNode.gain.value = gainControl.value;

            offlineSource.connect(offlineGainNode);
            offlineGainNode.connect(offlineContext.destination);

            offlineSource.start();
            offlineContext.startRendering().then(function (renderedBuffer) {
                var audioBlob = bufferToWave(renderedBuffer);
                var compressedFileSize = audioBlob.size;
                compressedFileSizeSpan.innerText = "Compressed file size: " + (compressedFileSize / 1024 / 1024).toFixed(2) + " MB";
                compressedFileSizeSpan.style.display = 'inline';

                var downloadLink = document.getElementById('downloadlink');
                downloadLink.href = URL.createObjectURL(audioBlob);
                downloadLink.download = 'compressed_' + file.name;
                downloadLink.innerText = 'Download Compressed Audio';
                downloadLink.style.display = 'inline';

                var audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.src = downloadLink.href;
                audioPlayer.style.display = 'block';
                audioPlayer.load(); // Load the audio file

                // Tampilkan pemutar audio setelah proses kompresi selesai
                audioPlayer.oncanplay = function() {
                    audioPlayer.style.display = 'block';
                };
            });
        });
    };

    reader.readAsArrayBuffer(file);
}




function bufferToWave(abuffer) {
    var numOfChan = abuffer.numberOfChannels,
        length = abuffer.length * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        i,
        sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this demo)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample * 0.5) * 0xffff; // scale to 16-bit unsigned int
            view.setUint16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++; // next source sample
    }

    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}
