const generateForm = document.querySelector(".generate-form");
const imageGallery = document.querySelector(".image-gallery");
let isImageGenerating = false;

// Function to check job status
const checkGenerationStatus = async (jobId) => {
    while (true) {
        const response = await fetch(`https://stablehorde.net/api/v2/generate/check/${jobId}`);
        const data = await response.json();
        if (data.done) break;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 sec
    }
    const result = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`);
    return await result.json();
};


// Generate images via Stable Horde (FIXED)
const generateAiImages = async (userPrompt, userImgQuantity) => {
    try {
        // Step 1: Submit generation request with proper parameters
        const response = await fetch("https://stablehorde.net/api/v2/generate/async", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Client-Agent": "your-app/1.0",
                "apikey": "0000000000" // Anonymous key
            },
            body: JSON.stringify({
                prompt: userPrompt,
                params: {
                    n: parseInt(userImgQuantity),
                    width: 512,
                    height: 512,
                    steps: 20,
                    sampler_name: "k_euler_a",
                },
                censor_nsfw: false,
                models: ["stable_diffusion"],
                r2: true // Enable R2 storage for direct URLs
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(errorData.message || "Failed to start generation");
        }

        const { id } = await response.json();
        console.log("Generation ID:", id);

        // Step 2: Wait for completion
        const result = await checkGenerationStatus(id);
        if (!result.generations) throw new Error("No images generated");
        updateImageCard(result.generations);
    } catch (error) {
        console.error("Error:", error);
        alert(`Error: ${error.message}`);
        isImageGenerating = false;
    }
};

// Update image cards
const updateImageCard = (imgDataArray) => {
    imgDataArray.forEach((imgObject, index) => {
        const imgCard = imageGallery.querySelectorAll(".img-card")[index];
        const imgElement = imgCard.querySelector("img");
        const downloadBtn = imgCard.querySelector(".download-btn");

        // Use the R2 URL if available
        const imgUrl = imgObject.img || 
                      `https://stablehorde.net/api/v2/generate/img/${imgObject.id}`;
        
        imgElement.src = imgUrl;
        imgElement.onload = () => {
            imgCard.classList.remove("loading");
            downloadBtn.setAttribute("href", imgUrl);
            downloadBtn.setAttribute("download", `${new Date().getTime()}.jpg`);
        };
    });
};

// Form handler remains the same
generateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isImageGenerating) return;
    isImageGenerating = true;

    const userPrompt = e.srcElement[0].value;
    const userImgQuantity = e.srcElement[1].value;

    const imgCardMarkup = Array.from({ length: userImgQuantity }, () => `
        <div class="img-card loading">
            <img src="images/loader.svg" alt="image">
            <a href="#" class="download-btn">
                <img src="images/download.svg" alt="download icon">
            </a>
        </div>
    `).join("");

    imageGallery.innerHTML = imgCardMarkup;
    generateAiImages(userPrompt, userImgQuantity);
});

