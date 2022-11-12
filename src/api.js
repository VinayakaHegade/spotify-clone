import { ACCESS_TOKEN, EXPIRES_IN, logOut, TOKEN_TYPE } from "./common";

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

const getAccessToken = () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    const expiresIn = localStorage.getItem(EXPIRES_IN);
    const tokenType = localStorage.getItem(TOKEN_TYPE);
    if(Date.now() < expiresIn){
        return {accessToken,expiresIn}
    }else{
        logOut();
    }

}

const createAPIConfig = ({accessToken, tokenType}, method = "GET") => {
    return{
            headers : {
                Authorization : 'Bearer ' + accessToken
            },
            method
    }

}

export const fetchRequest = async (endpoint) => {
    const url =`${BASE_API_URL}/${endpoint}`;
    const result = await fetch(url, createAPIConfig(getAccessToken()));
    return result.json();
}