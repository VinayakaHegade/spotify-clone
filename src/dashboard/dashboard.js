import { fetchRequest } from "../api";
import {
  ENDPOINT,
  getItemFromLocalStorage,
  LOADED_TRACKS,
  logOut,
  SECTIONTYPE,
  setItemsInLocalStorage,
} from "../common";

let displayName;
const audio = new Audio();
const onProfileClick = (event) => {
  event.stopPropagation();
  const profileMenu = document.querySelector("#profile-menu");
  profileMenu.classList.toggle("hidden");
  if (!profileMenu.classList.contains("hidden")) {
    profileMenu.querySelector("li#logout").addEventListener("click", logOut);
  }
};

const loadUserProfile = () => {
  return new Promise(async(resolve, reject)=>{

    const defaultImage = document.querySelector("#default-image");
    const userProfileButton = document.querySelector("#user-profile-button");
    const displayNameElement = document.querySelector("#display-name");

    const { display_name: displayName, images } = await fetchRequest(
      ENDPOINT.userInfo
    );

    if (images?.length) {
      defaultImage.classList.add("hidden");
    } else {
      defaultImage.classList.remove("hidden");
    }

    userProfileButton.addEventListener("click", onProfileClick);
    displayNameElement.textContent = displayName;

    resolve({displayName,images});

  })
  
};

//When a playlist item is clicked

const onPlaylistItemClicked = (event, id) => {
  const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
  history.pushState(section, "", `playlist/${id}`);
  loadSection(section);
};

//Playlist loading

const loadPlaylist = async (endpoint, elementId) => {
  const {
    playlists: { items },
  } = await fetchRequest(endpoint);
  const playlistItemsSection = document.querySelector(`#${elementId}`);

  for (let { name, description, images, id } of items) {
    const playlistItem = document.createElement("section");
    playlistItem.className =
      " bg-black-secondary rounded p-4 hover:cursor-pointer hover:bg-light-black";
    playlistItem.id = id;
    playlistItem.setAttribute("data-type", "playlist");
    playlistItem.addEventListener("click", (event) =>
      onPlaylistItemClicked(event, id)
    );
    const [{ url: imageUrl }] = images;
    playlistItem.innerHTML = `<img src="${imageUrl}" alt="${name}" class ="rounded mb-2 object-contain shadow"/>
            <h2 class="song-title text-base font-semibold mb-4 truncate">${name}</h2>
            <h3 class="text-sm text-light-gray line-clamp-2
            ">${description}</h3>`;

    playlistItemsSection.appendChild(playlistItem);
  }
};

const loadPlaylists = () => {
  loadPlaylist(ENDPOINT.featuredPlaylist, "featured-playlist-items");
  loadPlaylist(ENDPOINT.toplists, "top-playlist-items");
};

const fillDashboardContent = () => {
  const coverElement = document.querySelector("#cover-content");
  coverElement.innerHTML = `<h1 class="text-8xl">Hello ${displayName}</h1>`;
  const pageContent = document.querySelector("#page-content");
  const playlistMap = new Map([
    ["featured", "featured-playlist-items"],
    ["top playlist", "top-playlist-items"],
  ]);
  let innerHTML = "";
  for (let [type, id] of playlistMap) {
    innerHTML += `<article class="p-4">
    <h1 class="mb-4 text-2xl font-bold capitalize">${type}</h1>
    <section id="${id}" class="featured-songs grid grid-cols-auto-fill-cards gap-4">
    </section>
  </article>`;
  }
  pageContent.innerHTML = innerHTML;
};

//Function to convert duration from Milliseconds to Minutes and Seconds(m:ss)

const formatTime = (duration) => {
  const milliSecondsInOneMinute = 60000;
  const min = Math.floor(duration / milliSecondsInOneMinute); //duration is in Milliseconds
  const sec = ((duration % 6000) / 1000).toFixed(0);
  const formattedTime =
    sec == 60 ? min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
  return formattedTime;
};

const onTrackSelection = (id,event) => {
  document.querySelectorAll("#tracks .track").forEach((trackItem) => {
    if (trackItem.id === id) {
      trackItem.classList.add("bg-gray", "selected");
    } else {
      trackItem.classList.remove("bg-gray", "selected");
    }
  });
};

const onAudioMetadataLoaded = () => {
  const totalSongDuration = document.querySelector("#total-song-duration");
  totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
};

const updateIconsForPauseMode = (id) => {
  const playButton = document.querySelector("#play");

  playButton.querySelector("span").textContent = "play_circle";
  const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
  if (playButtonFromTracks) {
    playButtonFromTracks.textContent = "play_arrow";
  }
};

const updateIconsForPlayMode = (id) => {
  const playButton = document.querySelector("#play");

  playButton.querySelector("span").textContent = "pause_circle";
  const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
  if (playButtonFromTracks) {
    playButtonFromTracks.textContent = "pause";
  }
};



//Function to play the selected song

const playTrack = (
  event,
  { image, artistNames, name, duration, previewUrl, id }
) => {
  if (event?.stopPropagation) {
    event.stopPropagation();
  }
  if (audio.src === previewUrl) {
    togglePlay();
  } else {
    
    setNowPlayingInfo({ image, id, name, artistNames});
    audio.src = previewUrl;
    audio.play();
  }
};

const setNowPlayingInfo = ({ image, id, name, artistNames}) => {
  const audioControl = document.querySelector("#audio-control");
  const songTitle = document.querySelector("#now-playing-song");
  const nowPlayingSongImage = document.querySelector("#now-playing-image");
  const artists = document.querySelector("#now-playing-artists");
  const songInfo = document.querySelector("#song-info");

  nowPlayingSongImage.src = image.url;
  audioControl.setAttribute("data-track-id", id);
  songTitle.textContent = name;
  artists.textContent = artistNames;
  songInfo.classList.remove("invisible");
}

const loadPlaylistTracks = ({ tracks }) => {
  const trackSections = document.querySelector("#tracks");

  let trackNumber = 1;
  const loadedTracks = [];

  //Creating track section

  for (let trackItem of tracks.items.filter(item => item.track.preview_url)) {
    let {
      id,
      artists,
      name,
      album,
      duration_ms: duration,
      preview_url: previewUrl,
    } = trackItem.track;
    let { added_at } = trackItem;

    let track = document.createElement("section");
    track.id = id;
    track.className =
      "track p-1 grid grid-cols-[50px_1fr_1fr_.5fr_50px] items-center justify-items-start gap-4 rounded-md hover:bg-light-black";
    let image = album.images.find(img => img.height === 64);
    let artistNames = Array.from(artists, artist => artist.name).join(", ");

    track.innerHTML = `<p class="relative w-full flex items-center justify-center justify-self-center"><span class="track-number">${trackNumber++}</span></p>
              <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
                <img class="h-10 w-10" src="${image.url}" alt="${name}"/>
                <article class="flex flex-col gap-2 justify-center">
                  <h2 class="text-base text-white line-clamp-1 song-title">${name}</h2>
                  <p class="text-xs line-clamp-1">${artistNames}</p>
                </article>
              </section>
              <p class="text-sm line-clamp-2">${album.name}</p>
              <p class="text-sm line-clamp-2">${timeDifference(added_at)}</p>
              <p class="text-sm line-clamp-1">${formatTime(duration)}</p>`;

    track.addEventListener("click", (event) => onTrackSelection(id, event));
    const playButton = document.createElement("button");
    playButton.id = `play-track-${id}`;
    playButton.className = `play w-full absolute left-0 text-4xl invisible material-symbols-outlined`;
    playButton.textContent = "play_arrow";
    playButton.addEventListener("click", (event) =>
      playTrack(event, { image, artistNames, name, duration, previewUrl, id })
    );
    track.querySelector("p").appendChild(playButton);

    trackSections.appendChild(track);

    loadedTracks.push({
      id,
      artistNames,
      name,
      album,
      duration,
      previewUrl,
      image,
    });
  }

  setItemsInLocalStorage(LOADED_TRACKS, loadedTracks);
};

//Loads and changes the section content dynamically based on where we are in the page

const fillPlaylistContent = async (playlistId) => {
  const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`);
  // console.log(playlist);
  const { name, description, images, tracks, followers } = playlist;
  const coverElement = document.querySelector("#cover-content");
  coverElement.innerHTML = `<img class="object contain" src="${images[0].url}" alt="${name}"/>
          <section class="flex flex-col justify-center gap-1">
          <h2 id="playlist-name" class="text-6xl font-extrabold">${name}</h2>
          <p id="playlist-details" class="text-light-gray">${description}</p>
          <p id="playlist-details" class="font-bold">${tracks.items.length} songs . ${followers.total} followers</p>
          </section>`;
  const pageContent = document.querySelector("#page-content");
  pageContent.innerHTML = `<header id="playlist-header" class="mx-8 border-light-gray border-b-[0.5px] z-10">
          <nav class="py-2">
            <ul class="grid grid-cols-[50px_1fr_1fr_.5fr_50px] gap-4 text-light-gray">
              <li class="justify-self-center">#</li>
              <li>TITLE</li>
              <li>ALBUM</li>
              <li>DATE ADDED</li>
              <li><span style="font-size:22px" class="material-symbols-outlined pt-1">schedule</span></li>
            </ul>
          </nav>
        </header>
        <section id="tracks" class="px-8 text-light-gray mt-4">
        </section>`;

  loadPlaylistTracks(playlist);

  // console.log(playlist);
};

const onContentScroll = (event) => {
  const { scrollTop } = event.target;
  const header = document.querySelector(".header");
  const coverElement = document.querySelector("#cover-content");
  const totalHeight = coverElement.offsetHeight;
  const fiftyPercentHeight = totalHeight / 2;
  const coverOpacity =
    100 - (scrollTop >= totalHeight ? 100 : (scrollTop / totalHeight) * 100);
  coverElement.style.opacity = `${coverOpacity}%`;

  // const headerOpacity = scrollTop >= header.offsetHeight ? 100 : (scrollTop / header.offsetHeight* 100;
  // header.style.background = `rgba(0 0  0 / ${headerOpacity}%)`;

  let headerOpacity = 0;

  // once 50% of cover element is crossed, start increasing the opacity
  if(scrollTop >= fiftyPercentHeight && scrollTop  <= totalHeight){
    let totalDistance = totalHeight - fiftyPercentHeight;
    let coverDistance = scrollTop - fiftyPercentHeight;
    headerOpacity = (coverDistance/totalDistance) * 100;
  }else if (scrollTop > totalHeight) {
    headerOpacity  = 100;
  }else if(scrollTop < fiftyPercentHeight) {
    headerOpacity = 0;
  }
  header.style.background = `rgba(0 0 0 / ${headerOpacity})`

  if (history.state.type == SECTIONTYPE.PLAYLIST) {
    const playlistHeader = document.querySelector("#playlist-header");
    if (coverOpacity >= 60) {
      playlistHeader.classList.add("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.remove("mx-8");
      playlistHeader.style.top = `${header.offsetHeight}px`;
    } else {
      playlistHeader.classList.remove("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.add("mx-8");
      playlistHeader.style.top = `revert`;
    }
  }
};

const togglePlay = () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }
};

const findCurrentTrack = () => {
  const audioControl = document.querySelector("#audio-control");
  const trackId = audioControl.getAttribute("data-track-id");
  if (trackId) {
    const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
    const currentTrackIndex = loadedTracks?.findIndex(track => track.id === trackId);
    return { currentTrackIndex, tracks: loadedTracks };
  }
  return null;
};

const playPreviousTrack = () => {
  const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
  if (currentTrackIndex > 0) {
    const previousTrack = tracks[currentTrackIndex - 1];
    playTrack(null, previousTrack);

  }
};

const playNextTrack = () => {
  const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
  if (currentTrackIndex > -1 && currentTrackIndex < tracks?.length-1) {
    const currentTrack = tracks[currentTrackIndex+1];
    playTrack(null, currentTrack);
  }
};

const loadSection = (section) => {
  if (section.type === SECTIONTYPE.DASHBOARD) {
    fillDashboardContent();
    loadPlaylists();
  } else if (section.type === SECTIONTYPE.PLAYLIST) {
    //load elements for playlist
    fillPlaylistContent(section.playlist);
  }

  document
    .querySelector(".content")
    .removeEventListener("scroll", onContentScroll);
  document
    .querySelector(".content")
    .addEventListener("scroll", onContentScroll);
};

const onUserPlaylistClick = (id) => {
  const section = {type:SECTIONTYPE.PLAYLIST, playlist: id};
  history.pushState(section,"", `/playlist/${id}`);
  loadSection(section);
}

const loadUserPlaylist = async ()=>{
  const playlists =  await fetchRequest(ENDPOINT.userPlaylist);
  console.log(playlists);
  const userPlaylist = document.querySelector("#user-playlists >ul");
  userPlaylist.innerHTML = "";
  for (let {name, id } of playlists.items){
    const li = document.createElement("li");
    li.textContent =  name;
    li.className = "cursor-pointer hover:text-white";
    li.addEventListener("click", ()=>onUserPlaylistClick(id));
    userPlaylist.appendChild(li);
  }
}

document.addEventListener("DOMContentLoaded", async() => {
  const volume = document.querySelector("#volume");
  const playButton = document.querySelector("#play");
  const nextTrack = document.querySelector("#next");
  const previousTrack = document.querySelector("#previous");
  const songDurationCompleted = document.querySelector(
    "#song-duration-completed"
  );
  const songProgress = document.querySelector("#progress");
  const timeline = document.querySelector("#timeline");
  const audioControl = document.querySelector("#audio-control");
  
  let progressInterval;

({displayName} = await loadUserProfile());
loadUserPlaylist();

const section = { type: SECTIONTYPE.DASHBOARD };
history.pushState(section, "", "");

loadSection(section);
document.addEventListener("click", () => {
    const profileMenu = document.querySelector("#profile-menu");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.classList.add("hidden");
    }
  });

  audio.addEventListener("loadedmetadata", onAudioMetadataLoaded);
  audio.addEventListener("play", () => {
    const selectedTrackId = audioControl.getAttribute("data-track-id");
    const tracks = document.querySelector("#tracks");
    const playingTrack = tracks?.querySelector("section.playing");
    const selectedTrack = tracks?.querySelector(`[id="${selectedTrackId}"]`);
    if (playingTrack?.id !== selectedTrack?.id) {
      playingTrack?.classList.remove("playing");
    }
    selectedTrack?.classList.add("playing");
    progressInterval = setInterval(() => {
      if (audio.paused) {
        return;
      }
      songDurationCompleted.textContent = `${
        audio.currentTime.toFixed(0) < 10
          ? "0:0" + audio.currentTime.toFixed(0)
          : "0:" + audio.currentTime.toFixed(0)
      }`;
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    }, 100);
    updateIconsForPlayMode(selectedTrackId);
  });

  audio.addEventListener("pause", () => {
    if (progressInterval) {
      clearInterval();
    }
    const selectedTrackId = audioControl.getAttribute("data-track-id");
    updateIconsForPauseMode(selectedTrackId);
  });

  // audio.addEventListener("loadedmetadata", onAudioMetadataLoaded);

  // changing song current time by clicking on timeline
  volume.addEventListener("change", () => {
    audio.volume = volume.value / 100;
  });
  timeline.addEventListener(
    "click",
    (event) => {
      const timelineWidth = window.getComputedStyle(timeline).width;
      const timeToSeek =
        (event.offsetX / parseInt(timelineWidth)) * audio.duration;
      audio.currentTime = timeToSeek;
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    },
    false
  );

  playButton.addEventListener("click", togglePlay);
  previousTrack.addEventListener("click", playPreviousTrack);
  nextTrack.addEventListener("click", playNextTrack);

  window.addEventListener("popstate", (event) => {
    loadSection(event.state);
  });
});

//function which converts timestamp to relative time i.e, timestamp to time ago

// function timeDifference(previous) {

//     var msPerMinute = 60 * 1000;
//     var msPerHour = msPerMinute * 60;
//     var msPerDay = msPerHour * 24;
//     var msPerMonth = msPerDay * 30;
//     var msPerYear = msPerDay * 365;

//     var now = new Date();
//     var current = now.getTime();
//     var elapsed = current - previous;

//     if (elapsed < msPerMinute) {
//          return Math.round(elapsed/1000) + ' seconds ago';
//     }

//     else if (elapsed < msPerHour) {
//          return Math.round(elapsed/msPerMinute) + ' minutes ago';
//     }

//     else if (elapsed < msPerDay ) {
//          return Math.round(elapsed/msPerHour ) + ' hours ago';
//     }

//     else if (elapsed < msPerMonth) {
//         return Math.round(elapsed/msPerDay) + ' days ago';
//     }

//     else if (elapsed < msPerYear) {
//         return Math.round(elapsed/msPerMonth) + ' months ago';
//     }

//     else {
//         return Math.round(elapsed/msPerYear ) + ' years ago';
//     }
// }

function timeDifference(added_at) {
  let timestamp = new Date(added_at);
  let previous = timestamp.getTime(); //in  milliseconds

  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var now = new Date();
  var current = now.getTime();
  var elapsed = current - previous;

  var result = "";

  if (elapsed < msPerMinute) {
    result = Math.floor(elapsed / 1000) + " second";
  } else if (elapsed < msPerHour) {
    result = Math.floor(elapsed / msPerMinute) + " minute";
  } else if (elapsed < msPerDay) {
    result = Math.floor(elapsed / msPerHour) + " hour";
  } else if (elapsed < msPerMonth) {
    result = Math.floor(elapsed / msPerDay) + " day";
  } else if (elapsed < msPerYear) {
    result = Math.floor(elapsed / msPerMonth) + " month";
  } else {
    result = Math.floor(elapsed / msPerYear) + " year";
  }

  const substrings = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  if (substrings.some((substring) => result.includes(substring))) {
    return result + "s" + " ago";
  } else if (/[1-1]/.test(result)) {
    return result + " ago";
  } else {
    return result + "s" + " ago";
  }
}
