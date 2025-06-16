
const staticCacheName = "site-static"
const dynamicCacheName = "site-dynamic-v1"
const assets = [
    "/",
    "index.html",
    "/index.js",
    "/index.css",
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.5",
    "icons/icon-144x144.png",
    "icons/icon-512x512.png",
    "https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1/model.json?tfjs-format=file",
    "https://storage.googleapis.com/kagglesdsdata/models/2379/3196/model.json?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=gcp-kaggle-com%40kaggle-161607.iam.gserviceaccount.com%2F20250613%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250613T154620Z&X-Goog-Expires=259200&X-Goog-SignedHeaders=host&X-Goog-Signature=176014079fa23f5e8ee33270515ef76a23e9955e547317739c4110e458a31db5c549527b27b231caed3db4bf6e0663c711e0840863ac721ac76a0e7d26cffca63206f80bd6c0f6f2d82dbebd54501e54e90b089d093492b936ee3b7c506c0366871d141d7fd321f548ea6ca537d44e35fc3796bafd7330fbad467d40e1b544300f8ee59bbdbf8bda35b0f45c3d5c60850add9237783040a05cf3a85e08e9546826d8ab519fcbaaca4e4f18714de153f9b93c2feff5dbbc65ba7b403fa5c8b53501a79ba78d16e45672f91e9c728b50bb2012d5054eef4b72506c1c4e199a6a018c6594f9813d4976b98b7aabddf2c0b08975f9f71289e7ecd10d92ae9294b06f",
    "https://www.kaggle.com/models/tensorflow/blazeface/tfJs/default/1/model.json?tfjs-format=file&tfhub-redirect=true",
    "https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1/group1-shard1of1.bin?tfjs-format=file",
    "https://storage.googleapis.com/kagglesdsdata/models/2379/3196/group1-shard1of1.bin?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=gcp-kaggle-com%40kaggle-161607.iam.gserviceaccount.com%2F20250613%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250613T154620Z&X-Goog-Expires=259200&X-Goog-SignedHeaders=host&X-Goog-Signature=4c6263b5346e53e2f5715a6a384019ddcb5e16c77e6832a6b96717d75f197bda29546fc9d34dd1e1e35e65afe59939aca0749c6ffd2b869d064df4e9847d304e19923bc22e492eb47b75181b41ed602f8ce566155d57e4ea34ae2863d9d09e62c8096394b34a05e5779e8a0558f145387563621c329c74a80ac74668d92c24122537bf970599cecf00af33fa9e0ea6c6beffca17f620f60e758c71256eeef9bf84cf1ab7aae9ddd00b1252dcfca9da181146c092d9747e79a0d9905b79c5574f121bd536497e2f50b1caa5844835f8bba7138b656cd70a9a74612e7d317f2f66349eb57780f1701144957e3182ec439bc02c88b9c3de61f35e4396332f438422",
    "https://www.kaggle.com/models/tensorflow/blazeface/tfJs/default/1/group1-shard1of1.bin?tfjs-format=file&tfhub-redirect=true",

]

const limitCacheSize = (name, size) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > size) {
                console.log(keys)
                cache.delete(keys[0]).then(limitCacheSize(name, size))
            }
        })
    })
}

// install serice worker 
self.addEventListener("install", (event) => {
    // console.log('service worker has been installed')
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                console.log('caching all assets');
                cache.addAll(assets);
            })
    )

})

// activate service worker
self.addEventListener("activate", (event) => {
    // console.log('service worker has been activated')
    event.waitUntil(
        caches.keys().then(keys => {
            // console.log(keys)
            return Promise.all(keys
                .filter(key => key !== staticCacheName && key !== dynamicCacheName)
                .map(key => caches.delete(key)))
        })
    )
})

//fetch event
self.addEventListener("fetch", (event) => {
    // console.log('fetch event', event)
    event.respondWith(
        caches.match(event.request).then(cacheRes => {
            return cacheRes || fetch(event.request).then(async fetchResponse => {
                if (!/^https?:$/i.test(new URL(event.request.url).protocol)) return;
                const cache = await caches.open(dynamicCacheName)
                cache.put(event.request.url, fetchResponse.clone())
                // limitCacheSize(dynamicCacheName, 3)
                return fetchResponse
            });
        })
            .catch(() => {
                if (event.request.url.indexOf('.html') !== -1) {
                    return caches.match("fallback.html")
                }
            })
    )
})