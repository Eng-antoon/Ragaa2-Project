// Initialize EmailJS
(function() {
    emailjs.init("wkusqAIi4nGzxMA9b");
})();

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("videoModal").style.display = "none";
    document.getElementById("formModal").style.display = "none";
});

function openModal(videoUrl) {
    const modal = document.getElementById("videoModal");
    const iframe = document.getElementById("videoFrame");
    iframe.src = videoUrl;
    modal.style.display = "flex";
}

function closeModal(event) {
    if (event.target.classList.contains('close-button') || event.target.classList.contains('modal')) {
        const modal = event.target.closest('.modal');
        const iframe = modal.querySelector("iframe");
        if (iframe) {
            iframe.src = "";
        }
        modal.style.display = "none";
    }
}

document.querySelectorAll(".service-box").forEach(box => {
    box.addEventListener("click", () => {
        openModal(box.getAttribute("data-video-url"));
    });
});

document.getElementById("videoModal").addEventListener("click", closeModal);
document.getElementById("formModal").addEventListener("click", closeModal);

// Form Modal functionality
const addChildBtn = document.getElementById('addChildBtn');
const formModal = document.getElementById('formModal');

addChildBtn.addEventListener('click', () => {
    formModal.style.display = 'flex';
});

document.getElementById('addChildForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const file = formData.get('childImage');

    const templateParams = {
        childName: formData.get('childName'),
        childDescription: formData.get('childDescription'),
        childVideo: formData.get('childVideo')
    };

    // Compress the image if it's too large
    new Compressor(file, {
        quality: 0.6,
        maxWidth: 800,
        success(result) {
            const reader = new FileReader();
            reader.readAsDataURL(result);
            reader.onload = function() {
                const base64String = reader.result.split(',')[1];
                const byteLength = base64String.length * (3/4);

               
                // Upload image to Imgur
                const clientId = '5499804b552a3b9'; // Your actual Imgur Client ID
                const formDataImgur = new FormData();
                formDataImgur.append('image', result);

                fetch('https://api.imgur.com/3/upload', {
                    method: 'POST',
                    headers: {
                        Authorization: `Client-ID ${clientId}`
                    },
                    body: formDataImgur
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const imgurUrl = data.data.link; // Direct link to the image

                        templateParams.childImage = imgurUrl;

                        const htmlSnippet = `
<div class="service-box" style="background-image: url('${templateParams.childImage}');" onclick="openModal('${templateParams.childVideo}')">
    <div class="service-content">
        <h2>${templateParams.childName}</h2>
        <p>${templateParams.childDescription}</p>
    </div>
</div>`;

                        templateParams.htmlSnippet = htmlSnippet;

                        emailjs.send('service_evrq6po', 'template_hs8t13e', templateParams)
                            .then(function(response) {
                                alert('تم إرسال البيانات بنجاح!');
                                formModal.style.display = 'none';
                                // Clear form fields
                                document.getElementById('addChildForm').reset();
                            }, function(error) {
                                alert('فشل في إرسال البيانات: ' + error.text);
                            });
                    } else {
                        alert('Failed to upload image. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error uploading image:', error);
                    alert('An error occurred while uploading the image. Please try again.');
                });
            };
        },
        error(err) {
            console.error(err.message);
        },
    });
});
