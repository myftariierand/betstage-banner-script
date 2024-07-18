;(function app(window) {
    let configurations = {}

    let globalObject = window[window["JS-Widget"]]
    let queue = globalObject.q
    if (queue) {
        for (var i = 0; i < queue.length; i++) {
            if (queue[i][0].toLowerCase() === "init") {
                configurations = extendObject(configurations, queue[i][1])
                createBanner(configurations)
            }
        }
    }

    globalObject.configurations = configurations
})(window)

function extendObject(a, b) {
    for (var key in b) if (b.hasOwnProperty(key)) a[key] = b[key]
    return a
}

async function createBanner(config) {
    if (!config || !config.containerId || !config.spaceId) {
        const content = document.createElement("div")
        content.style =
            "width: 300px; height:100px; border-radius: 8px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: red; display: grid; place-content: center; padding: 2rem; box-sizing: border-box; text-wrap: balance; color: white; font-family: monospace;"

        if (!config.containerId) {
            content.innerHTML =
                'containerId is missing from script initialization: <br> mb("init", { containerId: "" })'

            document.body.appendChild(content)
            return
        }

        if (!config.spaceId) {
            content.innerText =
                'spaceId is missing from script initialization: <br> mb("init", { spaceId: "" })'

            document.body.appendChild(content)
            return
        }

        document.body.appendChild(content)
        return
    } else {
        const container = document.getElementById(config.containerId)

        if (!container) {
            const content = document.createElement("div")
            content.style =
                "width: 300px; height:100px; border-radius: 8px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: red; display: grid; place-content: center; padding: 2rem; box-sizing: border-box;color: white; font-family: monospace;"

            content.innerText = `container with id ${config.containerId} not found`

            document.body.appendChild(content)
            return
        }
    }

    const response = await fetch(
        `https://hexnlzzh3m.execute-api.eu-central-1.amazonaws.com/dev/api/v1/banners/space/${config.spaceId}`
    )
    const banners = await response.json()
    const statistics = await getStats()

    if (Array.isArray(banners) && banners.length > 1) {
        createSlider(config, banners, statistics)
    } else {
        const content = document.createElement("div")
        content.style.width = "100%"
        content.style.height = "100%"
        const image = new Image()
        image.src = `http://betdemo.s3.eu-central-1.amazonaws.com/${banners[0].preview}`
        image.style =
            "display: block; width: 100%; height: 100%; object-fit: cover"
        image.setAttribute("data-id", banners[0].id)
        image.addEventListener("click", () =>
            onBannerClick(
                banners[0].id,
                config.spaceId,
                config.skinId,
                statistics
            )
        )

        content.appendChild(image)

        const container = document.getElementById(config.containerId)
        container.appendChild(content)

        const observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const bannerId = entry.target.getAttribute("data-id")
                        onBannerView(
                            bannerId,
                            config.spaceId,
                            config.skinId,
                            statistics
                        )
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.5 }
        )
        observer.observe(image)
    }
}

function createSlider(config, banners, statistics) {
    let interval,
        currentIndex = 0

    const slider = document.createElement("div")
    slider.style = "overflow: hidden; height: 300px; position: relative"

    const track = document.createElement("div")
    if (config.transition === "slide") {
        track.style = "display: flex;transition: transform 0.5s ease;"
    } else {
        track.style = "position: relative; height: 100%;"
    }
    slider.appendChild(track)

    banners.forEach((banner, index) => {
        const slide = document.createElement("img")
        if (config.transition === "slide") {
            slide.style =
                "display: block; width: 100%; height: 100%; object-fit: cover"
        } else {
            slide.style =
                "position: absolute; width: 100%; height: 100%; opacity: 0; transition: opacity 1s ease-in-out; object-fit: cover"

            if (index === 0) slide.style.opacity = "1"
        }
        slide.setAttribute("data-id", banner.id)
        slide.src = `http://betdemo.s3.eu-central-1.amazonaws.com/${banner.preview}`
        slide.addEventListener("click", () =>
            onBannerClick(banner.id, config.spaceId, config.skinId, statistics)
        )
        track.appendChild(slide)
    })

    if (config.transition === "slide") {
        const firstClone = track.firstElementChild.cloneNode(true)
        track.appendChild(firstClone)
    }

    const container = document.getElementById(config.containerId)
    container.appendChild(slider)

    const slideWidth = track.firstElementChild.offsetWidth

    function moveToNextSlide() {
        if (
            config.infiniteLoop === "no" &&
            currentIndex === banners.length - 2
        ) {
            stopSliding()
        }

        if (config.transition === "slide") {
            if (currentIndex >= banners.length) {
                track.style.transition = "none"
                currentIndex = 0
                track.style.transform = `translateX(-${
                    currentIndex * slideWidth
                }px)`
                track.offsetHeight
                track.style.transition = "transform 0.5s ease"
            }

            currentIndex++
            track.style.transform = `translateX(-${
                currentIndex * slideWidth
            }px)`
        } else {
            const slides = track.childNodes
            slides[currentIndex].style.opacity = "0"
            currentIndex = (currentIndex + 1) % slides.length
            slides[currentIndex].style.opacity = "1"
        }
    }

    if (config.navigation.includes("arrows")) {
        function nextSlide() {
            const slides = track.childNodes
            const dots = document.getElementById("pagination").childNodes

            slides[currentIndex].style.opacity = "0"
            dots[currentIndex].style.backgroundColor = "transparent"
            currentIndex = (currentIndex + 1) % slides.length
            slides[currentIndex].style.opacity = "1"
            dots[currentIndex].style.backgroundColor = "#fff"
        }

        function prevSlide() {
            const slides = track.childNodes
            const dots = document.getElementById("pagination").childNodes

            slides[currentIndex].style.opacity = "0"
            dots[currentIndex].style.backgroundColor = "transparent"
            currentIndex = (currentIndex - 1 + slides.length) % slides.length
            slides[currentIndex].style.opacity = "1"
            dots[currentIndex].style.backgroundColor = "#fff"
        }

        const nextBtn = document.createElement("button")
        nextBtn.innerHTML = `
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-chevron-right"
            >
                <path d="m9 18 6-6-6-6" />
            </svg>
        `
        nextBtn.style =
            "position: absolute; z-index: 2; top: 50%; transform: translateY(-50%); right: 0.5rem; display: grid; place-content: center; width: 2rem; aspect-ratio: 1; padding: 0; border: 0; background-color: transparent; color: #fff; cursor: pointer;"
        const prevBtn = document.createElement("button")
        prevBtn.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-chevron-left"
        >
            <path d="m15 18-6-6 6-6" />
        </svg>
    `
        prevBtn.style =
            "position: absolute; z-index: 2; top: 50%; transform: translateY(-50%); left: 0.5rem; display: grid; place-content: center; width: 2rem; aspect-ratio: 1; padding: 0; border: 0; background-color: transparent; color: #fff; cursor: pointer;"

        nextBtn.addEventListener("click", nextSlide)
        prevBtn.addEventListener("click", prevSlide)

        slider.appendChild(nextBtn)
        slider.appendChild(prevBtn)
    }

    function goToSlide(index) {
        const dots = document.getElementById("pagination").childNodes
        const slides = track.childNodes
        slides[currentIndex].style.opacity = "0"
        dots[currentIndex].style.backgroundColor = "transparent"
        currentIndex = index
        slides[index].style.opacity = "1"
        dots[index].style.backgroundColor = "#fff"
    }

    if (config.navigation.includes("dots")) {
        const slides = track.childNodes
        const pagination = document.createElement("div")
        pagination.id = "pagination"
        pagination.style =
            "display: flex; gap: 8px; position: absolute; left: 50%; transform: translateX(-50%); top: 1rem; z-index: 2;"

        slides.forEach((_, index) => {
            const dot = document.createElement("button")
            dot.style =
                "width: 10px; height: 10px; border: 1px solid #fff; border-radius: 50%; background-color: transparent; padding: 0; margin: 0;"
            dot.addEventListener("click", () => goToSlide(index))
            pagination.appendChild(dot, pagination)

            if (index === 0) dot.style.backgroundColor = "#fff"
        })

        slider.appendChild(pagination)
    }

    const intervalTime = config.transitionSpeed
        ? parseInt(config.transitionSpeed) * 1000
        : 2000

    function startSliding() {
        interval = setInterval(moveToNextSlide, intervalTime)
    }

    function stopSliding() {
        clearInterval(interval)
    }

    if (config.pauseOnHover === "yes") {
        slider.addEventListener("mouseenter", stopSliding)
        slider.addEventListener("mouseleave", startSliding)
    }

    if (config.autoplay === "yes") {
        startSliding()
    }

    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const bannerId = entry.target.getAttribute("data-id")
                    onBannerView(
                        bannerId,
                        config.spaceId,
                        config.skinId,
                        statistics
                    )
                    observer.unobserve(entry.target)
                }
            })
        },
        {
            threshold: 0.5,
        }
    )

    Array.from(track.childNodes)
        .slice(0, -1)
        .forEach((banner) => observer.observe(banner))
}

async function onBannerView(bannerId, spaceId, skinId, statistics) {
    const body = {
        skinId,
        spaceId,
        bannerId,
        ...statistics,
    }

    if (bannerId && spaceId && skinId) {
        const headers = new Headers()
        headers.append("Content-Type", "application/json")

        fetch(
            "https://hexnlzzh3m.execute-api.eu-central-1.amazonaws.com/dev/api/v1/views/addview",
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            }
        )
    }
}

async function onBannerClick(bannerId, spaceId, skinId, statistics) {
    const body = {
        skinId,
        spaceId,
        bannerId,
        ...statistics,
    }

    if (bannerId && spaceId && skinId) {
        const headers = new Headers()
        headers.append("Content-Type", "application/json")

        fetch(
            "https://hexnlzzh3m.execute-api.eu-central-1.amazonaws.com/dev/api/v1/views/addclick",
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            }
        )
    }
}

async function getStats() {
    const platform = getOS()
    const device = getDevice()
    const browser = getBrowser()
    const language = getLanguage()
    const location = await getUserLocation()

    return {
        device,
        browser,
        platform,
        language,
        ip: location.query,
        city: location.city,
        country: location.country,
    }
}

function getLanguage() {
    const locale = navigator.language || navigator.userLanguage

    if (locale) {
        const languageNames = new Intl.DisplayNames(["en"], {
            type: "language",
        })

        return languageNames.of(locale)
    }

    return "Other"
}

async function getUserLocation() {
    try {
        let response = await fetch("http://ip-api.com/json")
        let data = await response.json()
        return data
    } catch (error) {
        return "Unavailable"
    }
}

function getOS() {
    const userAgent = navigator.userAgent

    if (userAgent.indexOf("Win") !== -1) return "Windows"
    if (userAgent.indexOf("Mac") !== -1) return "MacOS"
    if (userAgent.indexOf("X11") !== -1) return "UNIX"
    if (userAgent.indexOf("Linux") !== -1) return "Linux"
    if (/Android/.test(userAgent)) return "Android"
    if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS"

    return "Other"
}

function getDevice() {
    const userAgent = navigator.userAgent || window.opera

    if (/android/i.test(userAgent)) {
        return "Android Device"
    }
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS Device"
    }

    if (/Samsung|SM-|GT-|SCH-|SGH-|SHV-|SHW-|SPH-|SCH-/i.test(userAgent)) {
        return "Samsung Device"
    }
    if (/Pixel/.test(userAgent)) {
        return "Google Pixel Device"
    }
    if (/Windows Phone/i.test(userAgent)) {
        return "Windows Phone"
    }

    if (/Macintosh|Mac OS X/.test(userAgent)) {
        return "Macintosh"
    }
    if (/Windows NT/.test(userAgent)) {
        return "Windows PC"
    }
    if (/Linux/.test(userAgent)) {
        return "Linux PC"
    }

    return "Other"
}

function getBrowser() {
    const userAgent = navigator.userAgent

    if (/Edg/i.test(userAgent)) {
        return "Edge"
    }
    if (/OPR|Opera/i.test(userAgent)) {
        return "Opera"
    }
    if (/Chrome/i.test(userAgent)) {
        return "Chrome"
    }
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
        return "Safari"
    }
    if (/Firefox/i.test(userAgent)) {
        return "Firefox"
    }
    if (/MSIE|Trident/i.test(userAgent)) {
        return "Explorer"
    }

    return "Other"
}
