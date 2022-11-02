const clientId = "eb2bbd12992d493cb68fc7660ad64efa";
const scopes = "user-top-read user-follow-read playlist-read-private user-library-read";
const redirectUri = "http://localhost:3000/login/login.html";

const authorizeUser = () => {
    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes}&show_dialog=true`;
    window.open(url, "login", "width=800,height=600");
}

document.addEventListener("DOMContentLoaded", () =>{
    const loginButton = document.getElementById("login-to-spotify");
    loginButton.addEventListener("click", authorizeUser);

})