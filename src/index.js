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
    const location = await getUserLocation()

    if (Array.isArray(banners) && banners.length > 1) {
        createSlider(config, banners, location)
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
            onBannerClick(banners[0].id, config.spaceId, location)
        )

        content.appendChild(image)

        const container = document.getElementById(config.containerId)
        container.appendChild(content)

        const observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const bannerId = entry.target.getAttribute("data-id")
                        onBannerView(bannerId, config.spaceId, location)
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.5 }
        )
        observer.observe(image)
    }
}

function createSlider(config, banners, location) {
    let currentIndex = 0
    let interval

    const slider = document.createElement("div")
    slider.style = "overflow: hidden;"

    const track = document.createElement("div")
    track.style = "display: flex;transition: transform 0.5s ease;"
    slider.appendChild(track)

    banners.forEach((banner) => {
        const slide = document.createElement("img")
        slide.className = "slide"
        slide.style =
            "display: block; width: 100%; height: 100%; object-fit: cover"
        slide.setAttribute("data-id", banner.id)
        slide.src = `http://betdemo.s3.eu-central-1.amazonaws.com/${banner.preview}`
        slide.addEventListener("click", () =>
            onBannerClick(banner.id, config.spaceId, location)
        )
        track.appendChild(slide)
    })

    const firstClone = track.firstElementChild.cloneNode(true)
    track.appendChild(firstClone)

    const container = document.getElementById(config.containerId)
    container.appendChild(slider)

    const slideWidth = track.firstElementChild.offsetWidth

    function moveToNextSlide() {
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
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`
    }

    function startSliding() {
        interval = setInterval(moveToNextSlide, 2000)
    }

    function stopSliding() {
        clearInterval(interval)
    }

    slider.addEventListener("mouseenter", stopSliding)
    slider.addEventListener("mouseleave", startSliding)

    startSliding()

    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const bannerId = entry.target.getAttribute("data-id")
                    onBannerView(bannerId, config.spaceId, location)
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

async function onBannerView(bannerId, spaceId, location) {
    const platform = getOS()
    // const device = getDevice()
    const browser = getBrowser()

    const body = {
        bannerId: bannerId,
        spaceId: spaceId,
        country: location.country,
        city: location.city,
        platform: platform,
        browser: browser,
        // device: device,
        ip: location.query,
    }

    if (bannerId && spaceId) {
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

async function onBannerClick(bannerId, spaceId, location) {
    const platform = getOS()
    // const device = getDevice()
    const browser = getBrowser()

    const body = {
        bannerId: bannerId,
        spaceId: spaceId,
        country: location.country,
        city: location.city,
        platform: platform,
        browser: browser,
        // device: device,
        ip: location.query,
    }

    if (bannerId && spaceId) {
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
    const userAgent = navigator.userAgent || navigator.vendor || window.opera

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
