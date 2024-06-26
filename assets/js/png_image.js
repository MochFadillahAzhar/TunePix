function loadImage(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const imgElement = document.createElement("img");
        imgElement.src = event.target.result;
        imgElement.id = "uploadedImg";
        document.getElementById("uploaded-image").innerHTML = "";
        document.getElementById("uploaded-image").appendChild(imgElement);
    }
    reader.readAsDataURL(file);
}

function compressImagePNG() {
    const imgElement = document.getElementById("uploadedImg");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const width = imgElement.width;
    const height = imgElement.height;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imgElement, 0, 0, width, height);

    canvas.toBlob((blob) => {
        const newImgElement = document.createElement("img");
        newImgElement.src = URL.createObjectURL(blob);
        document.getElementById("compressed-image").innerHTML = "";
        document.getElementById("compressed-image").appendChild(newImgElement);

        const downloadLink = document.createElement("a");
        downloadLink.href = newImgElement.src;
        downloadLink.download = "compressed_image.png";
        downloadLink.innerText = "Download Compressed Image";
        document.getElementById("download-link").innerHTML = "";
        document.getElementById("download-link").appendChild(downloadLink);

        const originalSize = imgElement.src.length;
        const compressedSize = blob.size;
        const sizeInfo = `Original Size: ${(originalSize / 1024).toFixed(2)} KB | Compressed Size: ${(compressedSize / 1024).toFixed(2)} KB`;
        document.getElementById("size-info").innerText = sizeInfo;
    }, 'image/png', 0.8); // 0.8 is the quality for PNG compression
}
