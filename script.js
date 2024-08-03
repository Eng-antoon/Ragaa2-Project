(function() {
    emailjs.init("wkusqAIi4nGzxMA9b");
})();

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("videoModal").style.display = "none";
    document.getElementById("formModal").style.display = "none";
    document.getElementById("descriptionModal").style.display = "none";

    truncateDescriptions();
    setupEventListeners();
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

function openDescriptionModal(description) {
    const modal = document.getElementById("descriptionModal");
    const descriptionElem = document.getElementById("fullDescription");
    descriptionElem.textContent = description;
    modal.style.display = "flex";
}

function truncateDescriptions() {
    const serviceBoxes = document.querySelectorAll(".service-box");
    serviceBoxes.forEach(box => {
        const descriptionElem = box.querySelector(".service-content p");
        const fullText = descriptionElem.textContent.trim();
        const words = fullText.split(/\s+/);

        if (words.length > 20) {
            const truncatedText = words.slice(0, 20).join(" ") + "...";
            descriptionElem.textContent = truncatedText;

            const readMoreBtn = document.createElement("button");
            readMoreBtn.className = "read-more-btn";
            readMoreBtn.textContent = "Read More";
            readMoreBtn.addEventListener("click", () => openDescriptionModal(fullText));
            box.querySelector(".service-content").appendChild(readMoreBtn);
        }
    });
}

function setupEventListeners() {
    document.querySelectorAll(".service-box").forEach(box => {
        box.addEventListener("click", () => {
            openModal(box.getAttribute("data-video-url"));
        });
    });

    document.getElementById("videoModal").addEventListener("click", closeModal);
    document.getElementById("descriptionModal").addEventListener("click", closeModal);
    document.getElementById("formModal").addEventListener("click", closeModal);

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
            userName: formData.get('userName'),
            childName: formData.get('childName'),
            childDescription: formData.get('childDescription'),
            childVideo: transformGoogleDriveLink(formData.get('childVideo'))
        };

        new Compressor(file, {
            quality: 0.6,
            maxWidth: 800,
            success(result) {
                const reader = new FileReader();
                reader.readAsDataURL(result);
                reader.onload = function() {
                    const base64String = reader.result.split(',')[1];
                    const byteLength = base64String.length * (3/4);

                    if (byteLength > 50000) { // 50KB limit
                        alert('The image is too large. Please select a smaller image.');
                        return;
                    }

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
                            const imgurUrl = data.data.link;

                            templateParams.childImage = imgurUrl;

                            const truncatedDescription = truncateDescription(templateParams.childDescription);

                            const htmlSnippet = `
<div class="service-box" style="background-image: url('${templateParams.childImage}');" data-video-url="${templateParams.childVideo}">
    <div class="service-content">
        <h2>${templateParams.childName}</h2>
        <p class="description">${truncatedDescription}</p>
    </div>
</div>`;

                            templateParams.htmlSnippet = htmlSnippet;

                            emailjs.send('service_evrq6po', 'template_hs8t13e', templateParams)
                                .then(function(response) {
                                    alert('تم إرسال البيانات بنجاح!');
                                    formModal.style.display = 'none';
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
}

function transformGoogleDriveLink(link) {
    const regex = /\/file\/d\/(.*?)\/view/;
    const match = link.match(regex);
    if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return link;
}

function truncateDescription(description) {
    const words = description.split(/\s+/);
    if (words.length > 20) {
        return words.slice(0, 20).join(" ") + "...";
    }
    return description;
}
