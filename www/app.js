let state = {
    currentTab: 'feed',
    activeFilter: 'all',
    posts: [
        { id: 1, user: 'Alex', userId: 'alex_123', title: 'Můj nový skate trik!', type: 'short', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        { id: 2, user: 'Klara', userId: 'klara_99', title: 'Celý vlog z výletu do hor', type: 'long', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' }
    ],
    currentUser: { name: 'Ty', id: 'my_id_01' }
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    state.currentTab = tabId;
    if (tabId === 'feed') renderFeed();
}

function filterFeed(type) {
    state.activeFilter = type;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderFeed();
}

function renderFeed() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    const filtered = state.posts.filter(p => state.activeFilter === 'all' || p.type === state.activeFilter);

    filtered.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
            <div class="post-header" onclick="openProfile('${post.userId}', '${post.user}')">@${post.user} (${post.type.toUpperCase()})</div>
            <h3>${post.title}</h3>
            <video src="${post.videoUrl}" controls playsinline></video>
        `;
        container.appendChild(card);
    });
}

function handleUpload(event) {
    event.preventDefault();
    const title = document.getElementById('post-title').value;
    const type = document.getElementById('post-type').value;
    const fileInput = document.getElementById('post-file');
    
    if (fileInput.files && fileInput.files[0]) {
        const videoUrl = URL.createObjectURL(fileInput.files[0]);
        state.posts.unshift({
            id: Date.now(),
            user: state.currentUser.name,
            userId: state.currentUser.id,
            title,
            type,
            videoUrl
        });
        switchTab('feed');
    }
}

function openProfile(userId, userName) {
    switchTab('profile');
    document.getElementById('profile-name').innerText = `@${userName}`;
    document.getElementById('profile-bio').innerText = `Ahoj, já jsem ${userName} a tohle je můj Kaboom profil!`;
    
    const userPostsContainer = document.getElementById('profile-posts');
    userPostsContainer.innerHTML = '<h3>Příspěvky uživatele:</h3>';
    
    const userPosts = state.posts.filter(p => p.userId === userId);
    userPosts.forEach(post => {
        const pElem = document.createElement('div');
        pElem.innerHTML = `<p><b>${post.title}</b> (${post.type})</p>`;
        userPostsContainer.appendChild(pElem);
    });
}

let localStream = null;
let cameraActive = true;
let micActive = true;

async function startLivestream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('local-video').srcObject = localStream;
        alert("Livestream spuštěn!");
    } catch (err) {
        alert("Nepodařilo se zapnout kameru/mikrofon: " + err.message);
    }
}

function toggleCamera() {
    if (!localStream) return;
    cameraActive = !cameraActive;
    localStream.getVideoTracks().forEach(track => track.enabled = cameraActive);
    document.getElementById('btn-toggle-cam').innerText = cameraActive ? "Vypnout kameru" : "Zapnout kameru";
}

function toggleMic() {
    if (!localStream) return;
    micActive = !micActive;
    localStream.getAudioTracks().forEach(track => track.enabled = micActive);
    document.getElementById('btn-toggle-mic').innerText = micActive ? "Vypnout zvuk" : "Zapnout zvuk";
}

window.onload = () => {
    renderFeed();
};
