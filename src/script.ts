import { generateCodeChallenge } from "./helper/code-challenge-helper";
import { generateRandomString } from "./helper/random-string.helper";
import { LocalStorageService } from "./services/local-storage.service";

const localStorageService = new LocalStorageService();

main();

async function main() {
  const accessToken: string | undefined =
    localStorageService.get("spotify_access_token") ?? (await auth());
  if (accessToken) {
    loadAndProfileShow(accessToken);
  }
}

async function auth(): Promise<string | undefined> {
  const clientId = "ce5672c90533410d9d0fe5b85304db0e";
  const params = new URLSearchParams(window.location.search);
  const code: string | null = params.get("code");

  if (!code) {
    redirectToAuthCodeFlow(clientId);
  } else {
    const accessToken = await getAccessToken(clientId, code);
    localStorageService.set("spotify_access_token", accessToken);
    return accessToken;
  }
}

async function loadAndProfileShow(accessToken: string) {
  try {
    const profile = await fetchProfile(accessToken);
    populateUI(profile);
  } catch (error) {
    console.log("redirecting to access spotify again.");
  }
}

async function redirectToAuthCodeFlow(clientId: string) {
  const codeVerifier = generateRandomString(128);
  localStorageService.set("verifier", codeVerifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("scope", "user-read-private user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", await generateCodeChallenge(codeVerifier));

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken(
  clientId: string,
  code: string
): Promise<string> {
  const verifier = localStorageService.get("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("code_verifier", verifier!);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchProfile(token: string): Promise<UserProfile> | never {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("response: ", response);

  if (response.ok) {
    return await response.json();
  } else {
    auth();
    localStorageService.unset("spotify_access_token");
    throw new Error("unauthorized");
  }
}

function populateUI(profile: UserProfile) {
  console.log("profile: ", profile);
  document.getElementById("displayName")!.innerText = profile.display_name;
  if (profile.images && profile.images[0]) {
    const profileImage = new Image(80, 80);
    profileImage.src = profile.images[0].url;
    document.getElementById("avatar")!.appendChild(profileImage);
  }
  document.getElementById("id")!.innerText = profile.id;
  document.getElementById("email")!.innerText = profile.email;
  document.getElementById("uri")!.innerText = profile.uri;
  document
    .getElementById("uri")!
    .setAttribute("href", profile.external_urls.spotify);
  document.getElementById("url")!.innerText = profile.href;
  document.getElementById("url")!.setAttribute("href", profile.href);
  document.getElementById("imgUrl")!.innerText =
    profile.images[0]?.url ?? "(no profile image)";
}
