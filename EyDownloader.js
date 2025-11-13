// Step 1: Load the JSZip library
function loadJSZip() {
    return new Promise((resolve, reject) => {
        if (window.JSZip) {
            console.log("JSZip already loaded.");
            return resolve();
        }
        
        console.log("Loading JSZip library...");
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            console.log("JSZip library loaded successfully.");
            resolve();
        };
        script.onerror = () => {
            console.error("Failed to load JSZip library!");
            reject();
        };
        document.head.appendChild(script);
    });
}

async function scrollToBottom(waitTime = 5000) {
    console.log("--- Starting scroll to bottom... ---");
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    let previousHeight = -1;
    let currentHeight = document.body.scrollHeight;
    try {
        while (previousHeight !== currentHeight) {
            previousHeight = currentHeight;
            window.scrollTo(0, document.body.scrollHeight);
            console.log(`Scrolling... waiting ${waitTime / 1000}s for new content...`);
            await wait(waitTime);
            currentHeight = document.body.scrollHeight;
        }
        console.log("✅ --- Reached the bottom! ---");
    } catch (error) {
        console.error("Scrolling failed:", error);
    }
}

/**
 * Finds all filtered links and displays buttons to download them in zipped chunks.
 */
function displayPaginatedZipDownloaders() {
    // First, check if JSZip is loaded
    if (typeof JSZip === 'undefined') {
        alert("Error: JSZip library is not loaded. Please run Step 1 again.");
        return;
    }
    
    console.log("--- Extracting links and creating ZIP download buttons... ---");
    
    // --- Settings ---
    const filterPrefix = "https://assets.eylog.co.uk/NURSERYNAMEHERE/daily-diary/";
    const chunkSize = 5; // How many files to zip per click
    
    // 1. Find and filter all links
    const allImageElements = document.querySelectorAll('img');
    const allLinks = [...allImageElements]
        .map(img => img.currentSrc || img.src)
        .filter(src => src);
    const uniqueLinks = [...new Set(allLinks)];
    const filteredLinks = uniqueLinks.filter(link => link.startsWith(filterPrefix));

    if (filteredLinks.length === 0) {
        alert("Operation complete, but no image links were found.");
        return;
    }

    // 2. Create the overlay container
    const linksContainer = document.createElement('div');
    linksContainer.style.position = 'fixed';
    linksContainer.style.top = '10px';
    linksContainer.style.left = '10px';
    linksContainer.style.width = '90vw';
    linksContainer.style.height = '90vh';
    linksContainer.style.zIndex = '99999';
    linksContainer.style.border = '5px solid teal';
    linksContainer.style.padding = '20px';
    linksContainer.style.backgroundColor = 'white';
    linksContainer.style.overflowY = 'scroll';
    linksContainer.style.fontFamily = 'monospace';
    linksContainer.innerHTML = `<h3>Found ${filteredLinks.length} matching links.</h3>
                                <p>Click a button to download a ZIP of that chunk.</p><hr>`;
    
    document.body.appendChild(linksContainer);

    // 3. Loop and create buttons in chunks
    for (let i = 0; i < filteredLinks.length; i += chunkSize) {
        const chunk = filteredLinks.slice(i, i + chunkSize);
        const startNum = i + 1;
        const endNum = i + chunk.length;

        const button = document.createElement('button');
        button.textContent = `Download Links ${startNum} - ${endNum} (as .zip)`;
        button.style.display = 'block';
        button.style.width = '90%';
        button.style.padding = '10px';
        button.style.margin = '5px auto';
        button.style.fontSize = '14px';
        button.style.cursor = 'pointer';

        // 4. --- THE NEW ONCLICK LOGIC ---
        button.onclick = async () => {
            button.textContent = "Working... (Fetching files...)";
            button.disabled = true;
            button.style.cursor = 'wait';

            try {
                const zip = new JSZip();
                
                // Fetch each image in this chunk
                for (const link of chunk) {
                    const filename = link.substring(link.lastIndexOf('/') + 1);
                    button.textContent = `Working... (Fetching ${filename})`;
                    
                    const response = await fetch(link, { mode: 'cors' }); // 'cors' is key
                    const imageBlob = await response.blob();
                    zip.file(filename, imageBlob, { binary: true });
                }

                // Generate the zip
                button.textContent = "Working... (Generating ZIP file...)";
                const zipContent = await zip.generateAsync({ type: "blob" });

                // Trigger the single download
                const zipName = `images_${startNum}-${endNum}.zip`;
                const a = document.createElement('a');
                a.href = URL.createObjectURL(zipContent);
                a.download = zipName;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Mark as done
                button.textContent = `Downloaded Links ${startNum} - ${endNum}`;
                button.style.textDecoration = 'line-through';
                button.style.backgroundColor = '#eee';
                button.style.color = '#777';
                
            } catch (error) {
                console.error("Failed to create ZIP:", error);
                button.textContent = `Error downloading ${startNum}-${endNum}. Check console.`;
                button.style.backgroundColor = 'red';
                button.style.color = 'white';
                button.disabled = false;
            }
        };

        linksContainer.appendChild(button);
    }
}

// Run the loader
loadJSZip();

// Scroll to bottom
scrollToBottom();

//displayPaginatedZipDownloaders();
