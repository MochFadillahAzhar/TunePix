// Function to handle file input change
function handleFileInputChange(event) {
    const file = event.target.files[0];
    const previewImage = document.getElementById('previewImage');

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
    };

    reader.readAsDataURL(file);
}

// Function to compress the image
async function compressImage() {
    const fileInput = document.getElementById('fileInput');
    const compressedImageLink = document.getElementById('downloadLink');
    const compressedImageContainer = document.getElementById('compressedImageContainer');

    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select an image to compress.');
        return;
    }

    const imageFile = fileInput.files[0];

    try {
        // Get original file size
        const originalSize = getImageFileSize(imageFile);

        // Compress the image using Compressor.js library
        const compressedFile = await new Promise((resolve, reject) => {
            new Compressor(imageFile, {
                maxWidth: 800, // optionally, resize maxWidth
                maxHeight: 600, // optionally, resize maxHeight
                quality: 0.6, // quality (0 to 1)
                success(result) {
                    resolve(result);
                },
                error(error) {
                    reject(error);
                },
            });
        });

        // Get compressed file size
        const compressedSize = getImageFileSize(compressedFile);

        // Create download link for compressed image
        const downloadLink = URL.createObjectURL(compressedFile);
        compressedImageLink.href = downloadLink;
        compressedImageLink.style.display = 'inline-block';

        // Display compressed image on the page
        const compressedImage = new Image();
        compressedImage.src = downloadLink;
        compressedImage.style.maxWidth = '100%'; // Adjust style as needed
        compressedImageContainer.innerHTML = ''; // Clear previous image if any
        compressedImageContainer.appendChild(compressedImage);

        // Display file size information
        displayFileSizeInfo(originalSize, compressedSize);

    } catch (error) {
        console.error('Error occurred while compressing the image:', error);
        alert('Error occurred while compressing the image. Please try again.');
    }
}


// Function to get file size in readable format (KB or MB)
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Function to get image file size
function getImageFileSize(file) {
    return file.size; // Returns file size in bytes
}

// Function to display file size information
function displayFileSizeInfo(originalSize, compressedSize) {
    const fileSizeInfo = document.getElementById('fileSizeInfo');
    fileSizeInfo.innerHTML = `
        <p>Original Image Size: ${formatFileSize(originalSize)}</p>
        <p>Compressed Image Size: ${formatFileSize(compressedSize)}</p>
    `;
}
