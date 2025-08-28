console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs = [];
let currFolder = "";

// Format seconds into mm:ss
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch songs from songs.json in the selected folder
async function getSongs(folder) {
    currFolder = folder;
    let response = await fetch(`/${folder}/songs.json`);
    let data = await response.json();
    songs = data.songs || [];
    // console.log("Songs found in", folder, songs);

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    if (songs.length === 0) {
        songUL.innerHTML = `
            <li class="empty">
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info" style="font-size: 20px;">
                    <div>😴 No songs here yet…</div>
                </div>
            </li>`;
        return songs;
    }

    // Render song list
    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>Kapil</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div>
            </li>`;
    }

    // Attach listeners to play songs
    Array.from(songUL.getElementsByTagName("li")).forEach(e => {
        if (!e.classList.contains("empty")) {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        }
    });

    return songs;
}

// Play selected track
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// Display albums from albums.json
// Display albums dynamically using info.json inside each folder
// Display albums dynamically from albums.json and info.json
async function displayAlbums() {
    // console.log("displaying albums");

    let response = await fetch(`/songs/albums.json`);
    let data = await response.json();
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (const album of data.albums) {
        try {
            // Fetch info.json for the album
            let metaResponse = await fetch(`/songs/${album.folder}/info.json`);
            let info = await metaResponse.json();

            // Build the album card
            cardContainer.innerHTML += `
                <div data-folder="${album.folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${album.folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
        } catch (err) {
            console.error(`Missing or invalid info.json in ${album.folder}`);
        }
    }

    // Click event for playing songs in selected album
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async event => {
            let folder = event.currentTarget.dataset.folder;
            console.log("Loading songs for:", folder);
            let loadedSongs = await getSongs(`songs/${folder}`);
            if (loadedSongs.length > 0) playMusic(loadedSongs[0]);
        });
    });
}



// Initialize the player
async function main() {
    let loadedSongs = await getSongs("songs/Arjit_singh");

    if (loadedSongs.length > 0) playMusic(loadedSongs[0], true);


    // // Reset bottom bar
    // document.querySelector(".songinfo").innerHTML = "Select a song to play";
    // document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    await displayAlbums();

    const playBtn = document.getElementById("play");
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");

    // Play/Pause toggle
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Update progress bar
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seek bar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Sidebar controls
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous button
    prevBtn.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");

        let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentTrack);

        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next button
    nextBtn.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked");

        let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentTrack);

        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    // Auto-play next song when current ends
    currentSong.addEventListener("ended", () => {
        let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentTrack);

        if (index < songs.length - 1) {
            // Play next song in the playlist
            playMusic(songs[index + 1]);
        } else {
            // Reached the end of playlist
            console.log("End of playlist");
            play.src = "img/play.svg"; // reset play icon
            currentSong.currentTime = 0; // reset time
        }
    });



    // Volume slider
    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
        document.querySelector(".volume img").src =
            currentSong.volume > 0
                ? document.querySelector(".volume img").src.replace("mute.svg", "volume.svg")
                : document.querySelector(".volume img").src.replace("volume.svg", "mute.svg");
    });

    // Mute toggle
    document.querySelector(".volume img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
